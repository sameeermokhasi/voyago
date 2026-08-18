'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { phaseAtLeast, type Phase } from '@/lib/travel-data'

const YELLOW = '#ffe600'
const LABELS = ['WEATHER', 'FOOD', 'EVENTS', 'STAYS', 'BUDGET']
const lerp = THREE.MathUtils.lerp

export function HolographicMap({
  phase,
  destination,
  origin,
}: {
  phase: Phase
  destination: string
  origin: string
}) {
  const wrap = useRef<THREE.Group>(null)
  const globe = useRef<THREE.Group>(null)
  const dot = useRef<THREE.Mesh>(null)
  const bob = useRef<THREE.Group>(null)

  // A gentle arc "route" that visually re-seeds when the destination changes.
  const curve = useMemo(() => {
    let h = 0
    for (let i = 0; i < destination.length; i++) h = (h * 31 + destination.charCodeAt(i)) >>> 0
    const a = new THREE.Vector3(-0.62, -0.1 + ((h % 20) - 10) / 60, 0.55)
    const b = new THREE.Vector3(0.62, 0.15 + (((h >> 3) % 20) - 10) / 60, -0.4)
    const mid = new THREE.Vector3(0, 0.85, 0.1)
    return new THREE.QuadraticBezierCurve3(a, mid, b)
  }, [destination])

  const points = useMemo(() => curve.getPoints(60), [curve])
  const active = phase === 'thinking'
  const visible = phaseAtLeast(phase, 'thinking')

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime
    // Reveal / hide as a whole with a scale + spin-up.
    if (wrap.current) {
      const target = visible ? 0.5 : 0.0001
      const sc = lerp(wrap.current.scale.x, target, 1 - Math.pow(0.01, delta))
      wrap.current.scale.setScalar(sc)
      wrap.current.visible = sc > 0.01
    }
    if (globe.current) globe.current.rotation.y += delta * (active ? 0.9 : 0.35)
    if (dot.current) {
      const speed = active ? 0.35 : 0.14
      dot.current.position.copy(curve.getPoint((t * speed) % 1))
    }
    if (bob.current) bob.current.position.y = Math.sin(t * 1.4) * 0.03
  })

  const labelPos: [number, number, number][] = LABELS.map((_, i) => {
    const a = (i / LABELS.length) * Math.PI * 2 + Math.PI / 2
    return [Math.cos(a) * 0.72, 0.1 + Math.sin(a) * 0.62, Math.sin(a) * 0.3]
  })

  return (
    <group ref={wrap} position={[-1.35, 1.7, 0.9]} scale={0.0001}>
      <group ref={bob}>
        {/* Wireframe globe */}
        <group ref={globe}>
          <mesh>
            <icosahedronGeometry args={[0.68, 2]} />
            <meshBasicMaterial color={YELLOW} wireframe transparent opacity={0.28} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.6, 24, 24]} />
            <meshBasicMaterial color={'#0c0d10'} transparent opacity={0.55} />
          </mesh>
          {/* latitude rings */}
          {[0.2, 0.45, 0.68].map((r, i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, (i - 1) * 0.28, 0]}>
              <torusGeometry args={[Math.sqrt(Math.max(0.68 * 0.68 - ((i - 1) * 0.28) ** 2, 0.01)), 0.004, 8, 48]} />
              <meshBasicMaterial color={YELLOW} transparent opacity={0.4} toneMapped={false} />
            </mesh>
          ))}
        </group>

        {/* Route arc */}
        <Line points={points} color={YELLOW} lineWidth={2} transparent opacity={0.9} />
        <mesh ref={dot}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={YELLOW} toneMapped={false} />
        </mesh>

        {/* Origin / destination pins */}
        <mesh position={points[0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={points[points.length - 1]}>
          <sphereGeometry args={[0.045, 14, 14]} />
          <meshBasicMaterial color={YELLOW} toneMapped={false} />
        </mesh>

        {/* Origin → destination label */}
        <Html position={[0, 1.15, 0]} center distanceFactor={6} zIndexRange={[10, 0]}>
          <div className="whitespace-nowrap rounded-full border border-primary/40 bg-black/70 px-3 py-1 font-mono text-[11px] tracking-wider text-primary backdrop-blur">
            {origin} → {destination || '—'}
          </div>
        </Html>

        {/* Floating context labels */}
        {LABELS.map((label, i) => (
          <Html key={label} position={labelPos[i]} center distanceFactor={7} zIndexRange={[9, 0]}>
            <div className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
              {label}
            </div>
          </Html>
        ))}
      </group>
    </group>
  )
}
