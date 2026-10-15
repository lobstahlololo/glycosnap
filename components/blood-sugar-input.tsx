"use client"

import { useState } from "react"
import { HeartPulse, Plus } from "lucide-react"
import type { BloodSugarReading } from "@/app/actions"

export function BloodSugarInput({
  onAdd,
}: {
  onAdd: (reading: BloodSugarReading) => void
}) {
  const [value, setValue] = useState("")
  const [note, setNote] = useState("")
  const [showForm, setShowForm] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number.parseFloat(value)
    if (isNaN(num) || num <= 0 || num > 600) return

    onAdd({
      id: crypto.randomUUID(),
      value: num,
      timestamp: new Date().toISOString(),
      note: note.trim(),
    })
    setValue("")
    setNote("")
    setShowForm(false)
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
            <HeartPulse className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-lg font-semibold text-card-foreground">Blood Sugar</h3>
            <p className="text-xs text-muted-foreground">Log a reading in mg/dL</p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Log Reading
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label htmlFor="bs-value" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Value <span className="font-normal normal-case">(mg/dL)</span>
              </label>
              <div className="relative">
                <input
                  id="bs-value"
                  type="number"
                  min={20}
                  max={600}
                  step={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 120"
                  autoFocus
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-background px-4 py-3 text-lg font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">mg/dL</span>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="bs-note" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Note <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                id="bs-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. After lunch, fasting..."
                className="w-full rounded-2xl border-2 border-dashed border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={!value || isNaN(Number.parseFloat(value)) || Number.parseFloat(value) <= 0}
              className="flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HeartPulse className="h-4 w-4" />
              Save Reading
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setValue(""); setNote("") }}
              className="rounded-2xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
