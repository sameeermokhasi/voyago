'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { phaseAtLeast, type Phase } from '@/lib/travel-data'

const YELLOW = '#ffe600'
const DARK = '#0c0d10'
const GLASS = '#10151f'
const lerp = THREE.MathUtils.lerp

// Parked resting X; cab starts far off-screen right when idle.
const PARKED_X = 2.35
const OFFSCREEN_X = 10

function Wheel({ x, z, spin }: { x: number; z: number; spin: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -spin.current
  })
  return (
    <group ref={ref} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
        <meshStandardMaterial color="#050506" metalness={0.4} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 20]} />
        <meshStandardMaterial color="#2a2c31" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.02, 0.28]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function VoyagoCab({ phase }: { phase: Phase }) {
  const root = useRef<THREE.Group>(null)
  const doorPivot = useRef<THREE.Group>(null)
  const headL = useRef<THREE.Mesh>(null)
  const headR = useRef<THREE.Mesh>(null)
  const beamL = useRef<THREE.SpotLight>(null)
  const beamR = useRef<THREE.SpotLight>(null)
  const spin = useRef(0)
  const prevX = useRef(OFFSCREEN_X)
  const beamTarget = useRef(new THREE.Object3D())

  useFrame((_, delta) => {
    if (!root.current) return
    const targetX = phase === 'idle' ? OFFSCREEN_X : PARKED_X
    // Faster approach while arriving, gentle settle afterwards.
    const k = 1 - Math.pow(phase === 'arriving' ? 0.02 : 0.005, delta)
    root.current.position.x = lerp(root.current.position.x, targetX, k)

    // Wheel spin proportional to travel distance.
    const dx = root.current.position.x - prevX.current
    spin.current += dx * 3.1
    prevX.current = root.current.position.x

    // Doors open once the agent starts exiting.
    const doorTarget = phaseAtLeast(phase, 'exiting') && phase !== 'idle' ? -Math.PI * 0.62 : 0
    if (doorPivot.current) {
      doorPivot.current.rotation.y = lerp(doorPivot.current.rotation.y, doorTarget, 1 - Math.pow(0.02, delta))
    }

    // Headlight intensity: bright while approaching, dim when parked.
    const moving = Math.abs(dx) > 0.002
    const hi = phase === 'idle' ? 0 : moving ? 3.4 : 1.1
    for (const m of [headL.current, headR.current]) {
      if (m) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = lerp(mat.emissiveIntensity, phase === 'idle' ? 0 : 2.4, 1 - Math.pow(0.05, delta))
      }
    }
    for (const b of [beamL.current, beamR.current]) {
      if (b) b.intensity = lerp(b.intensity, hi, 1 - Math.pow(0.05, delta))
    }
  })

  return (
    <group ref={root} position={[OFFSCREEN_X, 0, -0.6]}>
      {/* Car faces -x (front on the left). Length along x. */}
      {/* Lower body */}
      <RoundedBox args={[3.1, 0.55, 1.35]} radius={0.18} smoothness={4} position={[0, 0.55, 0]}>
        <meshStandardMaterial color={YELLOW} metalness={0.5} roughness={0.35} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[1.7, 0.55, 1.2]} radius={0.16} smoothness={4} position={[0.1, 1.0, 0]}>
        <meshStandardMaterial color={YELLOW} metalness={0.5} roughness={0.35} />
      </RoundedBox>
      {/* Windshield + windows (dark glass) */}
      <RoundedBox args={[1.55, 0.42, 1.08]} radius={0.12} smoothness={4} position={[0.1, 1.02, 0]}>
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.1} transparent opacity={0.85} />
      </RoundedBox>
      {/* Checker stripe (taxi identity) */}
      <mesh position={[0, 0.78, 0.681]}>
        <planeGeometry args={[3.1, 0.14]} />
        <meshStandardMaterial color={DARK} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.78, -0.681]}>
        <planeGeometry args={[3.1, 0.14]} />
        <meshStandardMaterial color={DARK} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Roof sign */}
      <mesh position={[0.1, 1.34, 0]}>
        <boxGeometry args={[0.6, 0.16, 0.4]} />
        <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.34, 0.201]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Headlights (front = -x) */}
      <mesh ref={headL} position={[-1.55, 0.55, 0.42]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.12, 20]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh ref={headR} position={[-1.55, 0.55, -0.42]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.12, 20]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {/* Tail lights (rear = +x) */}
      <mesh position={[1.55, 0.55, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial color="#ff2d2d" emissive="#ff2d2d" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[1.55, 0.55, -0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial color="#ff2d2d" emissive="#ff2d2d" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Headlight beams cast onto the ground ahead */}
      <primitive object={beamTarget.current} position={[-6, 0, 0]} />
      <spotLight
        ref={beamL}
        position={[-1.55, 0.55, 0.42]}
        target={beamTarget.current}
        angle={0.5}
        penumbra={0.9}
        intensity={0}
        distance={14}
        color="#fff4c2"
      />
      <spotLight
        ref={beamR}
        position={[-1.55, 0.55, -0.42]}
        target={beamTarget.current}
        angle={0.5}
        penumbra={0.9}
        intensity={0}
        distance={14}
        color="#fff4c2"
      />

      {/* Passenger door (camera-facing +z side), hinged at rear edge */}
      <group ref={doorPivot} position={[0.65, 0.55, 0.68]}>
        <RoundedBox args={[1.1, 0.5, 0.06]} radius={0.06} smoothness={3} position={[-0.55, 0, 0]}>
          <meshStandardMaterial color={YELLOW} metalness={0.5} roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[1.0, 0.34, 0.04]} radius={0.06} smoothness={3} position={[-0.55, 0.08, 0.02]}>
          <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.1} transparent opacity={0.85} />
        </RoundedBox>
      </group>

      {/* Wheels */}
      <Wheel x={-1.0} z={0.72} spin={spin} />
      <Wheel x={1.0} z={0.72} spin={spin} />
      <Wheel x={-1.0} z={-0.72} spin={spin} />
      <Wheel x={1.0} z={-0.72} spin={spin} />

      {/* Under-glow */}
      <pointLight position={[0, 0.15, 0]} color={YELLOW} intensity={0.6} distance={3} />
    </group>
  )
}
