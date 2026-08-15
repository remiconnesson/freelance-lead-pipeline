import { and, desc, eq, ilike } from "drizzle-orm"
import { defineTool } from "eve/tools"
import { z } from "zod"

import { db } from "../../lib/db"
import { leads } from "../../lib/db/schema"

export default defineTool({
  description:
    "List leads already saved in the pipeline, optionally filtered by niche, city, or status. Call this before auditing so you never re-audit a business that is already in the database.",
  inputSchema: z.object({
    niche: z.string().optional(),
    city: z.string().optional(),
    status: z.enum(["new", "contacted", "replied", "won", "dead"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
  }),
  async execute({ niche, city, status, limit }) {
    const filters = [
      niche ? ilike(leads.niche, `%${niche}%`) : undefined,
      city ? ilike(leads.city, `%${city}%`) : undefined,
      status ? eq(leads.status, status) : undefined,
    ].filter(Boolean)

    const rows = await db
      .select({
        id: leads.id,
        businessName: leads.businessName,
        domain: leads.domain,
        websiteUrl: leads.websiteUrl,
        city: leads.city,
        niche: leads.niche,
        badnessScore: leads.badnessScore,
        verdict: leads.verdict,
        status: leads.status,
      })
      .from(leads)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(leads.badnessScore))
      .limit(limit)

    return {
      count: rows.length,
      knownDomains: rows.map((r) => r.domain).filter(Boolean),
      leads: rows,
    }
  },
})
