'use client'

import { Sun, Utensils, MapPin, PartyPopper, Wallet, ArrowRight, Sparkles } from 'lucide-react'
import { formatINR, type TravelPlan } from '@/lib/travel-data'

export function TravelResult({ plan }: { plan: TravelPlan }) {
  const rows = [
    { icon: Sun, label: 'Weather', value: `${plan.weatherC}°C`, sub: plan.weatherLabel },
    { icon: Utensils, label: 'Food', value: `${plan.restaurants} spots`, sub: 'Top local restaurants' },
    { icon: MapPin, label: 'Experiences', value: `${plan.places} places`, sub: 'Recommended to explore' },
    { icon: PartyPopper, label: 'Events', value: `${plan.events} events`, sub: 'Happening this week' },
  ]

  return (
    <div className="pointer-events-auto absolute right-4 top-1/2 z-20 w-[min(92%,340px)] -translate-y-1/2 animate-voyo-slide-in md:right-6">
      <div className="rounded-3xl border border-primary/30 bg-black/80 p-5 backdrop-blur-xl glow-yellow">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <Sparkles className="size-3.5" />
          VOYO has planned your trip
        </div>

        <div className="mt-3">
          <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
            {plan.destination}
          </h3>
          <p className="text-sm text-muted-foreground">
            {plan.days} Days • {formatINR(plan.budget)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <row.icon className="size-4 text-primary" />
              <p className="mt-2 text-base font-semibold text-foreground">{row.value}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{row.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/10 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Estimated spend</span>
          </div>
          <span className="font-display text-lg font-bold text-primary">{formatINR(plan.estimatedSpend)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.highlights.map((h) => (
            <span
              key={h}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          View Full Trip Plan
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
