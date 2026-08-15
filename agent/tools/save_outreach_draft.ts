import { eq } from "drizzle-orm"
import { defineTool } from "eve/tools"
import { z } from "zod"

import { db } from "../../lib/db"
import { leads } from "../../lib/db/schema"

export default defineTool({
  description:
    "Attach a short, personalized outreach message to an existing lead so the designer can copy it from the dashboard. Write it yourself based on the lead's specific issues — never generic filler.",
  inputSchema: z.object({
    leadId: z.number().int().describe("The id returned by save_lead"),
    draft: z
      .string()
      .describe(
        "The outreach message. Under 120 words, references the specific problems found, no hard sell."
      ),
  }),
  async execute({ leadId, draft }) {
    const [row] = await db
      .update(leads)
      .set({ outreachDraft: draft, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning({ id: leads.id, businessName: leads.businessName })

    if (!row) return { saved: false, error: `No lead with id ${leadId}` }
    return { saved: true, leadId: row.id, businessName: row.businessName }
  },
})
