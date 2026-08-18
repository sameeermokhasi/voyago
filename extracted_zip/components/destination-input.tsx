'use client'

import { MapPin } from 'lucide-react'
import { POPULAR_DESTINATIONS } from '@/lib/travel-data'

export function DestinationInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
        <MapPin className="size-3.5" />
        Destination city in India
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Where do you want to go?"
        className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3.5 text-lg font-medium text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Popular:</span>
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
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
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
