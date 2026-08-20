import React from 'react'
import { Sun, Utensils, MapPin, PartyPopper, Wallet, ArrowRight, Sparkles } from 'lucide-react'
import { formatINR } from '../lib/travel-data'

export function TravelResult({ plan, onScrollToDossier }) {
  if (!plan) return null

  const rows = [
    { icon: Sun, label: 'Weather', value: `${plan.weatherC}°C`, sub: plan.weatherLabel },
    { icon: Utensils, label: 'Food', value: `${plan.restaurants} spots`, sub: 'Top local restaurants' },
    { icon: MapPin, label: 'Experiences', value: `${plan.places} places`, sub: 'Recommended to explore' },
    { icon: PartyPopper, label: 'Events', value: `${plan.events} events`, sub: 'Happening this week' },
  ]

  return (
    <div className="pointer-events-auto absolute right-4 top-1/2 z-20 w-[min(92%,340px)] -translate-y-1/2 animate-voyo-slide-in md:right-6">
      <div className="rounded-3xl border border-amber-400/40 bg-black/85 p-5 backdrop-blur-xl glow-yellow shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Sparkles className="size-3.5 fill-amber-400" />
          VOYO has planned your trip
        </div>

        <div className="mt-3">
          <h3 className="font-extrabold text-2xl uppercase tracking-tight text-white">
            {plan.destination}
          </h3>
          <p className="text-sm text-zinc-400">
            {plan.days} Days • {formatINR(plan.budget)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <row.icon className="size-4 text-amber-400" />
              <p className="mt-2 text-base font-bold text-white">{row.value}</p>
              <p className="text-[11px] leading-tight text-zinc-400">{row.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-amber-400" />
            <span className="text-xs text-zinc-300">Estimated spend</span>
          </div>
          <span className="font-extrabold text-lg text-amber-400">{formatINR(plan.estimatedSpend)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.highlights?.map((h) => (
            <span
              key={h}
              className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] text-zinc-300"
            >
              {h}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onScrollToDossier}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 py-3 text-sm font-black text-black transition shadow-md shadow-amber-400/20 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          View Full Dossier
          <ArrowRight className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
