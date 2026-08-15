import { desc, eq } from "drizzle-orm"
import { defineTool } from "eve/tools"
import { z } from "zod"

import { db } from "../../lib/db"
import { targets } from "../../lib/db/schema"

export default defineTool({
  description:
    "List the active niche/city targets the freelancer wants hunted. Use this at the start of a scheduled run to decide what to hunt.",
  inputSchema: z.object({}),
  async execute() {
    const rows = await db
      .select({ id: targets.id, niche: targets.niche, city: targets.city })
      .from(targets)
      .where(eq(targets.active, true))
      .orderBy(desc(targets.createdAt))
      .limit(10)

    return {
      count: rows.length,
      targets: rows,
      instruction: rows.length
        ? "Hunt each of these targets in order."
        : "No active targets configured. Reply that there is nothing to hunt and stop.",
    }
  },
})
