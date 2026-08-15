import { defineTool } from "eve/tools"
import { z } from "zod"

/**
 * Discovery is intentionally web-search based.
 *
 * The Google Places API is NOT used here: Google Maps Platform terms prohibit
 * storing Maps Content (business names, addresses, ratings) in a permanent
 * database. Only place IDs may be kept indefinitely, and lat/lng for at most
 * 30 days. A durable lead pipeline is exactly the warehousing that is
 * disallowed, so this tool builds a web-search plan instead.
 */
export default defineTool({
  description:
    "Build a web-search plan for finding local businesses in a niche and city. " +
    "Returns a prioritised list of search queries to run with your built-in " +
    "web_search tool. Does not call any paid API.",
  inputSchema: z.object({
    niche: z.string().describe("Business category, e.g. 'dentist', 'plumber'"),
    city: z.string().describe("City or area, e.g. 'Lyon, France'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(30)
      .default(15)
      .describe("Target number of businesses to gather before auditing"),
  }),
  async execute({ niche, city, limit }) {
    const queries = [
      `${niche} ${city}`,
      `${niche} ${city} contact`,
      `best ${niche} in ${city}`,
      `${niche} ${city} annuaire`,
      `${niche} ${city} site officiel`,
      `"${niche}" "${city}" -yelp -tripadvisor`,
    ]

    return {
      source: "web_search" as const,
      target: limit,
      queries,
      instruction:
        `Run these queries with your built-in web_search tool until you have about ` +
        `${limit} distinct ${niche} businesses in ${city}. For each result, capture the ` +
        `business name, its own website URL (not a directory listing), and a phone ` +
        `number or address if visible. Skip aggregator and directory domains such as ` +
        `yelp, tripadvisor, pagesjaunes, yellowpages, facebook and doctolib — those are ` +
        `not the business's own site, though a business that ONLY has a directory ` +
        `listing and no real site is an excellent lead: save it with hasWebsite false ` +
        `and a badnessScore of 90 or above. Audit every real website URL with ` +
        `audit_website, then save qualifying businesses with save_lead using ` +
        `source "web_search".`,
    }
  },
})
