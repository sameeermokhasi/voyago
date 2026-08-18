'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentState } from '@/lib/travel-data'

const YELLOW = '#ffe600'
const BODY = '#16171b'
const BODY_LIGHT = '#26282e'
const lerp = THREE.MathUtils.lerp

// Target poses per state (radians / intensities).
const POSES: Record<
  AgentState,
  {
    headX: number
    headZ: number
    rArmX: number
    rArmZ: number
    rElbow: number
    lArmX: number
    lArmZ: number
    eye: number
    bob: number
  }
> = {
  idle: { headX: 0, headZ: 0, rArmX: 0.12, rArmZ: -0.14, rElbow: 0.25, lArmX: 0.1, lArmZ: 0.14, eye: 1.4, bob: 1 },
  thinking: { headX: 0.06, headZ: 0.2, rArmX: -1.9, rArmZ: 0.55, rElbow: 1.35, lArmX: 0.1, lArmZ: 0.14, eye: 3, bob: 0.6 },
  success: { headX: -0.05, headZ: 0, rArmX: -2.5, rArmZ: -0.7, rElbow: 0.15, lArmX: 0.16, lArmZ: 0.18, eye: 2.2, bob: 1.6 },
}

export function VoyoAgent3D({ state }: { state: AgentState }) {
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const rArm = useRef<THREE.Group>(null)
  const rElbow = useRef<THREE.Group>(null)
  const lArm = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Mesh>(null)
  const rightEye = useRef<THREE.Mesh>(null)
  const chest = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const antenna = useRef<THREE.Mesh>(null)

  const blink = useRef(0)
  const nextBlink = useRef(2)

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime
    const p = POSES[state]
    const k = 1 - Math.pow(0.001, delta) // frame-rate independent smoothing

    // Floating + breathing
    if (root.current) {
      root.current.position.y = lerp(root.current.position.y, Math.sin(t * 1.1) * 0.05 * p.bob, k)
      root.current.rotation.y = lerp(root.current.rotation.y, Math.sin(t * 0.4) * 0.08, k * 0.5)
    }
    if (torso.current) {
      const breathe = 1 + Math.sin(t * 1.6) * 0.012 * p.bob
      torso.current.scale.y = lerp(torso.current.scale.y, breathe, k)
    }

    // Head
    if (head.current) {
      head.current.rotation.x = lerp(head.current.rotation.x, p.headX + Math.sin(t * 0.7) * 0.02, k)
      head.current.rotation.z = lerp(head.current.rotation.z, p.headZ, k)
      head.current.rotation.y = lerp(head.current.rotation.y, Math.sin(t * 0.5) * 0.06, k * 0.6)
    }

    // Arms
    if (rArm.current) {
      rArm.current.rotation.x = lerp(rArm.current.rotation.x, p.rArmX, k)
      rArm.current.rotation.z = lerp(rArm.current.rotation.z, p.rArmZ, k)
    }
    if (rElbow.current) {
      rElbow.current.rotation.x = lerp(rElbow.current.rotation.x, p.rElbow, k)
    }
    if (lArm.current) {
      lArm.current.rotation.x = lerp(lArm.current.rotation.x, p.lArmX + Math.sin(t * 1.2) * 0.03, k)
      lArm.current.rotation.z = lerp(lArm.current.rotation.z, p.lArmZ, k)
    }

    // Blink logic
    blink.current += delta
    let blinkScale = 1
    if (blink.current > nextBlink.current) {
      const phase = (blink.current - nextBlink.current) / 0.12
      if (phase < 1) blinkScale = Math.abs(Math.cos(phase * Math.PI))
      else {
        blink.current = 0
        nextBlink.current = 2 + Math.random() * 3
      }
    }

    // Eyes + emissive pulse
    const pulse = state === 'thinking' ? 1 + Math.sin(t * 6) * 0.35 : 1
    for (const eye of [leftEye.current, rightEye.current]) {
      if (!eye) continue
      const mat = eye.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = lerp(mat.emissiveIntensity, p.eye * pulse, k)
      eye.scale.y = lerp(eye.scale.y, blinkScale, 0.6)
    }
    if (chest.current) {
      const mat = chest.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = lerp(mat.emissiveIntensity, (state === 'idle' ? 1.2 : 2.4) * pulse, k)
    }
    if (ring.current) ring.current.rotation.z = t * (state === 'thinking' ? 1.4 : 0.4)
    if (antenna.current) {
      const mat = antenna.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(t * 4) * 0.8
    }
  })

  return (
    <group ref={root} position={[0, 0, 0]} scale={1}>
      {/* Platform */}
      <mesh position={[0, -0.02, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.06, 48]} />
        <meshStandardMaterial color={BODY_LIGHT} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh ref={ring} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.02, 12, 64]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      <group position={[0, 0.35, 0]}>
        {/* Legs / base */}
        <mesh position={[-0.22, 0.28, 0]}>
          <capsuleGeometry args={[0.16, 0.5, 6, 16]} />
          <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0.22, 0.28, 0]}>
          <capsuleGeometry args={[0.16, 0.5, 6, 16]} />
          <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.45} />
        </mesh>

        {/* Torso */}
        <group ref={torso} position={[0, 0.95, 0]}>
          <RoundedBox args={[0.9, 1.05, 0.55]} radius={0.22} smoothness={4}>
            <meshStandardMaterial color={BODY} metalness={0.45} roughness={0.4} />
          </RoundedBox>
          {/* Chest core */}
          <mesh ref={chest} position={[0, 0.12, 0.3]}>
            <circleGeometry args={[0.13, 32]} />
            <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.12, 0.29]}>
            <torusGeometry args={[0.18, 0.015, 8, 40]} />
            <meshStandardMaterial color={BODY_LIGHT} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Shoulders */}
          <mesh position={[-0.52, 0.32, 0]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.52, 0.32, 0]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Left arm (robot's left = screen right) */}
          <group ref={lArm} position={[-0.52, 0.3, 0]}>
            <mesh position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.1, 0.42, 6, 14]} />
              <meshStandardMaterial color={BODY} metalness={0.45} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.68, 0]}>
              <capsuleGeometry args={[0.09, 0.34, 6, 14]} />
              <meshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.92, 0]}>
              <sphereGeometry args={[0.11, 18, 18]} />
              <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.4} />
            </mesh>
          </group>

          {/* Right arm with elbow (used for thinking / raise) */}
          <group ref={rArm} position={[0.52, 0.3, 0]}>
            <mesh position={[0, -0.28, 0]}>
              <capsuleGeometry args={[0.1, 0.4, 6, 14]} />
              <meshStandardMaterial color={BODY} metalness={0.45} roughness={0.4} />
            </mesh>
            <group ref={rElbow} position={[0, -0.5, 0]}>
              <mesh position={[0, -0.2, 0]}>
                <capsuleGeometry args={[0.09, 0.34, 6, 14]} />
                <meshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.44, 0]}>
                <sphereGeometry args={[0.11, 18, 18]} />
                <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.4} />
              </mesh>
            </group>
          </group>

          {/* Neck */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.14, 16]} />
            <meshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Head */}
          <group ref={head} position={[0, 0.9, 0]}>
            <RoundedBox args={[0.72, 0.62, 0.62]} radius={0.24} smoothness={5}>
              <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.35} />
            </RoundedBox>
            {/* Visor */}
            <mesh position={[0, 0.02, 0.31]}>
              <RoundedBox args={[0.58, 0.34, 0.06]} radius={0.14} smoothness={4}>
                <meshStandardMaterial color="#0a0b0d" metalness={0.7} roughness={0.2} />
              </RoundedBox>
            </mesh>
            {/* Eyes */}
            <mesh ref={leftEye} position={[-0.14, 0.03, 0.35]}>
              <capsuleGeometry args={[0.045, 0.05, 4, 12]} />
              <meshStandardMaterial color="#fffbe0" emissive={YELLOW} emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            <mesh ref={rightEye} position={[0.14, 0.03, 0.35]}>
              <capsuleGeometry args={[0.045, 0.05, 4, 12]} />
              <meshStandardMaterial color="#fffbe0" emissive={YELLOW} emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            {/* Ear pods */}
            <mesh position={[-0.37, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
              <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
            <mesh position={[0.37, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
              <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
            {/* Antenna */}
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color={BODY_LIGHT} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh ref={antenna} position={[0, 0.54, 0]}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
