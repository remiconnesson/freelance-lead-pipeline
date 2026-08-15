"use client"

import { useState, useTransition } from "react"
import {
  Copy,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { deleteLead, updateLeadNotes, updateLeadStatus } from "@/app/actions"
import { ScoreMeter, severityOf } from "@/components/score-meter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { LEAD_STATUSES, type Lead } from "@/lib/db/schema"

export function LeadDetail({
  lead,
  onClose,
}: {
  lead: Lead | null
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [notesFor, setNotesFor] = useState<number | null>(null)

  if (lead && notesFor !== lead.id) {
    setNotesFor(lead.id)
    setNotes(lead.notes ?? "")
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${what} copied`),
      () => toast.error(`Could not copy ${what.toLowerCase()}`)
    )
  }

  return (
    <Sheet open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {lead && (
          <>
            <SheetHeader className="gap-3 border-b border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <SheetTitle className="text-balance text-xl">
                    {lead.businessName}
                  </SheetTitle>
                  <SheetDescription className="font-mono text-xs uppercase tracking-widest">
                    {[lead.niche, lead.city].filter(Boolean).join(" · ") ||
                      "Uncategorized"}
                  </SheetDescription>
                </div>
                <ScoreMeter score={lead.badnessScore} size="lg" />
              </div>
              {lead.verdict && (
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {lead.verdict}
                </p>
              )}
            </SheetHeader>

            <div className="flex flex-col gap-6 p-6">
              <section className="flex flex-col gap-3">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Contact
                </h3>
                <div className="flex flex-col gap-2 text-sm">
                  {lead.websiteUrl ? (
                    <a
                      href={lead.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-signal hover:underline"
                    >
                      <Globe className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{lead.domain}</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-chart-1">
                      <Globe className="size-4 shrink-0" aria-hidden="true" />
                      No website at all
                    </span>
                  )}
                  {lead.phone && (
                    <button
                      type="button"
                      onClick={() => copy(lead.phone!, "Phone")}
                      className="flex items-center gap-2 text-left hover:text-signal"
                    >
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {lead.phone}
                      <Copy className="size-3 shrink-0" aria-hidden="true" />
                    </button>
                  )}
                  {lead.address && (
                    <span className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="text-pretty">{lead.address}</span>
                    </span>
                  )}
                  {lead.rating && (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Star className="size-4 shrink-0" aria-hidden="true" />
                      <span className="tabular">
                        {lead.rating} ({lead.reviewCount ?? 0} reviews)
                      </span>
                    </span>
                  )}
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Issues found ({lead.issues.length})
                </h3>
                <ul className="flex flex-col gap-2">
                  {lead.issues.map((issue, i) => (
                    <li
                      key={i}
                      className="flex items-baseline gap-3 text-sm leading-relaxed"
                    >
                      <span
                        className="tabular font-mono text-xs text-muted-foreground"
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-pretty">{issue}</span>
                    </li>
                  ))}
                  {lead.issues.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No itemized issues recorded.
                    </li>
                  )}
                </ul>
                {lead.evidence && (
                  <blockquote className="border-l-2 border-severity pl-3 text-sm italic leading-relaxed text-muted-foreground">
                    {lead.evidence}
                  </blockquote>
                )}
              </section>

              {lead.pitchAngle && (
                <>
                  <Separator />
                  <section className="flex flex-col gap-3">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Pitch angle
                    </h3>
                    <p className="text-pretty text-sm leading-relaxed">
                      {lead.pitchAngle}
                    </p>
                  </section>
                </>
              )}

              {lead.outreachDraft && (
                <>
                  <Separator />
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Outreach draft
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copy(lead.outreachDraft!, "Draft")}
                      >
                        <Copy className="size-3.5" aria-hidden="true" />
                        Copy
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed">
                      {lead.outreachDraft}
                    </p>
                  </section>
                </>
              )}

              <Separator />

              <section className="flex flex-col gap-3">
                <Label
                  htmlFor="lead-status"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Pipeline status
                </Label>
                <Select
                  value={lead.status}
                  onValueChange={(value) => {
                    if (!value) return
                    startTransition(async () => {
                      const result = await updateLeadStatus(lead.id, value)
                      if (result.ok) toast.success(`Marked as ${value}`)
                      else toast.error(result.error)
                    })
                  }}
                >
                  <SelectTrigger id="lead-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>

              <section className="flex flex-col gap-3">
                <Label
                  htmlFor="lead-notes"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Notes
                </Label>
                <Textarea
                  id="lead-notes"
                  value={notes}
                  rows={4}
                  placeholder="Call outcome, follow-up date, quoted price…"
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await updateLeadNotes(lead.id, notes)
                        toast.success("Notes saved")
                      })
                    }
                  >
                    Save notes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteLead(lead.id)
                        toast.success("Lead deleted")
                        onClose()
                      })
                    }
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </section>

              <p className="font-mono text-xs text-muted-foreground">
                <Badge variant="outline" className="mr-2 font-mono text-xs">
                  {severityOf(lead.badnessScore).label}
                </Badge>
                Audited {new Date(lead.auditedAt).toLocaleDateString()} via web search
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
