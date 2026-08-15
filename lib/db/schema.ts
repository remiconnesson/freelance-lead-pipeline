import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  niche: text("niche"),
  city: text("city"),
  address: text("address"),
  phone: text("phone"),
  mapsUrl: text("maps_url"),
  websiteUrl: text("website_url"),
  domain: text("domain").unique(),
  rating: numeric("rating"),
  reviewCount: integer("review_count"),
  badnessScore: integer("badness_score").notNull().default(0),
  verdict: text("verdict"),
  issues: jsonb("issues").$type<string[]>().notNull().default([]),
  evidence: text("evidence"),
  pitchAngle: text("pitch_angle"),
  outreachDraft: text("outreach_draft"),
  hasWebsite: boolean("has_website").notNull().default(true),
  source: text("source").notNull().default("web_search"),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  auditedAt: timestamp("audited_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const hunts = pgTable("hunts", {
  id: serial("id").primaryKey(),
  niche: text("niche").notNull(),
  city: text("city").notNull(),
  source: text("source").notNull().default("web_search"),
  status: text("status").notNull().default("running"),
  businessesChecked: integer("businesses_checked").notNull().default(0),
  leadsFound: integer("leads_found").notNull().default(0),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const targets = pgTable("targets", {
  id: serial("id").primaryKey(),
  niche: text("niche").notNull(),
  city: text("city").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Lead = typeof leads.$inferSelect
export type Hunt = typeof hunts.$inferSelect
export type Target = typeof targets.$inferSelect

export const LEAD_STATUSES = ["new", "contacted", "replied", "won", "dead"] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]
