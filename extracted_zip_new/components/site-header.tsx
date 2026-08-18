'use client'

import { Home, User, Wallet, Clock, MapPin, MessageCircle, Car, LogOut } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', icon: Home },
  { label: 'Profile', icon: User },
  { label: 'Wallet', icon: Wallet },
  { label: 'Ride History', icon: Clock },
  { label: 'My Vacations', icon: MapPin, active: true },
  { label: 'Messages', icon: MessageCircle },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Car className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">VOYAGO</span>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">samy</p>
            <p className="text-[11px] leading-tight text-muted-foreground">Rider</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
