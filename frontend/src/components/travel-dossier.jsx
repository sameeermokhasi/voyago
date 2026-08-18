import React, { useState } from 'react'
import {
  FileText,
  Printer,
  Copy,
  Check,
  Download,
  ArrowRight,
  Utensils,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Star,
  PartyPopper,
  Code,
  Sun,
  CloudRain,
  CloudSun,
  Mountain,
  Car,
  Hotel,
  ShieldCheck,
  Wallet,
  Crown,
  Compass,
} from 'lucide-react'
import { formatINR, getCityDetails } from '../lib/travel-data'

export function TravelDossier({ plan, destination, days, budget, onBookCab }) {
  const [activeTab, setActiveTab] = useState('pdf') // 'pdf' | 'markdown'
  const [copied, setCopied] = useState(false)

  if (!plan) return null

  const dest = destination || plan.destination || 'Ladakh'
  const numDays = days || plan.days || 14
  const totalBudget = budget || plan.budget || 500000
  const estimatedSpend = plan.estimatedSpend || Math.round(totalBudget * 0.88)

  // Fetch true destination-aware & tier-aware dataset for the chosen city & budget!
  const cityData = getCityDetails(dest, totalBudget, numDays)
  const destTitle = cityData.city
  const tier = cityData.tier

  // Line-by-line Pricing Breakdown
  const cabCost = Math.round(estimatedSpend * 0.28)
  const stayCost = Math.round(estimatedSpend * 0.46)
  const foodCost = Math.round(estimatedSpend * 0.16)
  const activitiesCost = estimatedSpend - (cabCost + stayCost + foodCost)

  // 1. Generate Day-by-Day Weather starting from TODAY for exact `numDays`
  const baseWeather = cityData.weather || { c: 20, low: 10, label: 'Pleasant & breezy', rain: '5%' }
  const weatherVariations = [
    { cond: baseWeather.label, high: baseWeather.c, low: baseWeather.low, rain: baseWeather.rain, icon: CloudSun },
    { cond: 'Clear blue skies & crisp sunshine', high: baseWeather.c + 1, low: baseWeather.low, rain: '2%', icon: Sun },
    { cond: 'Mild sunny afternoon with cool evening', high: baseWeather.c, low: baseWeather.low - 1, rain: '5%', icon: Sun },
    { cond: 'Light mountain breeze & passing clouds', high: baseWeather.c - 1, low: baseWeather.low, rain: '8%', icon: CloudRain },
    { cond: 'Crisp morning & golden sunset', high: baseWeather.c + 1, low: baseWeather.low + 1, rain: '2%', icon: Sun },
    { cond: 'Clear starry night & mild mountain day', high: baseWeather.c, low: baseWeather.low, rain: '2%', icon: Sun },
    { cond: 'Fresh alpine breeze & golden daylight', high: baseWeather.c - 1, low: baseWeather.low - 1, rain: '5%', icon: CloudSun },
  ]

  const today = new Date()
  const dailyWeatherList = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    const w = weatherVariations[i % weatherVariations.length]
    return {
      dayNum: i + 1,
      dateStr,
      ...w,
    }
  })

  // 2. Destination-Aware & Tier-Aware Restaurants
  const restaurants = cityData.restaurants

  // 3. Destination-Aware Curated Events
  const events = cityData.events

  // 4. Dynamic Timeline strictly respecting `numDays` for this specific city
  const generateDynamicTimeline = (totalDays) => {
    const planDays = cityData.daysPlan || []
    const daysList = []
    const baseDailyCost = Math.round(estimatedSpend / totalDays)

    for (let i = 0; i < totalDays; i++) {
      if (i === totalDays - 1 && totalDays > 1) {
        // Final Day: Departure day with souvenir shopping and airport return
        const lastDayData = planDays[planDays.length - 1] || {
          title: `Day ${totalDays}: ${destTitle} Souvenir Market & Return Departure`,
          items: [
            `09:00 AM: Morning souvenir and local handicraft shopping in ${destTitle}.`,
            `12:30 PM: Farewell feast at a top-rated dining destination.`,
            `03:00 PM: Hotel checkout and luggage packing.`,
            `05:00 PM: Voyago Private AC Cab return drop-off to Airport / Railway Station.`,
          ],
        }
        daysList.push({
          day: totalDays,
          title: `Day ${totalDays}: ${lastDayData.title.replace(/^Day \d+:\s*/, '')}`,
          cost: `Est. Spend: ${formatINR(Math.round(baseDailyCost * 0.85))}`,
          items: lastDayData.items,
        })
      } else {
        const dayData = planDays[i] || {
          title: `Day ${i + 1}: ${destTitle} Regional Excursion & Scenic Valley Trail (${50 + i * 15} km)`,
          items: [
            `08:30 AM: Scenic road trip to famous viewpoints, waterfalls, and regional landmarks (${50 + i * 15} km from ${destTitle}).`,
            `01:00 PM: Gourmet regional lunch at a scenic hillside / heritage eatery.`,
            `04:30 PM: Cultural exploration, artisan workshops, and landscape photography.`,
            `07:30 PM: Evening dinner with local delicacies.`,
          ],
        }
        const costFactor = i === 0 ? 0.95 : i === 1 ? 1.15 : 1.0
        daysList.push({
          day: i + 1,
          title: `Day ${i + 1}: ${dayData.title.replace(/^Day \d+:\s*/, '')}`,
          cost: `Est. Spend: ${formatINR(Math.round(baseDailyCost * costFactor))}`,
          items: dayData.items,
        })
      }
    }
    return daysList
  }

  const dynamicTimeline = generateDynamicTimeline(numDays)

  // Markdown Document for Export
  const markdownCode = `# ${destTitle.toUpperCase()} STRUCTURED TRAVEL DOSSIER (${tier.label.toUpperCase()})
**Total Duration**: ${numDays} Days / ${numDays - 1} Nights • **Total Budget**: ${formatINR(totalBudget)} • **Estimated Spend**: ${formatINR(estimatedSpend)} • **Tier**: ${tier.tag}

---

## ☀️ ${numDays}-DAY DAILY WEATHER FORECAST (STARTING FROM TODAY)
${dailyWeatherList
  .map(
    (w) => `* **Day ${w.dayNum} (${w.dateStr})**: ${w.high}°C / ${w.low}°C — ${w.cond} (Rain probability: ${w.rain})`,
  )
  .join('\n')}

---

## 🍽️ ${tier.heading} IN ${destTitle.toUpperCase()}
${restaurants
  .map(
    (r) => `### ${r.id}. ${r.name} (${r.priceRange})
