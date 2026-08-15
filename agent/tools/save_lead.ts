import { defineTool } from "eve/tools"
import { z } from "zod"

import { db } from "../../lib/db"
import { leads } from "../../lib/db/schema"

function toDomain(url?: string | null) {
  if (!url) return null
  try {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
    return new URL(target).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

export default defineTool({
  description:
    "Save a business with a bad or missing website to the lead pipeline database. Only call this for businesses scoring 45 or above. Re-saving the same domain updates the existing lead instead of creating a duplicate.",
  inputSchema: z.object({
    businessName: z.string(),
    niche: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    mapsUrl: z.string().optional(),
    websiteUrl: z
      .string()
      .optional()
      .describe("Omit entirely when the business has no website"),
    rating: z.number().optional(),
    reviewCount: z.number().int().optional(),
    hasWebsite: z.boolean().default(true),
    badnessScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .describe("Your final judgment of how bad the web presence is, 0-100"),
    verdict: z.string().describe("One line summarizing why this is a lead"),
    issues: z.array(z.string()).describe("Concrete, specific problems found"),
    evidence: z
      .string()
      .optional()
      .describe("Short quote or detail from the site backing up the verdict"),
    pitchAngle: z
      .string()
      .describe("The most persuasive thing the designer could say to this owner"),
    source: z.enum(["google_maps", "web_search"]).default("web_search"),
  }),
  async execute(input) {
    const domain = toDomain(input.websiteUrl) ?? `no-website:${
      input.businessName.toLowerCase().replace(/\s+/g, "-")
    }-${(input.city ?? "unknown").toLowerCase().replace(/\s+/g, "-")}`

    const values = {
      businessName: input.businessName,
      niche: input.niche ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      mapsUrl: input.mapsUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
      domain,
      rating: input.rating != null ? String(input.rating) : null,
      reviewCount: input.reviewCount ?? null,
      badnessScore: input.badnessScore,
      verdict: input.verdict,
      issues: input.issues,
      evidence: input.evidence ?? null,
      pitchAngle: input.pitchAngle,
      hasWebsite: input.hasWebsite,
      source: input.source,
      auditedAt: new Date(),
      updatedAt: new Date(),
    }

    const [row] = await db
      .insert(leads)
      .values(values)
      .onConflictDoUpdate({ target: leads.domain, set: values })
      .returning({ id: leads.id, businessName: leads.businessName })

    return {
      saved: true,
      leadId: row.id,
      businessName: row.businessName,
      badnessScore: input.badnessScore,
    }
  },
})
