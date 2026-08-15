"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useEveAgent } from "eve/react"
import { Loader2, Send, Square, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TOOL_LABELS: Record<string, string> = {
  find_businesses: "Searching for businesses",
  audit_website: "Auditing website",
  save_lead: "Saving lead",
  list_saved_leads: "Checking existing leads",
  log_hunt: "Logging hunt",
  save_outreach_draft: "Writing outreach",
  list_targets: "Reading targets",
  web_search: "Searching the web",
}

export function HuntConsole() {
  const router = useRouter()
  const agent = useEveAgent()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const wasBusy = useRef(false)

  const busy = agent.status === "submitted" || agent.status === "streaming"

  // Refresh the table once a run settles so new leads appear.
  useEffect(() => {
    if (wasBusy.current && !busy) router.refresh()
    wasBusy.current = busy
  }, [busy, router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [agent.data.messages])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    void agent.send(text)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        ref={scrollRef}
        className="flex min-h-64 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {agent.data.messages.length === 0 && (
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <p className="text-pretty">
              Ask Scout to hunt a niche in a city. It finds local businesses,
              audits each website, and saves the bad ones as leads.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Find dentists in Lyon with bad websites",
                "Hunt plumbers in Bristol",
                "Check restaurants in Austin",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-md border border-border px-3 py-1.5 text-left text-xs transition-colors hover:border-signal hover:text-signal"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {agent.data.messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {message.role === "user" ? "You" : "Scout"}
            </span>
            {message.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <p
                    key={i}
                    className="whitespace-pre-wrap text-pretty text-sm leading-relaxed"
                  >
                    {part.text}
                  </p>
                )
              }

              if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                const name =
                  "toolName" in part && typeof part.toolName === "string"
                    ? part.toolName
                    : part.type.replace(/^tool-/, "")
                const done =
                  "state" in part && String(part.state).includes("output")

                return (
                  <span
                    key={i}
                    className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
                  >
                    {done ? (
                      <Wrench className="size-3 shrink-0" aria-hidden="true" />
                    ) : (
                      <Loader2
                        className="size-3 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {TOOL_LABELS[name] ?? name}
                  </span>
                )
              }

              return null
            })}
          </div>
        ))}

        {agent.status === "error" && (
          <p className="text-sm text-destructive">
            {agent.error?.message ?? "Something went wrong."}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              submit(e)
            }
          }}
          placeholder="Niche and city to hunt…"
          aria-label="Message Scout"
          disabled={busy}
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={() => agent.cancel()}>
            <Square className="size-4" aria-hidden="true" />
            <span className="sr-only">Stop</span>
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        )}
      </form>
    </div>
  )
}
