import { Radar } from "lucide-react"

import { HuntConsole } from "@/components/hunt-console"
import { LeadsTable } from "@/components/leads-table"
import { StatsBar } from "@/components/stats-bar"
import { TargetsManager } from "@/components/targets-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getFacets,
  getLeads,
  getRecentHunts,
  getStats,
  getTargets,
} from "@/lib/leads"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [leads, stats, facets, targets, hunts] = await Promise.all([
    getLeads(),
    getStats(),
    getFacets(),
    getTargets(),
    getRecentHunts(),
  ])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <Radar className="size-5 text-signal" aria-hidden="true" />
          <h1 className="font-mono text-sm uppercase tracking-[0.2em]">Scout</h1>
        </div>
        <div className="flex flex-col gap-2">
          <p className="max-w-2xl text-balance text-2xl leading-snug sm:text-3xl">
            Local businesses with bad websites, scored and queued for outreach.
          </p>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            The higher the score, the worse their web presence, and the stronger
            your pitch.
          </p>
        </div>
        <StatsBar stats={stats} />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Pipeline
          </h2>
          <LeadsTable leads={leads} cities={facets.cities} niches={facets.niches} />
        </section>

        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-96">
          <div className="rounded-lg border border-border bg-card p-5">
            <Tabs defaultValue="hunt">
              <TabsList className="w-full">
                <TabsTrigger value="hunt" className="flex-1">
                  Hunt
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hunt" className="mt-5">
                <HuntConsole />
              </TabsContent>

              <TabsContent value="schedule" className="mt-5">
                <TargetsManager targets={targets} />
              </TabsContent>

              <TabsContent value="history" className="mt-5">
                <ul className="flex flex-col gap-4">
                  {hunts.map((hunt) => (
                    <li key={hunt.id} className="flex flex-col gap-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">
                          {hunt.niche} · {hunt.city}
                        </span>
                        <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
                          {hunt.leadsFound}/{hunt.businessesChecked}
                        </span>
                      </span>
                      {hunt.summary && (
                        <span className="text-pretty text-xs leading-relaxed text-muted-foreground">
                          {hunt.summary}
                        </span>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(hunt.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                  {hunts.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No hunts run yet.
                    </li>
                  )}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>
    </main>
  )
}
