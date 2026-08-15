import { defineTool } from "eve/tools"
import { z } from "zod"

const UA =
  "Mozilla/5.0 (compatible; WebsiteAuditBot/1.0; +https://vercel.com) AppleWebKit/537.36"

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function textContent(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))
  return match?.[1]?.trim()
}

// Phone numbers are written very differently per country. An earlier version of
// this tool only matched "+..." and "(area) ..." formats, which silently missed
// every UK ("020 7435 2439") and French ("04 78 42 12 34") landline and produced
// a flood of false "no contact info" leads. Candidates are matched loosely and
// then validated by digit count so long ID/price strings are not mistaken for
// phone numbers.
const PHONE_CANDIDATES = [
  /\+\d[\d\s().\-/]{6,}\d/g, // international: +33 4 78 42 12 34
  /\b0\d[\d\s().\-/]{6,}\d\b/g, // national trunk prefix: 020 7435 2439, 04 78 42 12 34
  /\(\d{2,5}\)\s*\d[\d\s.\-/]{4,}\d/g, // parenthesised area code: (0161) 123 4567
  /\b\d{3}[\s.\-]\d{3}[\s.\-]\d{4}\b/g, // US style: 415-555-2671
]

function findPhones(text: string) {
  const found = new Set<string>()
  for (const pattern of PHONE_CANDIDATES) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[0].trim()
      const digits = raw.replace(/\D/g, "")
      // Real phone numbers land between 9 and 15 digits (ITU E.164 caps at 15).
      if (digits.length >= 9 && digits.length <= 15) found.add(raw)
    }
  }
  return [...found]
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g

function findEmails(text: string) {
  return [
    ...new Set(
      (text.match(EMAIL_RE) ?? [])
        // Strip URL leftovers like "//mail@example.org" picked up from hrefs.
        .map((e) => e.trim().replace(/^[^\w]+/, "").toLowerCase())
        .filter((e) => /^[\w.+-]+@[\w-]+\.[\w.]{2,}$/.test(e))
    ),
  ]
}

