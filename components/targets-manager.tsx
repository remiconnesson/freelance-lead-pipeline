"use client"

import { useRef, useTransition } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { addTarget, removeTarget } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Target } from "@/lib/db/schema"

export function TargetsManager({ targets }: { targets: Target[] }) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Daily targets
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Scout hunts these every morning at 07:00 UTC.
        </p>
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            const result = await addTarget(formData)
            if (result.ok) {
              toast.success("Target added")
              formRef.current?.reset()
            } else {
              toast.error(result.error)
            }
          })
        }
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input name="niche" placeholder="Niche (dentist)" aria-label="Niche" required />
        <Input name="city" placeholder="City (Lyon)" aria-label="City" required />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {targets.map((target) => (
          <li
            key={target.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
          >
            <span className="text-sm">
              <span className="font-medium">{target.niche}</span>
              <span className="text-muted-foreground"> in {target.city}</span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Remove ${target.niche} in ${target.city}`}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removeTarget(target.id)
                  toast.success("Target removed")
                })
              }
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          </li>
        ))}
        {targets.length === 0 && (
          <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No targets yet. The daily run stays idle until you add one.
          </li>
        )}
      </ul>
    </div>
  )
}