* **Cuisine**: ${r.cuisine}
* **Location**: ${r.location} | **Rating**: ${r.rating}
* **Must-Try**: ${r.itemsWithPrice}
* *${r.quote}*
`,
  )
  .join('\n')}

---

## 🗓️ CURATED LOCAL EVENTS & EXPERIENCES IN ${destTitle.toUpperCase()}
${events
  .map(
    (e) => `### ${e.title} [${e.category}]
* **Tag**: ${e.tag}
* **Price**: ${e.price}
* **When**: ${e.when}
* **Venue**: ${e.venue}
* **Details**: ${e.description}
`,
  )
  .join('\n')}

---

## 💰 TRANSPARENT FINANCIAL & BUDGET BREAKDOWN
| Category | Scope & Inclusions | Estimated Cost (INR) |
| :--- | :--- | :--- |
| 🚕 **Voyago Transit** | ${tier.transitLabel} | ${formatINR(cabCost)} |
| 🏨 **Verified Stays** | ${tier.stayLabel} (${numDays - 1} Nights) | ${formatINR(stayCost)} |
| 🍽️ **Dining & Cuisine** | Curated Tier Gastronomy, Signature Tastings, Royal Banquets | ${formatINR(foodCost)} |
| ⛰️ **Experiences & Passes** | Monument passes, private permits, national park safaris | ${formatINR(activitiesCost)} |
| **TOTAL ESTIMATED SPEND** | **Comfortably under allocated budget** | **${formatINR(estimatedSpend)}** |

---

## 🕒 STRUCTURED ${numDays}-DAY REGIONAL TIMELINE & ITINERARY
${dynamicTimeline
  .map(
    (t) => `### ${t.title} (${t.cost})
