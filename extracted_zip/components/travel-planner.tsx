'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plane,
  Calendar,
  Sparkles,
  Loader2,
  Info,
  ArrowLeft,
  LogOut,
  Volume2,
  VolumeX,
  RefreshCw,
  Car,
} from 'lucide-react'
import { DestinationInput } from './destination-input'
import { BudgetSelector } from './budget-selector'
import { AgentScene } from './agent-scene'
import { AgentStatus } from './agent-status'
import { TravelResult } from './travel-result'
import { useSpeech } from '@/lib/use-speech'
import {
  DURATIONS,
  THINKING_STEPS,
  PHASE_DURATIONS,
  BASELINE_PER_DAY,
  generatePlan,
  buildNarration,
  formatINR,
  type Phase,
  type TravelPlan,
} from '@/lib/travel-data'

const DURATION_LABELS: Record<number, string> = {
  2: '2 Days (Quick Escape)',
  3: '3 Days (Weekend)',
  5: '5 Days (Extended)',
  7: '7 Days (Full Journey)',
}

// Captions shown during the transient arrival phases.
const CAPTIONS: Partial<Record<Phase, string>> = {
  arriving: 'Your VOYO concierge is arriving...',
  exiting: 'Stepping out to meet you...',
  walking: 'Walking over to plan your trip...',
}

export function TravelPlanner() {
  const [destination, setDestination] = useState('Chikmagalur')
  const [days, setDays] = useState<number>(5)
  const [budget, setBudget] = useState<number>(50000)
  const [phase, setPhase] = useState<Phase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [plan, setPlan] = useState<TravelPlan | null>(null)
  const [muted, setMuted] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { supported, speaking, speak, cancel } = useSpeech()
  const timers = useRef<number[]>([])
  const minBudget = days * BASELINE_PER_DAY

  useEffect(() => {
    setMounted(true)
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      cancel()
    }
  }, [cancel])

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  function reset() {
    clearTimers()
    cancel()
    if (phase !== 'idle') {
      setPhase('idle')
      setPlan(null)
    }
  }

  function run() {
    if (!destination.trim()) return
    clearTimers()
    cancel()
    setPlan(null)
    setStepIndex(0)
    setPhase('arriving')

    const dest = destination.trim()
    const finalPlan = generatePlan(dest, days, Math.max(budget, minBudget))

    // Cinematic phase timeline.
    const tExit = PHASE_DURATIONS.arriving
    const tWalk = tExit + PHASE_DURATIONS.exiting
    const tThink = tWalk + PHASE_DURATIONS.walking
    const tPresent = tThink + PHASE_DURATIONS.thinking

    timers.current.push(window.setTimeout(() => setPhase('exiting'), tExit))
    timers.current.push(window.setTimeout(() => setPhase('walking'), tWalk))
    timers.current.push(window.setTimeout(() => setPhase('thinking'), tThink))

    // Status steps stream while the agent "thinks".
    const perStep = PHASE_DURATIONS.thinking / THINKING_STEPS.length
    THINKING_STEPS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStepIndex(i), tThink + i * perStep))
    })

    // The reveal: itinerary panel + spoken narration together.
    timers.current.push(
      window.setTimeout(() => {
        setPlan(finalPlan)
        setPhase('presenting')
        if (!muted) speak(buildNarration(finalPlan))
      }, tPresent),
    )
  }

  function replay() {
    if (plan) {
      cancel()
      speak(buildNarration(plan))
    }
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m
      if (next) cancel()
      else if (plan && phase === 'presenting') speak(buildNarration(plan))
      return next
    })
  }

  const busy = phase !== 'idle' && phase !== 'presenting'
  const caption = CAPTIONS[phase]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Sub header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Plane className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
            Automated Vacation Planner
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10">
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* LEFT — Planner card */}
        <div className="order-2 rounded-3xl border border-border bg-card/60 p-5 backdrop-blur md:p-6 lg:order-1">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 font-display text-lg font-bold text-primary-foreground">
              VOYO <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">Your AI Travel Concierge</h2>
              <p className="text-sm text-muted-foreground">Enter your destination, VOYO arrives to plan it.</p>
            </div>
          </div>

          <div className="space-y-6">
            <DestinationInput
              value={destination}
              onChange={(v) => {
                setDestination(v)
                reset()
              }}
              disabled={busy}
            />

            {/* Duration */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
                <Calendar className="size-3.5" />
                Duration (days)
              </label>
              <select
                value={days}
                disabled={busy}
                onChange={(e) => {
                  setDays(Number(e.target.value))
                  reset()
                }}
                className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-3 text-base font-medium text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d} className="bg-card">
                    {DURATION_LABELS[d]}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDays(d)
                      reset()
                    }}
                    className={`rounded-md border px-3 py-1 text-xs transition disabled:opacity-50 ${
                      days === d
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            <BudgetSelector
              value={budget}
              onChange={(v) => {
                setBudget(v)
                reset()
              }}
              min={minBudget}
              disabled={busy}
            />

            <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                  Realistic baseline for {days} Days in {destination || 'your city'}:{' '}
                  <span className="font-semibold text-foreground">{formatINR(minBudget)}</span> (covers stay, meals &
                  transit).
                </span>
              </p>
              <button
                type="button"
                onClick={run}
                disabled={busy || !destination.trim()}
                className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto glow-yellow"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    VOYO en route...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {phase === 'presenting' ? 'Re-run VOYO Agent' : 'Run VOYO Agent'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — 3D cinematic stage */}
        <div className="relative order-1 h-[440px] overflow-hidden rounded-3xl border border-border bg-[#050505] md:h-[560px] lg:order-2 lg:h-[640px]">
          {/* atmospheric glow */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_80%,rgba(255,230,0,0.1),transparent_60%)]" />

          {mounted && <AgentScene phase={phase} destination={destination} />}

          {/* Idle label */}
          {phase === 'idle' && (
            <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 animate-voyo-float">
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-black/60 px-4 py-1.5 backdrop-blur">
                <Car className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">VOYO — your AI travel concierge is standing by</span>
              </div>
            </div>
          )}

          {/* Arrival captions */}
          {caption && (
            <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 animate-voyo-fade-up">
              <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-black/70 px-4 py-1.5 backdrop-blur glow-yellow">
                <span className="size-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">{caption}</span>
              </div>
            </div>
          )}

          {/* Thinking status */}
          {phase === 'thinking' && <AgentStatus stepIndex={stepIndex} />}

          {/* Presenting — spoken + on-screen itinerary */}
          {phase === 'presenting' && plan && (
            <>
              <div className="absolute left-1/2 top-6 z-30 flex -translate-x-1/2 items-center gap-2 animate-voyo-fade-up">
                <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-black/70 px-4 py-1.5 backdrop-blur glow-yellow">
                  {speaking ? (
                    <span className="flex items-end gap-0.5" aria-hidden>
                      <span className="h-2 w-0.5 animate-voyo-eq rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="h-3 w-0.5 animate-voyo-eq rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="h-2.5 w-0.5 animate-voyo-eq rounded-full bg-primary" />
                    </span>
                  ) : (
                    <Sparkles className="size-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {speaking ? 'VOYO is presenting your trip' : 'Your trip is ready'}
                  </span>
                </div>
                {supported && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={muted ? 'Unmute narration' : 'Mute narration'}
                      className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-black/70 text-primary backdrop-blur transition hover:bg-primary/10"
                    >
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={replay}
                      aria-label="Replay narration"
                      className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-black/70 text-primary backdrop-blur transition hover:bg-primary/10"
                    >
                      <RefreshCw className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              <TravelResult plan={plan} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
