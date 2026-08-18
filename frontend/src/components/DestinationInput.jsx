import React from 'react'
import { MapPin } from 'lucide-react'
import { POPULAR_DESTINATIONS } from '../lib/travel-data'

export function DestinationInput({ value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
        <MapPin className="size-3.5" />
        Destination City in India
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Where do you want to go? e.g. Chikmagalur, Goa, Coorg..."
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3.5 text-lg font-medium text-white placeholder-zinc-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-zinc-400">Popular:</span>
        {POPULAR_DESTINATIONS.map((city) => {
          const active = city.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={city}
              type="button"
              disabled={disabled}
              onClick={() => onChange(city)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                active
                  ? 'border-amber-400 bg-amber-400 text-black font-bold shadow-sm'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              {city}
            </button>
          )
        })}
      </div>
    </div>
  )
}