${t.items.map((i) => `* ${i}`).join('\n')}
`,
  )
  .join('\n')}

---
*Official Indian Travel Dossier • Generated by Voyago VOYO Concierge • www.voyago.com*
`

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadMd = () => {
    const blob = new Blob([markdownCode], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${destTitle.toLowerCase()}-${tier.key}-${numDays}days-travel-dossier.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintPDF = () => {
    setActiveTab('pdf')
    setTimeout(() => {
      window.print()
    }, 150)
  }

  return (
    <div className="mt-10 space-y-4">
      {/* 1. TOP DOSSIER BAR (HIDDEN IN PRINT) */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 md:p-5 shadow-2xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Badge */}
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-yellow-400 text-black shadow-md shrink-0">
              <FileText className="size-6 text-black" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-lg md:text-xl text-white uppercase tracking-tight">
                  {destTitle} Structured Travel Dossier
                </h3>
                <span className="rounded-full bg-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wide">
                  {tier.tag}
                </span>
                <span className="rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5">
                  PDF Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Duration: {numDays} Days / {numDays - 1} Nights • Total Budget: {formatINR(totalBudget)} • {tier.label}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 px-4 py-2.5 text-xs font-black text-black transition shadow-lg shadow-yellow-400/20"
            >
              <Printer className="size-3.5" />
              Download / Print PDF
            </button>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2.5 text-xs font-bold text-zinc-200 transition"
            >
              {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5 text-zinc-400" />}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
            <button
              type="button"
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2.5 text-xs font-bold text-zinc-200 transition"
            >
              <Download className="size-3.5 text-zinc-400" />
              .md File
            </button>
            <button
              type="button"
              onClick={onBookCab}
              className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2.5 text-xs font-black text-black transition shadow-md"
            >
              Plan Vacation
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="mt-4 flex items-center gap-2 border-b border-zinc-800 pt-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'pdf'
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="size-3.5" />
            Structured PDF Document
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
              activeTab === 'markdown'
                ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Code className="size-3.5" />
            Raw Markdown Code
          </button>
        </div>
      </div>

      {/* 2. THE STRUCTURED PDF DOCUMENT (PRINT AREA) */}
      <div
        id="structured-pdf-print-area"
        className={`${activeTab !== 'pdf' ? 'hidden print:block' : ''} rounded-2xl bg-white p-6 md:p-10 text-black shadow-2xl space-y-8 font-sans`}
      >
        {/* OFFICIAL HEADER (Visible in both PDF viewer and Print) */}
        <div className="border-b-2 border-black pb-4 flex items-center justify-between print-avoid-break">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              <span>VOYAGO OFFICIAL TRAVEL DOSSIER</span>
              <span>•</span>
              <span>CONFIRMED ITINERARY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight mt-1">
              {destTitle} Expedition Plan ({numDays} Days)
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 font-bold mt-1">
              <span>Duration: {numDays} Days / {numDays - 1} Nights</span>
              <span>•</span>
              <span>Allocated Budget: {formatINR(totalBudget)}</span>
              <span>•</span>
              <span className="text-black bg-yellow-400 px-2 py-0.5 rounded font-black">{tier.label}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-black text-yellow-400 px-3 py-1 text-xs font-black rounded-lg">
              VOYO AI CONCIERGE
            </span>
          </div>
        </div>

        {/* 1. NUMBER OF DAYS & FROM TODAY DAILY WEATHER FORECAST TABLE */}
        <div className="space-y-4 print-avoid-break">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-black text-sm md:text-base uppercase tracking-wider text-black">
              <Sun className="size-4 text-black" />
              1. {numDays}-DAY DAILY WEATHER FORECAST (STARTING FROM TODAY)
            </h3>
            <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md">
              Total Duration: {numDays} Full Days
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {dailyWeatherList.map((w) => (
              <div
                key={w.dayNum}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-black">Day {w.dayNum}</span>
                  <span className="text-[11px] font-bold text-zinc-500">{w.dateStr}</span>
                </div>

                <div className="flex items-center gap-2 my-1">
                  <w.icon className="size-4 text-amber-500 shrink-0" />
                  <span className="text-base font-black text-black">{w.high}°C</span>
                  <span className="text-xs text-zinc-400 font-bold">/ {w.low}°C</span>
                </div>

                <p className="text-[11px] text-zinc-700 font-medium leading-tight">{w.cond}</p>
                <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Rain Prob: {w.rain}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. TIER-AWARE TOP 3 RESTAURANTS (AFFORDABLE, COMFORT, OR LUXURY) */}
        <div className="space-y-4 print-avoid-break">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-black text-sm md:text-base uppercase tracking-wider text-black">
              <Utensils className="size-4 text-black" />
              2. {tier.heading} (PLACES TO EAT IN {destTitle.toUpperCase()})
            </h3>
            <span className="text-xs font-black px-2.5 py-1 rounded bg-black text-yellow-400">
              {tier.tag}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-6 items-center justify-center rounded bg-black text-[11px] font-black text-white">
                      {rest.id}
                    </span>
                    <span className="rounded bg-yellow-400 px-2 py-0.5 text-[11px] font-extrabold text-black">
                      {rest.priceRange}
                    </span>
                  </div>

                  <h4 className="mt-2 font-black text-base text-zinc-900 leading-snug">{rest.name}</h4>
                  <p className="text-xs text-zinc-600 font-medium">{rest.cuisine}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-red-500" /> {rest.location}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="size-3 fill-amber-500 text-amber-500" /> {rest.rating}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Must-Try / Signature Tasting:
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 mt-0.5">{rest.itemsWithPrice}</p>
                  </div>
                </div>

                <p className="text-[11px] italic text-zinc-500 border-t border-zinc-200/80 pt-2">
                  {rest.quote}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CURATED LOCAL EVENTS */}
        <div className="space-y-4 print-avoid-break">
          <h3 className="flex items-center gap-2 font-black text-sm md:text-base uppercase tracking-wider text-black">
            <Calendar className="size-4 text-black" />
            3. CURATED LOCAL EVENTS HAPPENING IN {destTitle.toUpperCase()} THIS WEEK
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.title} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-800">
                    {ev.tag}
                  </span>
                  <span className="rounded bg-black px-2 py-0.5 text-[11px] font-bold text-white">
                    {ev.category}
                  </span>
                </div>

                <h4 className="font-black text-base text-zinc-900">{ev.title}</h4>

                <div className="space-y-1 text-xs text-zinc-600 font-medium">
                  <p className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-zinc-500" /> <strong>When:</strong> {ev.when}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-red-500" /> <strong>Venue:</strong> {ev.venue}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-zinc-500" /> <strong>Cost:</strong> {ev.price}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-700 leading-relaxed font-medium">
                  ✨ {ev.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. STRUCTURED TIMELINE & CAB ITINERARY */}
        <div className="space-y-4 print-avoid-break">
          <h3 className="flex items-center gap-2 font-black text-sm md:text-base uppercase tracking-wider text-black">
            <Clock className="size-4 text-black" />
            4. STRUCTURED {numDays}-DAY REGIONAL TIMELINE & ITINERARY
          </h3>

          <div className="space-y-4">
            {dynamicTimeline.map((dayPlan) => (
              <div
                key={dayPlan.day}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 md:p-6 shadow-sm space-y-3 print-avoid-break"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-zinc-900">
                    {dayPlan.title}
                  </h4>
                  <span className="rounded bg-zinc-200 px-2.5 py-0.5 text-xs font-extrabold text-zinc-800">
                    {dayPlan.cost}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-700 font-medium">
                  {dayPlan.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-zinc-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 5. LINE-BY-LINE FINANCIAL BREAKDOWN TABLE */}
        <div className="space-y-3 print-avoid-break">
          <h3 className="flex items-center gap-2 font-black text-sm md:text-base uppercase tracking-wider text-black">
            <Wallet className="size-4 text-black" />
            5. ITEMIZED FINANCIAL & TRANSIT BREAKDOWN ({tier.label.toUpperCase()})
          </h3>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 font-black uppercase text-zinc-700">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Scope & Inclusions</th>
                  <th className="p-3 text-right">Estimated Cost (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                <tr>
                  <td className="p-3 font-bold">🚕 Voyago Transit</td>
                  <td className="p-3">{tier.transitLabel}</td>
                  <td className="p-3 text-right font-black text-black">{formatINR(cabCost)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">🏨 Verified Stays</td>
                  <td className="p-3">{tier.stayLabel} ({numDays - 1} Nights)</td>
                  <td className="p-3 text-right font-black text-black">{formatINR(stayCost)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">🍽️ Dining & Food</td>
                  <td className="p-3">Curated Tier Gastronomy, Signature Tastings & Banquets</td>
                  <td className="p-3 text-right font-black text-black">{formatINR(foodCost)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">⛰️ Experiences & Entry</td>
                  <td className="p-3">Monument passes, national park safaris, bespoke cultural permits</td>
                  <td className="p-3 text-right font-black text-black">{formatINR(activitiesCost)}</td>
                </tr>
                <tr className="bg-yellow-400/20 font-black">
                  <td className="p-3 text-black">TOTAL ESTIMATED SPEND</td>
                  <td className="p-3 text-black">Comfortably within your {formatINR(totalBudget)} allocated budget</td>
                  <td className="p-3 text-right text-base text-black font-black">{formatINR(estimatedSpend)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER OF THE PDF DOCUMENT */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-200 pt-6 text-[11px] font-semibold text-zinc-400 print-avoid-break">
          <span>Official Indian Travel Dossier • Generated by Voyago VOYO Concierge</span>
          <span>www.voyago.com • 24/7 Traveler Support in India</span>
        </div>
      </div>

      {/* 3. TAB 2: RAW MARKDOWN CODE (HIDDEN IN PRINT) */}
      {activeTab === 'markdown' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#08090b] p-5 shadow-2xl print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="font-mono text-xs text-yellow-400 font-bold">dossier.md</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-1 text-xs font-bold text-black"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed max-h-[600px] overflow-y-auto">
            {markdownCode}
          </pre>
        </div>
      )}
    </div>
  )
}

export default TravelDossier
