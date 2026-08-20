import React, { useEffect, useRef, useState } from 'react'
import { Plane, Calendar, Sparkles, Loader2, Info, ArrowLeft, LogOut, ChevronDown, Check } from 'lucide-react'
import { DestinationInput } from './destination-input'
import { BudgetSelector } from './budget-selector'
import { AgentScene } from './agent-scene'
import { AgentStatus } from './agent-status'
import { TravelResult } from './travel-result'
import { TravelDossier } from './travel-dossier'
import {
  DURATIONS,
  DURATION_LABELS,
  THINKING_STEPS,
  BASELINE_PER_DAY,
  generatePlan,
  formatINR,
} from '../lib/travel-data'

export function TravelPlanner({ onSelectPlan }) {
  const getToday = () => new Date().toISOString().split('T')[0]
  const getFuture = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0] }

  const [destination, setDestination] = useState('Chikmagalur')
  const [fromDate, setFromDate] = useState(getToday())
  const [toDate, setToDate] = useState(getFuture(5))
  const [days, setDays] = useState(5)
  const [budget, setBudget] = useState(50000)
  const [state, setState] = useState('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [plan, setPlan] = useState(null)
  const [mounted, setMounted] = useState(false)

  const calculateDays = (start, end) => {
    if (!start || !end) return 1
    const s = new Date(start)
    const e = new Date(end)
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }

  const timers = useRef([])
  const dropdownRef = useRef(null)
  const minBudget = days * BASELINE_PER_DAY

  useEffect(() => {
    setMounted(true)
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setState('idle')
    setStepIndex(0)
    setPlan(null)
  }

  const run = () => {
    if (!destination.trim() || Number(budget || 0) < minBudget) return
    reset()
    setState('thinking')

    let wsBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws') : 'ws://127.0.0.1:8000'
    if (wsBase.endsWith('/api')) wsBase = wsBase.replace('/api', '')
    if (wsBase.endsWith('/api/')) wsBase = wsBase.replace('/api/', '')

    const ws = new WebSocket(`${wsBase}/ws/travel-planner`)
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ destination, fromDate, toDate, budget, days }))
    }
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.status === 'thinking') {
          setStepIndex(prev => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev))
        } else if (msg.status === 'success') {
          const result = generatePlan(destination, days, budget)
          result.realWeather = msg.data.weather
          result.realStays = msg.data.stays
          setPlan(result)
          setState('success')
          ws.close()
        } else if (msg.status === 'error') {
          console.error("Travel Buddy Error:", msg.message)
          const result = generatePlan(destination, days, budget)
          setPlan(result)
          setState('success')
          ws.close()
        }
      } catch(e) {
        console.error("Error parsing WS message", e)
      }
    }
    
    ws.onerror = (err) => {
      console.error('WebSocket Error:', err)
      const result = generatePlan(destination, days, budget)
      setPlan(result)
      setState('success')
    }
  }

  const scrollToDossier = () => {
    const el = document.getElementById('full-travel-dossier')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const busy = state === 'thinking'

  return (
    <div className="w-full space-y-6">
      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Input Control Panel */}
        <div className="order-2 flex flex-col justify-between rounded-3xl border border-zinc-800 bg-[#09090c] p-6 lg:order-1 shadow-2xl">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                <span className="size-1.5 rounded-full bg-yellow-400 animate-ping" />
                VOYO Travel Intelligence
              </div>
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                Configure Your Expedition
              </h2>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Set destination, trip duration, and budget. VOYO analyzes live weather, verified stays, local food, and outstation routes.
              </p>
            </div>

            <div className="space-y-5">
              <DestinationInput
                value={destination}
                onChange={(v) => {
                  setDestination(v)
                  reset()
                }}
                disabled={busy}
              />

              {/* Date Pickers */}
              <div className="relative space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                  <Calendar className="size-3.5" />
                  Travel Dates ({days} {days === 1 ? 'Day' : 'Days'})
                </label>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 ml-1">From</label>
                    <input
                      type="date"
                      disabled={busy}
                      value={fromDate}
                      min={getToday()}
                      onChange={(e) => {
                        setFromDate(e.target.value)
                        const d = calculateDays(e.target.value, toDate)
                        setDays(d)
                        const newMin = d * BASELINE_PER_DAY
                        if (budget < newMin) setBudget(newMin)
                        reset()
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 text-sm font-semibold text-white outline-none transition hover:border-zinc-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60 [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1 ml-1">To</label>
                    <input
                      type="date"
                      disabled={busy}
                      value={toDate}
                      min={fromDate}
                      onChange={(e) => {
                        setToDate(e.target.value)
                        const d = calculateDays(fromDate, e.target.value)
                        setDays(d)
                        const newMin = d * BASELINE_PER_DAY
                        if (budget < newMin) setBudget(newMin)
                        reset()
                      }}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 text-sm font-semibold text-white outline-none transition hover:border-zinc-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <BudgetSelector
                value={budget}
                days={days}
                onChange={(v) => {
                  setBudget(v)
                  reset()
                }}
                min={minBudget}
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-zinc-800/90 pt-6 sm:flex-row sm:items-center">
            <p className="flex items-start gap-2.5 text-xs text-zinc-400">
              <Info className="mt-0.5 size-4 shrink-0 text-yellow-400" />
              <span>
                Realistic baseline for {days} Days in {destination || 'your city'}:{' '}
                <span className="font-bold text-white">{formatINR(minBudget)}</span> (covers minimum stay, meals & transit).
              </span>
            </p>
            <button
              type="button"
              onClick={run}
              disabled={busy || !destination.trim() || Number(budget || 0) < minBudget}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 px-7 py-4 font-extrabold text-sm text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 sm:w-auto glow-yellow shadow-xl shadow-yellow-400/25 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  Planning...
                </>
              ) : Number(budget || 0) < minBudget ? (
                <>
                  <Sparkles className="size-4 text-zinc-500" />
                  Min {formatINR(minBudget)} Required
                </>
              ) : (
                <>
                  <Sparkles className="size-4 fill-black" />
                  {state === 'success' ? 'Re-run VOYO Agent' : 'Run VOYO Agent'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT — Large 3D Agent Stage */}
        <div className="relative order-1 h-[560px] md:h-[680px] lg:h-[740px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#030304] lg:order-2 shadow-2xl">
          {/* atmospheric glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_75%,rgba(255,230,0,0.14),transparent_60%)]" />

          {mounted && <AgentScene state={state} destination={destination} />}

          {/* Idle label */}
          {state === 'idle' && (
            <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 animate-voyo-float">
              <div className="flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/75 px-4 py-1.5 backdrop-blur-md shadow-xl">
                <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs md:text-sm font-semibold text-white">VOYO — Your AI Travel Buddy</span>
              </div>
            </div>
          )}

          {state === 'thinking' && <AgentStatus stepIndex={stepIndex} />}

          {state === 'success' && plan && (
            <>
              <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 animate-voyo-fade-up">
                <div className="flex items-center gap-2 rounded-full border border-yellow-400/40 bg-black/75 px-4 py-1.5 backdrop-blur-md glow-yellow shadow-xl">
                  <Sparkles className="size-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs md:text-sm font-bold text-white">Your trip is ready</span>
                </div>
              </div>
              <TravelResult plan={plan} onScrollToDossier={scrollToDossier} />
            </>
          )}
        </div>
      </div>

      {/* FULL EXPANSIVE TRAVEL PLAN DOSSIER */}
      {state === 'success' && plan && (
        <TravelDossier
          plan={plan}
          destination={destination}
          days={days}
          budget={budget}
          onBookCab={() => {
            if (onSelectPlan) onSelectPlan(plan)
          }}
        />
      )}
    </div>
  )
}

export default TravelPlanner
