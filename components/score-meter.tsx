import { cn } from "@/lib/utils"

export function severityOf(score: number) {
  if (score >= 90) return { label: "Critical", tone: "chart-1" as const }
  if (score >= 75) return { label: "Severe", tone: "chart-2" as const }
  if (score >= 60) return { label: "Poor", tone: "chart-3" as const }
  return { label: "Weak", tone: "chart-4" as const }
}

const TONE_TEXT: Record<string, string> = {
  "chart-1": "text-chart-1",
  "chart-2": "text-chart-2",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
}

const TONE_BG: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
}

/**
 * The signature element: a score readout with a segmented severity bar.
 * Everything else in the UI stays deliberately quiet so this reads first.
 */
export function ScoreMeter({
  score,
  size = "sm",
}: {
  score: number
  size?: "sm" | "lg"
}) {
  const { label, tone } = severityOf(score)
  const segments = 10
  const filled = Math.round((Math.min(100, Math.max(0, score)) / 100) * segments)

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "tabular font-mono font-medium leading-none",
          TONE_TEXT[tone],
          size === "lg" ? "text-4xl" : "text-xl"
        )}
      >
        {score}
      </span>
      <div className="flex flex-col gap-1">
        <div
          className="flex items-center gap-[2px]"
          role="img"
          aria-label={`Badness score ${score} out of 100, ${label}`}
        >
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-[1px]",
                size === "lg" ? "h-4 w-2" : "h-3 w-1.5",
                i < filled ? TONE_BG[tone] : "bg-muted"
              )}
            />
          ))}
        </div>
        {size === "lg" && (
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
