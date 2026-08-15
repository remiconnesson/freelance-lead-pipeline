import { defineSchedule } from "eve/schedules"

export default defineSchedule({
  // 07:00 UTC every day. Vercel evaluates cron expressions in UTC.
  cron: "0 7 * * *",
  markdown: [
    "Run the daily lead hunt.",
    "",
    "1. Call list_targets to get the active niche/city targets.",
    "2. If there are no active targets, stop immediately without doing anything else.",
    "3. Otherwise hunt each target in order using your normal hunt workflow:",
    "   find_businesses, list_saved_leads, audit_website, save_lead, log_hunt.",
    "4. For every lead you save with a badnessScore of 70 or above, also write a",
    "   short outreach message and attach it with save_outreach_draft.",
    "",
    "Audit at most 15 websites per target so the run stays bounded.",
  ].join("\n"),
})
