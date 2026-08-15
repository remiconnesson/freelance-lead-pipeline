import { defineTool } from "eve/tools"
import { z } from "zod"

type Place = {
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  rating?: number
  userRatingCount?: number
  businessStatus?: string
}

export default defineTool({
  description:
    "Find local businesses for a niche in a city using the Google Places API. If no Google Maps API key is configured, this returns a fallback instruction telling you to use your built-in web_search tool instead.",
  inputSchema: z.object({
    niche: z.string().describe("Business category, e.g. 'dentist', 'plumber'"),
    city: z.string().describe("City or area, e.g. 'Lyon, France'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(15)
      .describe("Maximum number of businesses to return"),
  }),
  async execute({ niche, city, limit }) {
    const key = process.env.GOOGLE_MAPS_API_KEY

    if (!key) {
      return {
        source: "fallback" as const,
        businesses: [],
        instruction:
          `No GOOGLE_MAPS_API_KEY is configured, so Google Maps lookup is unavailable. ` +
          `Use your built-in web_search tool instead: search for "${niche} ${city}" plus ` +
          `directory queries, then extract business names, phone numbers, and website URLs ` +
          `from the results. Audit those URLs with audit_website as usual, and pass ` +
          `source: "web_search" when you call save_lead.`,
      }
    }

    let response: Response
    try {
      response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": [
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.rating",
            "places.userRatingCount",
            "places.businessStatus",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: `${niche} in ${city}`,
          maxResultCount: Math.min(limit, 20),
        }),
      })
    } catch (error) {
      return {
        source: "error" as const,
        businesses: [],
        instruction: `Google Places request failed (${
          error instanceof Error ? error.message : "unknown error"
        }). Fall back to your built-in web_search tool.`,
      }
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      return {
        source: "error" as const,
        businesses: [],
        instruction:
          `Google Places returned HTTP ${response.status}. ${detail.slice(0, 300)} ` +
          `Fall back to your built-in web_search tool.`,
      }
    }

    const data = (await response.json()) as { places?: Place[] }
    const businesses = (data.places ?? [])
      .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
      .slice(0, limit)
      .map((p) => ({
        name: p.displayName?.text ?? "Unknown",
        address: p.formattedAddress ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        mapsUrl: p.googleMapsUri ?? null,
        rating: p.rating ?? null,
        reviewCount: p.userRatingCount ?? null,
        hasWebsite: Boolean(p.websiteUri),
      }))

    return {
      source: "google_maps" as const,
      count: businesses.length,
      businesses,
      instruction:
        "Audit each business that has a website with audit_website. Businesses with " +
        "hasWebsite false are strong leads on their own — save them with hasWebsite: false " +
        "and a badnessScore of 90 or above.",
    }
  },
})
