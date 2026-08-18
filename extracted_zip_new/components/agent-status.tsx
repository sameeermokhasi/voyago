'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { THINKING_STEPS } from '@/lib/travel-data'

export function AgentStatus({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 w-[min(90%,380px)] -translate-x-1/2 animate-voyo-fade-up">
      <div className="rounded-2xl border border-primary/30 bg-black/70 p-4 backdrop-blur-md glow-yellow">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4 animate-pulse" />
          VOYO is planning your trip...
        </div>
        <ul className="mt-3 space-y-1.5">
          {THINKING_STEPS.map((step, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <li
                key={step}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  active ? 'text-foreground' : done ? 'text-muted-foreground line-through' : 'text-muted-foreground/40'
                }`}
              >
                {active ? (
                  <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
                ) : (
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${done ? 'bg-primary' : 'bg-muted-foreground/30'}`}
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
