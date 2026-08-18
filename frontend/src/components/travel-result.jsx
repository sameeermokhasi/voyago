import React from 'react'
import { Sun, Utensils, MapPin, PartyPopper, Wallet, ArrowRight, Sparkles } from 'lucide-react'
import { formatINR } from '../lib/travel-data'

export function TravelResult({ plan, onScrollToDossier }) {
  if (!plan) return null

  const rows = [
    { icon: Sun, label: 'Weather', value: `${plan.weatherC}°C`, sub: plan.weatherLabel },
    { icon: Utensils, label: 'Food', value: `${plan.restaurants} spots`, sub: 'Top restaurants' },
    { icon: MapPin, label: 'Experiences', value: `${plan.places} places`, sub: 'To explore' },
    { icon: PartyPopper, label: 'Events', value: `${plan.events} events`, sub: 'This week' },
  ]

  return (
    <div className="pointer-events-auto absolute right-3 md:right-6 top-16 md:top-20 z-30 w-[min(92%,330px)] animate-voyo-slide-in">
      <div className="rounded-3xl border border-yellow-400/50 bg-black/95 p-4 md:p-5 backdrop-blur-2xl glow-yellow shadow-2xl space-y-3">
        {/* Header Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-yellow-400">
          <Sparkles className="size-3.5 fill-yellow-400 shrink-0" />
          <span>VOYO HAS PLANNED YOUR TRIP</span>
        </div>

        {/* Destination & Meta */}
        <div>
          <h3 className="font-black text-2xl uppercase tracking-tight text-white leading-tight">
            {plan.destination}
          </h3>
          <p className="text-xs text-zinc-400 font-semibold mt-0.5">
            {plan.days} Days • {formatINR(plan.budget)}
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-2">
              <row.icon className="size-3.5 text-yellow-400" />
              <p className="mt-1 text-sm font-black text-white leading-none">{row.value}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{row.sub}</p>
            </div>
          ))}
        </div>

        {/* Estimated Spend Banner */}
        <div className="flex items-center justify-between rounded-xl border border-yellow-400/35 bg-yellow-400/10 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Wallet className="size-3.5 text-yellow-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300">Estimated spend</span>
          </div>
          <span className="font-black text-base text-yellow-400">{formatINR(plan.estimatedSpend)}</span>
        </div>

        {/* Highlights Pills */}
        <div className="flex flex-wrap gap-1">
          {plan.highlights?.map((h) => (
            <span
              key={h}
              className="rounded-full border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-300"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Full Plan Action Button */}
        <button
          type="button"
          onClick={onScrollToDossier}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 py-2.5 text-xs font-black text-black transition shadow-lg shadow-yellow-400/25 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          View Full Trip Plan
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export default TravelResult