export default defineTool({
  description:
    "Fetch a business website and return hard quality signals plus a heuristic badness score from 0-100. Use this on every candidate that has a website URL, then apply your own judgment on top of the returned signals.",
  inputSchema: z.object({
    url: z.string().describe("The website URL to audit. Scheme optional."),
  }),
  async execute({ url }) {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
    let parsed: URL
    try {
      parsed = new URL(target)
    } catch {
      return { url, reachable: false, error: "Invalid URL", heuristicScore: 95 }
    }

    const started = Date.now()
    let response: Response
    let html: string
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      response = await fetch(parsed.toString(), {
        headers: { "user-agent": UA, accept: "text/html,*/*" },
        redirect: "follow",
        signal: controller.signal,
      })
      html = (await response.text()).slice(0, 400_000)
      clearTimeout(timer)
    } catch (error) {
      return {
        url: parsed.toString(),
        reachable: false,
        error: error instanceof Error ? error.message : "Request failed",
        heuristicScore: 92,
        issues: ["Website does not load — dead, parked, or misconfigured domain"],
      }
    }

    const loadMs = Date.now() - started
    const finalUrl = response.url || parsed.toString()
    const bytes = Buffer.byteLength(html, "utf8")
    const body = textContent(html)
    const lower = html.toLowerCase()

    const title = decodeEntities(
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
    ).trim()

    const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []
    const description =
      metaTags
        .filter((tag) => /name\s*=\s*["']description["']/i.test(tag))
        .map((tag) => attr(tag, "content"))
        .find(Boolean) ?? ""
    const hasViewport = metaTags.some((tag) =>
      /name\s*=\s*["']viewport["']/i.test(tag)
    )

    const images = html.match(/<img\b[^>]*>/gi) ?? []
    const imagesMissingAlt = images.filter((tag) => !/\balt\s*=/i.test(tag)).length
    const h1Count = (html.match(/<h1\b/gi) ?? []).length

    const isHttps = new URL(finalUrl).protocol === "https:"

    // Look in the rendered text AND in href attributes, since plenty of sites
    // expose contact details only as tel:/mailto: links.
    const telLinks = [...html.matchAll(/href\s*=\s*["']tel:([^"']+)["']/gi)].map(
      (m) => decodeEntities(m[1]).trim()
    )
    const mailtoLinks = [
      ...html.matchAll(/href\s*=\s*["']mailto:([^"'?]+)/gi),
    ].map((m) => decodeEntities(m[1]).trim())

    const phones = [...new Set([...telLinks, ...findPhones(body)])]
    const emails = [...new Set([...mailtoLinks, ...findEmails(body)])]
    const hasEmail = emails.length > 0
    const hasPhone = phones.length > 0

    const hasForm = /<form\b/i.test(html)
    // A homepage with no <form> is normal — many sites put enquiries behind a
    // dedicated contact/booking page. Only treat it as a conversion problem when
    // there is no route to get in touch at all.
    const hasContactLink =
      /href\s*=\s*["'][^"']*(contact|book|appointment|enquir|inquir|admission|visit|rendez-vous|rdv|devis)[^"']*["']/i.test(
        html
      )
    const hasContactPath = hasForm || hasContactLink || phones.length > 0 || hasEmail
    const usesTables = (html.match(/<table\b/gi) ?? []).length > 2
    const hasFlash = /\.swf\b|<embed\b|shockwave/i.test(lower)
    const hasDeprecated = /<(center|font|marquee|blink|frameset)\b/i.test(lower)
    const socialOnly = /facebook\.com|instagram\.com|linktr\.ee/i.test(finalUrl)

    const years = [...body.matchAll(/(?:©|copyright|&copy;)[^0-9]{0,12}(20\d{2})/gi)]
      .map((m) => Number(m[1]))
      .filter((y) => y >= 2000 && y <= 2100)
    const copyrightYear = years.length ? Math.max(...years) : null
    const currentYear = new Date().getFullYear()

    const parkedSignals = [
      "domain is for sale",
      "buy this domain",
      "under construction",
      "coming soon",
      "site is temporarily unavailable",
      "default web page",
      "index of /",
      "welcome to nginx",
      "apache2 default page",
      "godaddy",
      "parked",
    ]
    const isParked =
      parkedSignals.some((s) => body.toLowerCase().includes(s)) && body.length < 1500

    const issues: string[] = []
    let score = 0

    if (!response.ok) {
      score += 55
      issues.push(`Returns HTTP ${response.status}`)
    }
    if (isParked) {
      score += 55
      issues.push("Parked, placeholder, or under-construction page")
    }
    if (socialOnly) {
      score += 40
      issues.push("Uses a social media page instead of a real website")
    }
    if (!isHttps) {
      score += 18
      issues.push("No HTTPS — browsers flag it as 'Not secure'")
    }
    if (!hasViewport) {
      score += 22
      issues.push("No mobile viewport — not responsive on phones")
    }
    if (!title) {
      score += 10
      issues.push("Missing page title")
    } else if (title.length < 10) {
      score += 5
      issues.push(`Weak page title ("${title}")`)
    }
    if (!description) {
      score += 8
      issues.push("No meta description — poor search snippet")
    }
    if (h1Count === 0) {
      score += 6
      issues.push("No H1 heading")
    }
    if (body.length < 400) {
      score += 18
      issues.push(`Extremely thin content (~${body.length} characters)`)
    } else if (body.length < 1200) {
      score += 8
      issues.push("Thin content")
    }
    if (!hasEmail && !hasPhone) {
      score += 12
      issues.push("No visible phone or email on the homepage")
    }
    if (!hasContactPath) {
      score += 8
      issues.push("No way to get in touch — no form, contact link, phone or email")
    }
    if (usesTables) {
      score += 12
      issues.push("Table-based layout — pre-modern markup")
    }
    if (hasDeprecated) {
      score += 12
      issues.push("Uses deprecated HTML tags (font/center/marquee)")
    }
    if (hasFlash) {
      score += 15
      issues.push("References Flash or legacy embeds")
    }
    if (copyrightYear && currentYear - copyrightYear >= 3) {
      score += 14
      issues.push(`Copyright still says ${copyrightYear} — looks abandoned`)
    }
    if (loadMs > 4000) {
      score += 12
      issues.push(`Slow to respond (${(loadMs / 1000).toFixed(1)}s)`)
    } else if (loadMs > 2000) {
      score += 5
      issues.push(`Sluggish response (${(loadMs / 1000).toFixed(1)}s)`)
    }
    if (bytes > 1_500_000) {
      score += 8
      issues.push(`Very heavy HTML payload (${Math.round(bytes / 1024)} KB)`)
    }
    if (images.length > 0 && imagesMissingAlt / images.length > 0.6) {
      score += 6
      issues.push("Most images are missing alt text")
    }

    return {
      url: finalUrl,
      domain: new URL(finalUrl).hostname.replace(/^www\./, ""),
      reachable: true,
      status: response.status,
      isHttps,
      hasViewport,
      title,
      description,
      h1Count,
      textLength: body.length,
      textSample: body.slice(0, 700),
      copyrightYear,
      loadMs,
      htmlKb: Math.round(bytes / 1024),
      hasEmail,
      hasPhone,
      // Returned so the agent can see the actual matched values and avoid
      // asserting "no contact info" when the tool clearly found some.
      phonesFound: phones.slice(0, 5),
      emailsFound: emails.slice(0, 5),
      hasForm,
      hasContactLink,
      hasContactPath,
      isParked,
      socialOnly,
      imageCount: images.length,
      imagesMissingAlt,
      issues,
      heuristicScore: Math.max(0, Math.min(100, score)),
    }
  },
})
