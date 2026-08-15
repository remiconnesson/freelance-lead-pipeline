export function StatsBar({
  stats,
}: {
  stats: {
    total: number
    fresh: number
    critical: number
    noSite: number
    avgScore: number
  }
}) {
  const items = [
    { label: "Leads", value: stats.total },
    { label: "Unworked", value: stats.fresh },
    { label: "Severe 75+", value: stats.critical },
    { label: "No website", value: stats.noSite },
    { label: "Avg score", value: stats.avgScore },
  ]

  return (
    <dl className="flex flex-wrap items-center gap-x-8 gap-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {item.label}
          </dt>
          <dd className="tabular font-mono text-2xl leading-none">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
