import React from 'react'
import { DollarSign } from 'lucide-react'
import { BUDGET_PRESETS, formatINR } from '../lib/travel-data'

export function BudgetSelector({ value, onChange, min, disabled }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
          <span className="text-sm font-bold">₹</span>
          TOTAL BUDGET (INR)
        </label>
        <span className="rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
          Min: {formatINR(min)}
        </span>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/80 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
        <div className="flex flex-col items-center justify-center border-r border-zinc-700 bg-zinc-800 px-4">
          <span className="text-xs font-bold text-amber-400">₹</span>
          <span className="text-[10px] text-zinc-400 font-mono">INR</span>
        </div>
        <input
          type="number"
          step="any"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-4 py-3.5 text-lg font-bold text-white outline-none disabled:opacity-60"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {BUDGET_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset.amount)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
              value === preset.amount
                ? 'border-amber-400 bg-amber-400 text-black font-bold'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-amber-400/50 hover:text-white'
            }`}
          >
            {preset.label} ({formatINR(preset.amount)})
          </button>
        ))}
      </div>
    </div>
  )
}
