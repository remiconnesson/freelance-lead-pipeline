import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as { __leadPool?: Pool }

export const pool =
  globalForDb.__leadPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })

if (process.env.NODE_ENV !== "production") globalForDb.__leadPool = pool

export const db = drizzle(pool, { schema })
export { schema }
