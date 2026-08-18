'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { phaseAtLeast, type Phase } from '@/lib/travel-data'

const SKIN = '#c98a5e'
const SUIT = '#191b22'
const SUIT_HI = '#23262f'
const SHIRT = '#e9eaee'
const HAIR = '#141416'
const YELLOW = '#ffe600'
const lerp = THREE.MathUtils.lerp

// Where the agent stands in each phase (feet at y=0).
const DOOR_POS = new THREE.Vector3(1.95, 0, 0.95)
const FRONT_POS = new THREE.Vector3(0.05, 0, 1.65)

export function HumanAgent({ phase }: { phase: Phase }) {
  const root = useRef<THREE.Group>(null)
  const hip = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const lLeg = useRef<THREE.Group>(null)
  const rLeg = useRef<THREE.Group>(null)
  const lKnee = useRef<THREE.Group>(null)
  const rKnee = useRef<THREE.Group>(null)
  const lArm = useRef<THREE.Group>(null)
  const rArm = useRef<THREE.Group>(null)
  const rElbow = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)

  const walkClock = useRef(0)
  const prev = useRef(new THREE.Vector3(DOOR_POS.x, 0, DOOR_POS.z))

  useFrame((s, delta) => {
    if (!root.current) return
    const t = s.clock.elapsedTime
    const k = 1 - Math.pow(0.006, delta)

    // Target ground position per phase.
    const target = phaseAtLeast(phase, 'walking') ? FRONT_POS : DOOR_POS
    root.current.position.x = lerp(root.current.position.x, target.x, k)
    root.current.position.z = lerp(root.current.position.z, target.z, k)

    // Emerge from the cab: scale/opacity handled by parent visibility; add a small rise.
    const appear = phaseAtLeast(phase, 'exiting') ? 1 : 0
    root.current.position.y = lerp(root.current.position.y, appear ? 0 : -0.4, k)

    // Velocity → walking detection.
    const dx = root.current.position.x - prev.current.x
    const dz = root.current.position.z - prev.current.z
    const speed = Math.hypot(dx, dz) / Math.max(delta, 0.0001)
    prev.current.set(root.current.position.x, 0, root.current.position.z)
    const moving = speed > 0.15

    // Face travel direction while moving, otherwise face the camera (+z).
    const desiredYaw = moving ? Math.atan2(dx, dz) : phase === 'presenting' ? -0.28 : 0
    root.current.rotation.y = lerp(root.current.rotation.y, desiredYaw, 1 - Math.pow(0.02, delta))

    // Walk cycle.
    if (moving) walkClock.current += delta * 9
    const wc = walkClock.current
    const amp = moving ? 0.55 : 0
    const swing = Math.sin(wc) * amp

    if (lLeg.current) lLeg.current.rotation.x = lerp(lLeg.current.rotation.x, swing, 0.4)
    if (rLeg.current) rLeg.current.rotation.x = lerp(rLeg.current.rotation.x, -swing, 0.4)
    if (lKnee.current) lKnee.current.rotation.x = lerp(lKnee.current.rotation.x, Math.max(0, -swing) * 0.9, 0.4)
    if (rKnee.current) rKnee.current.rotation.x = lerp(rKnee.current.rotation.x, Math.max(0, swing) * 0.9, 0.4)

    // Torso bob while walking + gentle idle breathing.
    if (hip.current) {
      const bob = moving ? Math.abs(Math.sin(wc)) * 0.05 : Math.sin(t * 1.4) * 0.012
      hip.current.position.y = lerp(hip.current.position.y, 0.9 + bob, 0.4)
    }
    if (torso.current) {
      const lean = moving ? 0.08 : 0
      torso.current.rotation.x = lerp(torso.current.rotation.x, lean, 0.2)
    }

    // Arms: swing while walking; pose otherwise.
    if (moving) {
      if (lArm.current) lArm.current.rotation.x = lerp(lArm.current.rotation.x, -swing * 0.8, 0.4)
      if (rArm.current) {
        rArm.current.rotation.x = lerp(rArm.current.rotation.x, swing * 0.8, 0.4)
        rArm.current.rotation.z = lerp(rArm.current.rotation.z, 0, 0.3)
      }
      if (rElbow.current) rElbow.current.rotation.x = lerp(rElbow.current.rotation.x, 0.15, 0.3)
    } else if (phase === 'thinking') {
      // Hand-to-chin thinking pose.
      if (lArm.current) lArm.current.rotation.x = lerp(lArm.current.rotation.x, 0.15, 0.15)
      if (rArm.current) {
        rArm.current.rotation.x = lerp(rArm.current.rotation.x, -0.55, 0.15)
        rArm.current.rotation.z = lerp(rArm.current.rotation.z, -0.35, 0.15)
      }
      if (rElbow.current) rElbow.current.rotation.x = lerp(rElbow.current.rotation.x, 1.85, 0.15)
    } else if (phase === 'presenting') {
      // Open welcoming gesture toward the itinerary.
      const g = Math.sin(t * 1.6) * 0.06
      if (lArm.current) lArm.current.rotation.x = lerp(lArm.current.rotation.x, 0.12, 0.12)
      if (rArm.current) {
        rArm.current.rotation.x = lerp(rArm.current.rotation.x, -0.5 + g, 0.12)
        rArm.current.rotation.z = lerp(rArm.current.rotation.z, -0.85, 0.12)
      }
      if (rElbow.current) rElbow.current.rotation.x = lerp(rElbow.current.rotation.x, 0.35, 0.12)
    } else {
      if (lArm.current) lArm.current.rotation.x = lerp(lArm.current.rotation.x, 0.05, 0.12)
      if (rArm.current) {
        rArm.current.rotation.x = lerp(rArm.current.rotation.x, 0.05, 0.12)
        rArm.current.rotation.z = lerp(rArm.current.rotation.z, 0, 0.12)
      }
      if (rElbow.current) rElbow.current.rotation.x = lerp(rElbow.current.rotation.x, 0.2, 0.12)
    }

    // Head: look down a touch while thinking, up while presenting.
    if (head.current) {
      const hx = phase === 'thinking' ? 0.28 : phase === 'presenting' ? -0.08 : 0
      head.current.rotation.x = lerp(head.current.rotation.x, hx + Math.sin(t * 0.8) * 0.02, 0.1)
      head.current.rotation.y = lerp(head.current.rotation.y, moving ? 0 : Math.sin(t * 0.5) * 0.12, 0.08)
    }

    // Ground halo pulses when thinking/presenting.
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial
      const target2 = phase === 'idle' || phase === 'arriving' ? 0 : phase === 'thinking' ? 0.7 : 0.5
      mat.opacity = lerp(mat.opacity, target2 + Math.sin(t * 4) * 0.08, 0.1)
    }
  })

  return (
    <group ref={root} position={[DOOR_POS.x, -0.4, DOOR_POS.z]}>
      {/* Ground halo */}
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.34, 0.46, 48]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0} toneMapped={false} />
      </mesh>

      <group ref={hip} position={[0, 0.9, 0]}>
        {/* Pelvis */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.34, 0.22, 0.24]} />
          <meshStandardMaterial color={SUIT} metalness={0.2} roughness={0.7} />
        </mesh>

        {/* Left leg */}
        <group ref={lLeg} position={[-0.11, -0.05, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.09, 0.4, 6, 14]} />
            <meshStandardMaterial color={SUIT} metalness={0.2} roughness={0.7} />
          </mesh>
          <group ref={lKnee} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.24, 0]}>
              <capsuleGeometry args={[0.075, 0.36, 6, 14]} />
              <meshStandardMaterial color={SUIT} metalness={0.2} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.46, 0.06]}>
              <boxGeometry args={[0.13, 0.09, 0.28]} />
              <meshStandardMaterial color="#0a0a0b" metalness={0.3} roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Right leg */}
        <group ref={rLeg} position={[0.11, -0.05, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.09, 0.4, 6, 14]} />
            <meshStandardMaterial color={SUIT} metalness={0.2} roughness={0.7} />
          </mesh>
          <group ref={rKnee} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.24, 0]}>
              <capsuleGeometry args={[0.075, 0.36, 6, 14]} />
              <meshStandardMaterial color={SUIT} metalness={0.2} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.46, 0.06]}>
              <boxGeometry args={[0.13, 0.09, 0.28]} />
              <meshStandardMaterial color="#0a0a0b" metalness={0.3} roughness={0.6} />
            </mesh>
          </group>
        </group>

        {/* Torso */}
        <group ref={torso} position={[0, 0.12, 0]}>
          <RoundedBox args={[0.5, 0.62, 0.3]} radius={0.12} smoothness={4} position={[0, 0.3, 0]}>
            <meshStandardMaterial color={SUIT} metalness={0.25} roughness={0.65} />
          </RoundedBox>
          {/* Shirt V + tie */}
          <mesh position={[0, 0.34, 0.15]}>
            <planeGeometry args={[0.2, 0.4]} />
            <meshStandardMaterial color={SHIRT} metalness={0.1} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, 0.161]}>
            <planeGeometry args={[0.06, 0.32]} />
            <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
          {/* Lapel accents */}
          <mesh position={[0, 0.5, 0.155]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.34, 0.14]} />
            <meshStandardMaterial color={SUIT_HI} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* VOYAGO badge */}
          <mesh position={[0.15, 0.42, 0.162]}>
            <circleGeometry args={[0.03, 20]} />
            <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>

          {/* Left arm */}
          <group ref={lArm} position={[-0.3, 0.52, 0]}>
            <mesh position={[0, -0.24, 0]}>
              <capsuleGeometry args={[0.075, 0.34, 6, 14]} />
              <meshStandardMaterial color={SUIT} metalness={0.25} roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <capsuleGeometry args={[0.065, 0.28, 6, 14]} />
              <meshStandardMaterial color={SUIT_HI} metalness={0.25} roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.68, 0]}>
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
          </group>

          {/* Right arm (with elbow for gestures) */}
          <group ref={rArm} position={[0.3, 0.52, 0]}>
            <mesh position={[0, -0.24, 0]}>
              <capsuleGeometry args={[0.075, 0.34, 6, 14]} />
              <meshStandardMaterial color={SUIT} metalness={0.25} roughness={0.65} />
            </mesh>
            <group ref={rElbow} position={[0, -0.44, 0]}>
              <mesh position={[0, -0.2, 0]}>
                <capsuleGeometry args={[0.065, 0.28, 6, 14]} />
                <meshStandardMaterial color={SUIT_HI} metalness={0.25} roughness={0.65} />
              </mesh>
              <mesh position={[0, -0.38, 0]}>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color={SKIN} roughness={0.6} />
              </mesh>
            </group>
          </group>

          {/* Neck */}
          <mesh position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.1, 16]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>

          {/* Head */}
          <group ref={head} position={[0, 0.82, 0]}>
            <mesh>
              <sphereGeometry args={[0.19, 28, 28]} />
              <meshStandardMaterial color={SKIN} roughness={0.55} />
            </mesh>
            {/* Jaw slight */}
            <mesh position={[0, -0.05, 0.02]} scale={[1, 0.9, 1]}>
              <sphereGeometry args={[0.17, 24, 24]} />
              <meshStandardMaterial color={SKIN} roughness={0.55} />
            </mesh>
            {/* Hair */}
            <mesh position={[0, 0.07, -0.02]} scale={[1.05, 0.9, 1.05]}>
              <sphereGeometry args={[0.2, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color={HAIR} roughness={0.7} />
            </mesh>
            {/* Eyes */}
            <mesh position={[-0.07, 0.0, 0.17]}>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshStandardMaterial color="#0a0a0b" />
            </mesh>
            <mesh position={[0.07, 0.0, 0.17]}>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshStandardMaterial color="#0a0a0b" />
            </mesh>
            {/* Smart glasses accent */}
            <mesh position={[0, 0.01, 0.175]}>
              <torusGeometry args={[0.055, 0.006, 8, 24]} />
              <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.8} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
