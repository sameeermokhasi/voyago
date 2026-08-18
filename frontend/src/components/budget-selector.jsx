import React from 'react'
import { AlertCircle } from 'lucide-react'
import { formatINR } from '../lib/travel-data'

export function BudgetSelector({
  value,
  onChange,
  min,
  days,
  disabled,
}) {
  const isBelowMin = Number(value || 0) < min

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-yellow-400">
          <span className="text-sm font-black">₹</span>
          TOTAL BUDGET (INR)
        </label>
        <span
          className={`rounded-lg px-2.5 py-0.5 text-xs font-bold border transition ${
            isBelowMin
              ? 'border-red-500/50 bg-red-500/15 text-red-400'
              : 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
          }`}
        >
          Min: {formatINR(min)}
        </span>
      </div>

      <div
        className={`flex items-stretch overflow-hidden rounded-2xl border transition ${
          isBelowMin
            ? 'border-red-500 bg-red-500/5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/30'
            : 'border-zinc-800 bg-zinc-900/90 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/30'
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center border-r px-4 ${
            isBelowMin ? 'border-red-500/40 bg-red-950/40' : 'border-zinc-800 bg-zinc-900'
          }`}
        >
          <span className={`text-sm font-bold ${isBelowMin ? 'text-red-400' : 'text-yellow-400'}`}>₹</span>
          <span className="text-[10px] text-zinc-400 font-mono">INR</span>
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={value === 0 ? '' : value}
          placeholder={`Enter budget (Min ${formatINR(min)})`}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-4 py-3.5 text-lg font-semibold text-white outline-none disabled:opacity-60 placeholder:text-zinc-600"
        />
      </div>

      {/* Warning message if below baseline */}
      {isBelowMin && (
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>
            Budget must be at least <strong>{formatINR(min)}</strong> for {days || 'the'} days (covers minimum stays, meals & outstation cab transit).
          </span>
        </div>
      )}
    </div>
  )
}

export default BudgetSelector
