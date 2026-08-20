import React from 'react'
import { MapPin } from 'lucide-react'
import { POPULAR_DESTINATIONS } from '../lib/travel-data'

export function DestinationInput({
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
        <MapPin className="size-3.5 text-yellow-400" />
        Destination city in India
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Where do you want to go?"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5 text-lg font-medium text-white outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400">Popular:</span>
        {POPULAR_DESTINATIONS.map((city) => {
          const active = city.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={city}
              type="button"
              disabled={disabled}
              onClick={() => onChange(city)}
              className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${
                active
                  ? 'border-yellow-400 bg-yellow-400 text-black font-bold shadow-md'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-yellow-400/50 hover:text-white'
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
