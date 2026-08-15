import "server-only"

import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm"

import { db } from "./db"
import { hunts, leads, targets, type Lead } from "./db/schema"

export type LeadFilters = {
  q?: string
  status?: string
  minScore?: number
  city?: string
  niche?: string
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const { q, status, minScore, city, niche } = filters

  const where = [
    q
      ? or(
          ilike(leads.businessName, `%${q}%`),
          ilike(leads.domain, `%${q}%`),
          ilike(leads.city, `%${q}%`),
          ilike(leads.niche, `%${q}%`)
        )
      : undefined,
    status && status !== "all" ? eq(leads.status, status) : undefined,
    minScore ? gte(leads.badnessScore, minScore) : undefined,
    city && city !== "all" ? eq(leads.city, city) : undefined,
    niche && niche !== "all" ? eq(leads.niche, niche) : undefined,
  ].filter(Boolean)

  return db
    .select()
    .from(leads)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(leads.badnessScore), desc(leads.auditedAt))
    .limit(300)
}

export async function getStats() {
  const [row] = await db
    .select({
      total: count(),
      fresh: sql<number>`count(*) filter (where ${leads.status} = 'new')::int`,
      critical: sql<number>`count(*) filter (where ${leads.badnessScore} >= 75)::int`,
      noSite: sql<number>`count(*) filter (where ${leads.hasWebsite} = false)::int`,
      avgScore: sql<number>`coalesce(round(avg(${leads.badnessScore})), 0)::int`,
    })
    .from(leads)

  return row ?? { total: 0, fresh: 0, critical: 0, noSite: 0, avgScore: 0 }
}

export async function getFacets() {
  const [cities, niches] = await Promise.all([
    db
      .selectDistinct({ value: leads.city })
      .from(leads)
      .where(sql`${leads.city} is not null`)
      .orderBy(leads.city),
    db
      .selectDistinct({ value: leads.niche })
      .from(leads)
      .where(sql`${leads.niche} is not null`)
      .orderBy(leads.niche),
  ])

  return {
    cities: cities.map((c) => c.value).filter((v): v is string => Boolean(v)),
    niches: niches.map((n) => n.value).filter((v): v is string => Boolean(v)),
  }
}

export async function getRecentHunts(limit = 8) {
  return db.select().from(hunts).orderBy(desc(hunts.createdAt)).limit(limit)
}

export async function getTargets() {
  return db.select().from(targets).orderBy(desc(targets.createdAt))
}
