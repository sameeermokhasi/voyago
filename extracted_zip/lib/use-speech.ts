'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Lightweight wrapper around the browser SpeechSynthesis API.
// Degrades gracefully when TTS is unavailable (e.g. SSR / unsupported browsers).
export function useSpeech() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setSupported(true)

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return
      // Prefer a natural English voice; fall back to the first English one.
      voiceRef.current =
        voices.find((v) => /en-(US|GB|IN)/i.test(v.lang) && /natural|google|samantha|daniel|aria/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang)) ||
        voices[0]
    }
    pickVoice()
    window.speechSynthesis.onvoiceschanged = pickVoice
    return () => {
      window.speechSynthesis.onvoiceschanged = null
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      if (voiceRef.current) u.voice = voiceRef.current
      u.rate = 1.02
      u.pitch = 1
      u.volume = 1
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    },
    [],
  )

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { supported, speaking, speak, cancel }
}
