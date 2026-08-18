'use client'

import { IndianRupee } from 'lucide-react'
import { BUDGET_PRESETS, formatINR } from '@/lib/travel-data'

export function BudgetSelector({
  value,
  onChange,
  min,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <IndianRupee className="size-3.5" />
          Total budget (INR)
        </label>
        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          Min: {formatINR(min)}
        </span>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-secondary/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/30">
        <div className="flex flex-col items-center justify-center border-r border-border bg-secondary px-4">
          <IndianRupee className="size-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">INR</span>
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-4 py-3.5 text-lg font-semibold text-foreground outline-none disabled:opacity-60"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {BUDGET_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.amount)}
            className={`rounded-md border px-2.5 py-1 text-xs transition disabled:opacity-50 ${
              value === preset.amount
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {preset.label} ({formatINR(preset.amount)})
          </button>
        ))}
      </div>
    </div>
  )
}
