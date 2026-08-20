import React from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { THINKING_STEPS } from '../lib/travel-data'

export function AgentStatus({ stepIndex }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-10 md:top-12 z-30 w-[min(88%,360px)] -translate-x-1/2 animate-voyo-fade-up">
      <div className="rounded-3xl border border-yellow-400/50 bg-black/90 p-5 backdrop-blur-2xl glow-yellow shadow-2xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-yellow-400">
          <Sparkles className="size-4 animate-pulse fill-yellow-400" />
          <span>VOYO is planning your trip...</span>
        </div>
        <ul className="space-y-2">
          {THINKING_STEPS.map((step, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <li
                key={step}
                className={`flex items-center gap-2.5 text-xs transition-colors ${
                  active ? 'text-white font-bold' : done ? 'text-zinc-400 line-through' : 'text-zinc-600'
                }`}
              >
                {active ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-yellow-400" />
                ) : (
                  <span
                    className={`size-2 shrink-0 rounded-full ${done ? 'bg-yellow-400' : 'bg-zinc-700'}`}
                  />
                )}
                <span>{step}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default AgentStatus
