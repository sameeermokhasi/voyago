// Mock data + types for the VOYO travel planner.
// Structured so real APIs can be swapped in later without touching the UI.

export type AgentState = 'idle' | 'thinking' | 'success'

// Cinematic phases for the AI concierge arrival sequence.
export type Phase = 'idle' | 'arriving' | 'exiting' | 'walking' | 'thinking' | 'presenting'

export const PHASE_ORDER: Phase[] = ['idle', 'arriving', 'exiting', 'walking', 'thinking', 'presenting']

export function phaseIndex(p: Phase): number {
  return PHASE_ORDER.indexOf(p)
}

// True when `p` has reached (or passed) `min` in the sequence.
export function phaseAtLeast(p: Phase, min: Phase): boolean {
  return phaseIndex(p) >= phaseIndex(min)
}

// Duration (ms) each transient phase stays on screen before advancing.
export const PHASE_DURATIONS: Record<Exclude<Phase, 'idle' | 'presenting'>, number> = {
  arriving: 2400,
  exiting: 1500,
  walking: 2100,
  thinking: 3600,
}

export const POPULAR_DESTINATIONS = [
  'Goa',
  'Mumbai',
  'Bangalore',
  'Jaipur',
  'Manali',
  'Udaipur',
  'Kerala',
  'Varanasi',
  'Rishikesh',
  'Chikmagalur',
] as const

export const DURATIONS = [2, 3, 5, 7] as const

export const BUDGET_PRESETS = [
  { label: 'Budget Saver', amount: 7500 },
  { label: 'Explorer', amount: 13500 },
  { label: 'Comfort', amount: 24000 },
] as const

// Rough origin the traveller departs from — used for the holographic route.
export const ORIGIN = 'Bangalore'

// Per-day realistic baseline (stay + meals + transit) in INR.
export const BASELINE_PER_DAY = 1500

export interface TravelPlan {
  destination: string
  days: number
  budget: number
  weatherC: number
  weatherLabel: string
  restaurants: number
  places: number
  events: number
  estimatedSpend: number
  highlights: string[]
}

// The status lines VOYO cycles through while "thinking".
export const THINKING_STEPS = [
  'Analyzing destination...',
  'Checking weather...',
  'Finding local experiences...',
  'Optimizing your budget...',
  'Building your itinerary...',
] as const

const WEATHER_BY_CITY: Record<string, { c: number; label: string }> = {
  Goa: { c: 31, label: 'Sunny & humid' },
  Mumbai: { c: 30, label: 'Warm & coastal' },
  Bangalore: { c: 26, label: 'Pleasant' },
  Jaipur: { c: 33, label: 'Hot & dry' },
  Manali: { c: 12, label: 'Cool & crisp' },
  Udaipur: { c: 29, label: 'Warm & clear' },
  Kerala: { c: 30, label: 'Tropical' },
  Varanasi: { c: 32, label: 'Warm' },
  Rishikesh: { c: 24, label: 'Mild & breezy' },
  Chikmagalur: { c: 27, label: 'Misty hills' },
}

const HIGHLIGHTS_BY_CITY: Record<string, string[]> = {
  Chikmagalur: ['Mullayanagiri Peak', 'Coffee estate stay', 'Hebbe Falls trek'],
  Goa: ['Sunset at Palolem', 'Old Goa churches', 'Beach shack crawl'],
  Manali: ['Solang Valley', 'Old Manali cafes', 'Snow point drive'],
  Kerala: ['Alleppey houseboat', 'Munnar tea trails', 'Fort Kochi walk'],
}

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

// Deterministic mock planner so the same inputs always feel consistent.
export function generatePlan(destination: string, days: number, budget: number): TravelPlan {
  const seed = hashSeed(`${destination.toLowerCase()}-${days}`)
  const weather = WEATHER_BY_CITY[destination] ?? { c: 20 + (seed % 15), label: 'Pleasant' }
  const highlights =
    HIGHLIGHTS_BY_CITY[destination] ??
    [`Explore central ${destination}`, `Local food trail`, `Sunset viewpoint`]

  const spendFactor = 0.78 + ((seed >> 3) % 15) / 100 // 78% – 92% of budget
  const estimatedSpend = Math.round((budget * spendFactor) / 100) * 100

  return {
    destination,
    days,
    budget,
    weatherC: weather.c,
    weatherLabel: weather.label,
    restaurants: 3 + (seed % 3),
    places: 6 + ((seed >> 2) % 5),
    events: 3 + ((seed >> 4) % 3),
    estimatedSpend,
    highlights,
  }
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

// Build a spoken concierge script from a finished plan (for TTS).
export function buildNarration(plan: TravelPlan): string {
  const spend = plan.estimatedSpend.toLocaleString('en-IN')
  const [a, b, c] = plan.highlights
  return (
    `Alright, I've mapped out your ${plan.days}-day trip to ${plan.destination}. ` +
    `Expect ${plan.weatherLabel.toLowerCase()} weather around ${plan.weatherC} degrees. ` +
    `I've lined up ${plan.places} must-see spots, ${plan.restaurants} standout places to eat, and ${plan.events} local events. ` +
    `Top of the list: ${a}, ${b}, and ${c}. ` +
    `All of it lands at roughly ${spend} rupees, comfortably inside your budget. ` +
    `Your itinerary is on screen — enjoy the trip!`
  )
}
