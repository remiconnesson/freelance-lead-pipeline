import { defineTool } from "eve/tools"
import { z } from "zod"

import { db } from "../../lib/db"
import { hunts } from "../../lib/db/schema"

export default defineTool({
  description:
    "Record a completed hunt in the run history. Call this exactly once at the end of every hunt, after all save_lead calls.",
  inputSchema: z.object({
    niche: z.string(),
    city: z.string(),
    source: z.literal("web_search").default("web_search"),
    businessesChecked: z.number().int().min(0),
    leadsFound: z.number().int().min(0),
    summary: z.string().describe("One or two sentences on what you found"),
  }),
  async execute(input) {
    const [row] = await db
      .insert(hunts)
      .values({ ...input, status: "complete" })
      .returning({ id: hunts.id })

    return { logged: true, huntId: row.id }
  },
})
