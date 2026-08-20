import React, { useEffect, useRef, useState } from 'react'
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Zap,
  MapPin,
  CloudSun,
  DollarSign,
  Utensils,
  Calendar,
  Compass,
  CheckCircle2,
  Car,
  ChevronRight,
  Eye,
  Play
} from 'lucide-react'
import { gsap } from 'gsap'

// Safe cross-browser rounded rectangle helper
const drawRoundRect = (ctx, x, y, w, h, r = 6) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.rect(x, y, w, h)
  }
}

export default function CinematicAgentSequence({
  city = 'Goa',
  days = '3',
  budget = '5000',
  data = null,
  isExecuting = false,
  onComplete,
  onSkip
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [stage, setStage] = useState('idle') // 'idle' | 'driving' | 'exiting' | 'thinking' | 'presenting' | 'completed'
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const animationFrameId = useRef(null)
  const synthUtteranceRef = useRef(null)
  const sequenceStartTime = useRef(null)

  // Stage timer tracker
  const sceneState = useRef({
    time: 0,
    carX: 180,
    carSpeed: 14,
    doorAngle: 0,
    agentX: 410,
    agentY: 280,
    agentAlpha: 1,
    agentWalkFrame: 0,
    agentPose: 'standing', // 'in_car' | 'stepping' | 'walking' | 'thinking' | 'presenting' | 'standing'
    holoAlpha: 0.7,
    holoRotation: 0,
    cameraZoom: 1,
    wheelAngle: 0,
    headlightIntensity: 1,
    particles: []
  })

  // Pre-seed ambient dust / neon light particles
  useEffect(() => {
    const pts = []
    for (let i = 0; i < 45; i++) {
      pts.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        size: Math.random() * 2.5 + 1,
        speedY: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.5 ? '#F59E0B' : '#FFFFFF'
      })
    }
    sceneState.current.particles = pts
  }, [])

  // Start sequence when isExecuting becomes true or manually triggered
  useEffect(() => {
    if (isExecuting) {
      startFullArrivalSequence()
    }
  }, [isExecuting, city, days, budget])

  const startFullArrivalSequence = () => {
    sequenceStartTime.current = performance.now()
    setStage('driving')
    setProgress(0)
    sceneState.current.carX = -450
    sceneState.current.doorAngle = 0
    sceneState.current.agentAlpha = 0
    sceneState.current.agentPose = 'in_car'
    sceneState.current.holoAlpha = 0
  }

  // Text-To-Speech Synthesis Engine
  const speakBriefing = () => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const destinationName = city || 'your destination'
    const daysCount = days || '3'
    const budgetVal = budget ? `₹${Number(budget).toLocaleString()}` : 'your planned budget'

    // Highlight iconic local spots if available
    let landmarkHighlight = ''
    const cLower = city.toLowerCase()
    if (cLower.includes('chik')) {
      landmarkHighlight = 'We will explore Karnataka’s highest summit at Mullayanagiri Peak, trek through Netravati valley, and enjoy famous Benne Dosa at Town Canteen.'
    } else if (cLower.includes('coorg')) {
      landmarkHighlight = 'We will experience the Mandalpatti 4x4 Jeep trail, Abbey Falls, and authentic Kodava dining.'
    } else if (cLower.includes('ladakh') || cLower.includes('leh')) {
      landmarkHighlight = 'We will traverse Khardung La Pass, Pangong Tso Lake, and peaceful Tibetan monasteries.'
    } else if (cLower.includes('goa')) {
      landmarkHighlight = 'We will visit coastal fish thali spots, Anjuna night markets, and sunset beach drum circles.'
    } else {
      landmarkHighlight = `We will explore the finest authentic culinary spots, live weather forecasts, and scheduled Voyago cab pickups.`
    }

    const textToSpeak = `Greetings! I am VOYO, your personal AI travel concierge. I have engineered your ${daysCount}-day itinerary for ${destinationName} with an all-inclusive budget of ${budgetVal}. ${landmarkHighlight} Your verified travel dossier is synthesized and ready.`

    setTranscript(textToSpeak)

    if (isMuted) return

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = 1.02
    utterance.pitch = 1.05

    // Select natural sounding voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))) ||
        v.lang === 'en-IN' ||
        v.lang === 'en-US'
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsMuted(true)
    } else {
      setIsMuted(false)
      speakBriefing()
    }
  }

  const replaySpeech = () => {
    setIsMuted(false)
    speakBriefing()
  }

  // 3D Canvas & Cinematic Sequence Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let isRunning = true

    const render = (now) => {
      if (!isRunning) return

      const state = sceneState.current

      if (sequenceStartTime.current) {
        // Active Arrival Sequence Timeline
        const elapsed = (now - sequenceStartTime.current) / 1000
        state.time = elapsed

        if (elapsed < 2.4) {
          // Stage 1: Cab Driving In & Decelerating
          if (stage !== 'driving') setStage('driving')
          setProgress(Math.min(30, (elapsed / 2.4) * 30))
          const t = elapsed / 2.4
          state.carX = -450 + (1 - Math.pow(1 - t, 3)) * 630
          state.wheelAngle += (1 - t * 0.7) * 0.4
          state.cameraZoom = 1 + Math.sin(t * Math.PI) * 0.05
        } else if (elapsed < 4.2) {
          // Stage 2: Door Opens & Agent Steps Out
          if (stage !== 'exiting') setStage('exiting')
          setProgress(Math.min(55, 30 + ((elapsed - 2.4) / 1.8) * 25))
          const t = (elapsed - 2.4) / 1.8
          state.doorAngle = Math.min(1, t * 1.4)
          state.agentAlpha = Math.min(1, t * 1.5)
          state.agentPose = t < 0.4 ? 'stepping' : 'walking'
          state.agentX = state.carX + 40 + t * 90
          state.agentWalkFrame = t * 12
        } else if (elapsed < 6.8) {
          // Stage 3: Agent Thinks & Hologram Materializes
          if (stage !== 'thinking') setStage('thinking')
          setProgress(Math.min(85, 55 + ((elapsed - 4.2) / 2.6) * 30))
          const t = (elapsed - 4.2) / 2.6
          state.agentPose = 'thinking'
          state.holoAlpha = Math.min(1, t * 2)
          state.holoRotation += 0.025
        } else {
          // Stage 4: Agent Confidently Presents the Dossier
          if (stage !== 'presenting' && stage !== 'completed') {
            setStage('presenting')
            setProgress(100)
            state.agentPose = 'presenting'
            speakBriefing()
            if (onComplete) onComplete()
          }
          state.holoRotation += 0.015
        }
      } else {
        // Idle Standby Mode (Ambient Lounge with Cab & Ready Agent)
        state.time += 0.016
        state.carX = 160
        state.doorAngle = 0.9
        state.agentX = 380
        state.agentY = 280
        state.agentAlpha = 1.0
        state.agentPose = 'standing'
        state.holoAlpha = 0.8
        state.holoRotation += 0.015
      }

      // ==========================================
      // CANVAS DRAWING (Futuristic 3D Isometric View)
      // ==========================================
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // 1. Cyber Horizon Background & Ambient Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, '#050507')
      skyGrad.addColorStop(0.5, '#0b0b10')
      skyGrad.addColorStop(1, '#18181b')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Distant Cyber Skyscraper Silhouettes
      ctx.fillStyle = 'rgba(24, 24, 27, 0.7)'
      for (let i = 0; i < 14; i++) {
        const bh = 50 + ((i * 37) % 90)
        const bw = 45 + ((i * 19) % 35)
        const bx = i * 65 - 20
        ctx.fillRect(bx, 180 - bh, bw, bh + 40)
        // Yellow cyber window lights
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'
          ctx.fillRect(bx + 10, 180 - bh + 15, 6, 8)
          ctx.fillRect(bx + 24, 180 - bh + 30, 6, 8)
          ctx.fillStyle = 'rgba(24, 24, 27, 0.7)'
        }
      }

      // 2. Reflective Wet Asphalt Road & Grid Lines
      const roadY = 220
      const roadGrad = ctx.createLinearGradient(0, roadY, 0, h)
      roadGrad.addColorStop(0, '#09090b')
      roadGrad.addColorStop(0.3, '#121215')
      roadGrad.addColorStop(1, '#09090b')
      ctx.fillStyle = roadGrad
      ctx.fillRect(0, roadY, w, h - roadY)

      // Perspective Grid Lines on Road
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)'
      ctx.lineWidth = 1
      for (let x = -200; x < w + 200; x += 70) {
        ctx.beginPath()
        ctx.moveTo(x, roadY)
        ctx.lineTo(x * 1.3 - 100, h)
        ctx.stroke()
      }

      // Glowing Neon Yellow Road Divider
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'
      ctx.lineWidth = 3
      ctx.setLineDash([25, 25])
      ctx.lineDashOffset = -state.time * 60
      ctx.beginPath()
      ctx.moveTo(0, roadY + 80)
      ctx.lineTo(w, roadY + 80)
      ctx.stroke()
      ctx.setLineDash([]) // Reset

      // 3. Volumetric Headlight Beams & Asphalt Ground Reflections
      const carBaseX = state.carX
      const carBaseY = roadY + 30

      if (carBaseX > -300 && carBaseX < w + 200) {
        // Headlight Volumetric Cone
        const coneGrad = ctx.createRadialGradient(
          carBaseX + 240,
          carBaseY + 25,
          10,
          carBaseX + 460,
          carBaseY + 45,
          260
        )
        coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
        coneGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.35)')
        coneGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')

        ctx.fillStyle = coneGrad
        ctx.beginPath()
        ctx.moveTo(carBaseX + 230, carBaseY + 22)
        ctx.lineTo(carBaseX + 540, carBaseY - 10)
        ctx.lineTo(carBaseX + 560, carBaseY + 70)
        ctx.closePath()
        ctx.fill()

        // Wet Asphalt Amber Reflection under car
        const glowGrad = ctx.createRadialGradient(
          carBaseX + 110,
          carBaseY + 45,
          10,
          carBaseX + 110,
          carBaseY + 45,
          160
        )
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)')
        glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.ellipse(carBaseX + 110, carBaseY + 48, 140, 18, 0, 0, Math.PI * 2)
        ctx.fill()

        // ==========================================
        // 4. PROCEDURAL 3D FUTURISTIC VOYAGO CYBER-CAB
        // ==========================================
        ctx.save()
        ctx.translate(carBaseX, carBaseY)

        // Shadow under chassis
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.beginPath()
        drawRoundRect(ctx, 10, 40, 220, 14, 8)
        ctx.fill()

        // Main Car Body (Aerodynamic Cyber Silhouette)
        ctx.fillStyle = '#121215'
        ctx.strokeStyle = '#27272a'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(15, 38)
        ctx.lineTo(40, 38)
        ctx.lineTo(75, 12) // Windshield slope
        ctx.lineTo(165, 12) // Roofline
        ctx.lineTo(210, 26) // Rear fastback
        ctx.lineTo(235, 38) // Front bumper
        ctx.lineTo(225, 45)
        ctx.lineTo(15, 45)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Cyber Yellow Accent Stripe & Brand Badge
        ctx.fillStyle = '#F59E0B'
        ctx.fillRect(45, 34, 180, 3.5)

        // Tinted Glass Canopy
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(78, 14)
        ctx.lineTo(115, 14)
        ctx.lineTo(115, 32)
        ctx.lineTo(55, 32)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Rear window
        ctx.beginPath()
        ctx.moveTo(122, 14)
        ctx.lineTo(160, 14)
        ctx.lineTo(195, 28)
        ctx.lineTo(122, 28)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Gull-Wing Door (Opens upward when stopped)
        if (state.doorAngle > 0) {
          ctx.save()
          ctx.translate(85, 12)
          ctx.rotate(-state.doorAngle * 0.75) // Swings up
          ctx.fillStyle = '#18181b'
          ctx.strokeStyle = '#F59E0B'
          ctx.lineWidth = 2
          ctx.fillRect(0, -2, 60, 22)
          // Door interior amber light
          ctx.fillStyle = 'rgba(245, 158, 11, 0.8)'
          ctx.fillRect(5, 2, 50, 3)
          ctx.restore()
        }

        // VOYAGO Logo on Cab Door
        ctx.fillStyle = '#F59E0B'
        ctx.font = 'bold 9px monospace'
        ctx.fillText('VOYAGO CAB', 125, 41)

        // Twin Xenon LED Headlights
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = '#F59E0B'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(230, 30, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0 // Reset

        // Neon Red Cyber Taillight Bar
        ctx.fillStyle = '#EF4444'
        ctx.shadowColor = '#EF4444'
        ctx.shadowBlur = 10
        ctx.fillRect(12, 30, 6, 6)
        ctx.shadowBlur = 0

        // Rotating Cyber Wheels with Yellow Calipers
        const drawWheel = (wx, wy) => {
          ctx.save()
          ctx.translate(wx, wy)
          ctx.rotate(state.wheelAngle)
          // Tire
          ctx.fillStyle = '#09090b'
          ctx.strokeStyle = '#3f3f46'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(0, 0, 15, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          // Neon Yellow Rim Spokes
          ctx.strokeStyle = '#F59E0B'
          ctx.lineWidth = 2
          for (let sp = 0; sp < 4; sp++) {
            ctx.rotate(Math.PI / 2)
            ctx.beginPath()
            ctx.moveTo(0, -12)
            ctx.lineTo(0, 12)
            ctx.stroke()
          }
          // Center Hubcap
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(0, 0, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        drawWheel(55, 46)
        drawWheel(185, 46)

        ctx.restore()
      }

      // ==========================================
      // 5. 3D HUMAN AI TRAVEL CONCIERGE (VOYO)
      // ==========================================
      if (state.agentAlpha > 0) {
        ctx.save()
        ctx.globalAlpha = state.agentAlpha
        ctx.translate(state.agentX, state.agentY)

        // Agent Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.beginPath()
        ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Leg Swing for Walk Cycle
        const walkCycle = Math.sin(state.agentWalkFrame * 2) * 8

        // Legs (Tailored Black Suit Pants)
        ctx.strokeStyle = '#18181b'
        ctx.lineWidth = 7
        ctx.lineCap = 'round'

        if (state.agentPose === 'walking' || state.agentPose === 'stepping') {
          // Left Leg
          ctx.beginPath()
          ctx.moveTo(-4, -40)
          ctx.lineTo(-4 - walkCycle * 0.6, -18)
          ctx.lineTo(-6 - walkCycle, 0)
          ctx.stroke()
          // Right Leg
          ctx.beginPath()
          ctx.moveTo(4, -40)
          ctx.lineTo(4 + walkCycle * 0.6, -18)
          ctx.lineTo(6 + walkCycle, 0)
          ctx.stroke()
        } else {
          // Standing Legs
          ctx.beginPath()
          ctx.moveTo(-5, -40)
          ctx.lineTo(-6, 0)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(5, -40)
          ctx.lineTo(6, 0)
          ctx.stroke()
        }

        // Shoes (Polished Obsidian Dress Shoes)
        ctx.fillStyle = '#000000'
        ctx.fillRect(-10, -3, 8, 4)
        ctx.fillRect(2, -3, 8, 4)

        // Torso / Suit Jacket (Modern Slim-Fit Black Tuxedo)
        ctx.fillStyle = '#18181b'
        ctx.strokeStyle = '#27272a'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-14, -82)
        ctx.lineTo(14, -82)
        ctx.lineTo(11, -40)
        ctx.lineTo(-11, -40)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Crisp White Shirt & Yellow Silk Tie
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(-4, -82)
        ctx.lineTo(4, -82)
        ctx.lineTo(2, -62)
        ctx.lineTo(-2, -62)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#F59E0B'
        ctx.beginPath()
        ctx.moveTo(-2, -80)
        ctx.lineTo(2, -80)
        ctx.lineTo(1, -56)
        ctx.lineTo(-1, -56)
        ctx.closePath()
        ctx.fill()

        // Electric Yellow Pocket Square
        ctx.fillStyle = '#F59E0B'
        ctx.fillRect(4, -72, 5, 2)

        // Head & Hair
        ctx.fillStyle = '#d4a373' // Natural Skin Tone
        ctx.beginPath()
        ctx.arc(0, -93, 9, 0, Math.PI * 2)
        ctx.fill()

        // Styled Black Hair
        ctx.fillStyle = '#18181b'
        ctx.beginPath()
        ctx.arc(0, -96, 9.5, Math.PI * 0.9, Math.PI * 2.1)
        ctx.fill()

        // Cyber Smart Glasses / Earpiece HUD
        ctx.fillStyle = '#F59E0B'
        ctx.shadowColor = '#F59E0B'
        ctx.shadowBlur = 6
        ctx.fillRect(2, -95, 6, 2.5)
        ctx.shadowBlur = 0

        // Arms & Gestures
        ctx.strokeStyle = '#18181b'
        ctx.lineWidth = 5
        ctx.lineCap = 'round'

        if (state.agentPose === 'thinking') {
          // Left hand on chin / temple thinking
          ctx.beginPath()
          ctx.moveTo(-13, -78)
          ctx.lineTo(-20, -60)
          ctx.lineTo(-6, -92)
          ctx.stroke()
          // Right arm relaxed
          ctx.beginPath()
          ctx.moveTo(13, -78)
          ctx.lineTo(16, -55)
          ctx.lineTo(12, -42)
          ctx.stroke()
        } else if (state.agentPose === 'presenting' || state.agentPose === 'standing') {
          // Open Confident Welcoming Presentation Gesture
          ctx.beginPath()
          ctx.moveTo(-13, -78)
          ctx.lineTo(-28, -62)
          ctx.lineTo(-34, -74) // Hand open outward
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(13, -78)
          ctx.lineTo(28, -62)
          ctx.lineTo(34, -74)
          ctx.stroke()

          // Hands
          ctx.fillStyle = '#d4a373'
          ctx.beginPath()
          ctx.arc(-35, -75, 3.5, 0, Math.PI * 2)
          ctx.arc(35, -75, 3.5, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Walking arms swing
          ctx.beginPath()
          ctx.moveTo(-13, -78)
          ctx.lineTo(-13 + walkCycle, -52)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(13, -78)
          ctx.lineTo(13 - walkCycle, -52)
          ctx.stroke()
        }

        // ==========================================
        // 6. 3D HOLOGRAPHIC DATA HUD & ORBITS
        // ==========================================
        if (state.holoAlpha > 0) {
          ctx.save()
          ctx.globalAlpha = state.holoAlpha

          // Center Hologram Pulse Ring
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(0, -65, 45, 0, Math.PI * 2)
          ctx.stroke()

          // Orbiting 3D Data Particles
          const rot = state.holoRotation
          const drawHoloNode = (angleOffset, label, iconText, yOff) => {
            const hx = Math.cos(rot + angleOffset) * 65
            const hy = Math.sin(rot + angleOffset) * 22 - 65 + yOff
            const scale = (Math.sin(rot + angleOffset) + 2) / 3 // Depth scale

            ctx.save()
            ctx.translate(hx, hy)
            ctx.scale(scale, scale)

            // Holographic node badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
            ctx.strokeStyle = '#F59E0B'
            ctx.lineWidth = 1.2
            ctx.beginPath()
            drawRoundRect(ctx, -42, -11, 84, 22, 6)
            ctx.fill()
            ctx.stroke()

            // Text
            ctx.fillStyle = '#F59E0B'
            ctx.font = 'bold 9px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(`${iconText} ${label}`, 0, 3)

            ctx.restore()
          }

          drawHoloNode(0, city.toUpperCase(), '📍', -10)
          drawHoloNode(Math.PI * 0.5, `${days} Days Trip`, '📅', 0)
          drawHoloNode(Math.PI, `₹${budget}`, '💰', 10)
          drawHoloNode(Math.PI * 1.5, 'Curated Eats', '🍽️', 0)

          ctx.restore()
        }

        ctx.restore()
      }

      // 7. Ambient Floating Dust / Cyber Particles
      state.particles.forEach((p) => {
        p.y -= p.speedY
        if (p.y < 0) p.y = h
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1.0

      animationFrameId.current = requestAnimationFrame(render)
    }

    animationFrameId.current = requestAnimationFrame(render)

    return () => {
      isRunning = false
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [city, days, budget])

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#09090b] rounded-3xl border border-amber-400/40 shadow-2xl overflow-hidden mb-8 relative text-white animate-in fade-in zoom-in-95 duration-500"
    >
      {/* Top Header with Director Status & Controls */}
      <div className="p-4 md:p-5 bg-[#121215]/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
            <Zap className="w-4 h-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm md:text-base font-black text-white tracking-tight">
                VOYO 3D AI Concierge Sequence
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                {stage === 'idle' && '🟢 Standby Lounge Ready'}
                {stage === 'driving' && 'Cab Arriving...'}
                {stage === 'exiting' && 'Agent Stepping Out'}
                {stage === 'thinking' && 'Synthesizing Holographic Data'}
                {stage === 'presenting' && 'Presenting Travel Plan'}
                {stage === 'completed' && 'Dossier Live'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Autonomous cinematic concierge arrival for {city.toUpperCase()} ({days} Days)
            </p>
          </div>
        </div>

        {/* Audio & Control Toolbar */}
        <div className="flex items-center space-x-2">
          {/* Launch / Replay Arrival Sequence Button */}
          <button
            type="button"
            onClick={startFullArrivalSequence}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center shadow-md shadow-amber-400/20 transition-all transform hover:scale-105 active:scale-95"
            title="Launch 3D Arrival Sequence"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-black" />
            {stage === 'idle' ? 'Play 3D Arrival' : 'Replay Arrival'}
          </button>

          {/* TTS Audio Waveform & Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all border ${
              isMuted
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : isSpeaking
                ? 'bg-amber-400 text-black border-amber-400 animate-pulse'
                : 'bg-zinc-800 text-amber-400 border-zinc-700'
            }`}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 mr-1.5" />
                Voice Muted
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                {isSpeaking ? 'Voice Briefing Active' : 'AI Voice Ready'}
              </>
            )}
          </button>

          {/* Replay Voice button */}
          <button
            type="button"
            onClick={replaySpeech}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            title="Replay Voice Briefing"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Skip Animation button */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center border border-zinc-700 transition-colors"
            >
              Skip to Dossier
              <ChevronRight className="w-3.5 h-3.5 ml-1 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Canvas Viewport */}
      <div className="relative w-full h-[320px] md:h-[380px] bg-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          className="w-full h-full object-cover select-none"
        />

        {/* Live Subtitle / Voice Transcript Display */}
        {transcript && !isMuted && isSpeaking && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md rounded-xl p-3 border border-amber-400/30 text-xs md:text-sm text-amber-200 shadow-xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0"></span>
            <p className="line-clamp-2 leading-relaxed">
              <strong className="text-white">VOYO:</strong> "{transcript}"
            </p>
          </div>
        )}
      </div>

      {/* Cinematic Director Progress Timeline */}
      <div className="p-3.5 bg-[#121215] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-amber-400 font-bold">
            {stage === 'idle' ? '100' : progress.toFixed(0)}%
          </span>
          <span>{stage === 'idle' ? 'Concierge Online' : 'Sequence Progress'}</span>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-[11px] font-medium">
          <span className={stage === 'driving' ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
            1. Cab Arrival
          </span>
          <span className="text-zinc-700">→</span>
          <span className={stage === 'exiting' ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
            2. Agent Step-Out
          </span>
          <span className="text-zinc-700">→</span>
          <span className={stage === 'thinking' ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
            3. Holographic HUD
          </span>
          <span className="text-zinc-700">→</span>
          <span className={stage === 'presenting' || stage === 'idle' ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
            4. Dossier Presented
          </span>
        </div>

        <div className="w-28 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${stage === 'idle' ? 100 : progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
