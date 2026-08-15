"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { LEAD_STATUSES, leads, targets, type LeadStatus } from "@/lib/db/schema"

export async function updateLeadStatus(leadId: number, status: string) {
  if (!LEAD_STATUSES.includes(status as LeadStatus)) {
    return { ok: false as const, error: "Unknown status" }
  }

  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, leadId))

  revalidatePath("/")
  return { ok: true as const }
}

export async function updateLeadNotes(leadId: number, notes: string) {
  await db
    .update(leads)
    .set({ notes: notes.slice(0, 5000), updatedAt: new Date() })
    .where(eq(leads.id, leadId))

  revalidatePath("/")
  return { ok: true as const }
}

export async function deleteLead(leadId: number) {
  await db.delete(leads).where(eq(leads.id, leadId))
  revalidatePath("/")
  return { ok: true as const }
}

export async function addTarget(formData: FormData) {
  const niche = String(formData.get("niche") ?? "").trim()
  const city = String(formData.get("city") ?? "").trim()

  if (!niche || !city) {
    return { ok: false as const, error: "Both niche and city are required" }
  }

  await db.insert(targets).values({ niche, city })
  revalidatePath("/")
  return { ok: true as const }
}

export async function removeTarget(targetId: number) {
  await db.delete(targets).where(eq(targets.id, targetId))
  revalidatePath("/")
  return { ok: true as const }
}
