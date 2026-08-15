"use client"

import { useMemo, useState } from "react"
import { ExternalLink, Search, SignalZero } from "lucide-react"

import { LeadDetail } from "@/components/lead-detail"
import { ScoreMeter } from "@/components/score-meter"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LEAD_STATUSES, type Lead } from "@/lib/db/schema"

const SCORE_LABELS: Record<string, string> = {
  "0": "Any score",
  "60": "60+ poor",
  "75": "75+ severe",
  "90": "90+ critical",
}

const STATUS_STYLES: Record<string, string> = {
  new: "border-signal/40 text-signal",
  contacted: "border-severity/40 text-severity",
  replied: "border-chart-2/40 text-chart-2",
  won: "border-chart-4/40 text-chart-4",
  dead: "border-border text-muted-foreground",
}

export function LeadsTable({
  leads,
  cities,
  niches,
}: {
  leads: Lead[]
  cities: string[]
  niches: string[]
}) {
  const [selected, setSelected] = useState<Lead | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [city, setCity] = useState("all")
  const [niche, setNiche] = useState("all")
  const [minScore, setMinScore] = useState("0")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const floor = Number(minScore)

    return leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false
      if (city !== "all" && lead.city !== city) return false
      if (niche !== "all" && lead.niche !== niche) return false
      if (lead.badnessScore < floor) return false
      if (!q) return true
      return [lead.businessName, lead.domain, lead.city, lead.niche, lead.verdict]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    })
  }, [leads, query, status, city, niche, minScore])

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search business, domain, city…"
              aria-label="Search leads"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={minScore}
              onValueChange={(value) => setMinScore(value ?? "0")}
            >
              <SelectTrigger className="w-[140px]" aria-label="Minimum score">
                <SelectValue>
                  {(value: string | null) => SCORE_LABELS[value ?? "0"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCORE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? "all")}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by status">
                <SelectValue>
                  {(value: string | null) =>
                    value && value !== "all" ? value : "All status"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {cities.length > 0 && (
              <Select
                value={city}
                onValueChange={(value) => setCity(value ?? "all")}
              >
                <SelectTrigger className="w-[140px]" aria-label="Filter by city">
                  <SelectValue>
                    {(value: string | null) =>
                      value && value !== "all" ? value : "All cities"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {niches.length > 0 && (
              <Select
                value={niche}
                onValueChange={(value) => setNiche(value ?? "all")}
              >
                <SelectTrigger className="w-[140px]" aria-label="Filter by niche">
                  <SelectValue>
                    {(value: string | null) =>
                      value && value !== "all" ? value : "All niches"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All niches</SelectItem>
                  {niches.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[150px] font-mono text-xs uppercase tracking-widest">
                  Score
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-widest">
                  Business
                </TableHead>
                <TableHead className="hidden font-mono text-xs uppercase tracking-widest md:table-cell">
                  Verdict
                </TableHead>
                <TableHead className="hidden font-mono text-xs uppercase tracking-widest sm:table-cell">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow
                  key={lead.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${lead.businessName}`}
                  onClick={() => setSelected(lead)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelected(lead)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <ScoreMeter score={lead.badnessScore} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{lead.businessName}</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        {lead.hasWebsite ? (
                          <>
                            <span className="truncate">{lead.domain}</span>
                            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                          </>
                        ) : (
                          <>
                            <SignalZero className="size-3 shrink-0" aria-hidden="true" />
                            no website
                          </>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-sm md:table-cell">
                    <span className="line-clamp-2 text-pretty text-sm text-muted-foreground">
                      {lead.verdict}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${STATUS_STYLES[lead.status] ?? ""}`}
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-40 text-center">
                    <p className="text-sm text-muted-foreground">
                      {leads.length === 0
                        ? "No leads yet. Run a hunt to start filling the pipeline."
                        : "No leads match these filters."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          Showing {filtered.length} of {leads.length} leads
        </p>
      </div>

      <LeadDetail lead={selected} onClose={() => setSelected(null)} />
    </>
  )
}
