import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { THINKING_STEPS } from '../lib/travel-data'

export function AgentStatus({ stepIndex }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 w-[min(90%,380px)] -translate-x-1/2 animate-voyo-fade-up">
      <div className="rounded-2xl border border-amber-400/40 bg-black/85 p-4 backdrop-blur-md glow-yellow shadow-2xl">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
          <Sparkles className="size-4 animate-pulse fill-amber-400" />
          VOYO is synthesizing your itinerary...
        </div>
        <ul className="mt-3 space-y-1.5">
          {THINKING_STEPS.map((step, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <li
                key={step}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  active ? 'text-white font-semibold' : done ? 'text-zinc-400 line-through' : 'text-zinc-600'
                }`}
              >
                {active ? (
                  <Loader2 className="size-3 shrink-0 animate-spin text-amber-400" />
                ) : (
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${done ? 'bg-amber-400' : 'bg-zinc-700'}`}
                  />
                )}
                {step}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
