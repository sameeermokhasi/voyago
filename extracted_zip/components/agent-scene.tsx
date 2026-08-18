'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { VoyagoCab } from './voyago-cab'
import { HumanAgent } from './human-agent'
import { HolographicMap } from './holographic-map'
import { ORIGIN, type Phase } from '@/lib/travel-data'

const YELLOW = '#ffe600'

const CAM: Record<Phase, { pos: [number, number, number]; look: [number, number, number] }> = {
  idle: { pos: [0.6, 1.95, 7.6], look: [0.8, 1.0, -0.2] },
  arriving: { pos: [2.6, 1.55, 6.6], look: [1.7, 0.85, -0.3] },
  exiting: { pos: [1.15, 1.45, 5.3], look: [1.75, 1.0, 0.9] },
  walking: { pos: [0.3, 1.7, 5.7], look: [0.4, 1.1, 1.2] },
  thinking: { pos: [-0.55, 1.6, 4.7], look: [0.0, 1.25, 1.45] },
  presenting: { pos: [0.75, 1.55, 5.1], look: [0.2, 1.2, 1.4] },
}

function CameraRig({ phase }: { phase: Phase }) {
  const { camera, pointer } = useThree()
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(CAM.idle.look[0], CAM.idle.look[1], CAM.idle.look[2]), [])

  useFrame((_, delta) => {
    const c = CAM[phase] ?? CAM.idle
    const k = 1 - Math.pow(0.06, delta)
    pos.set(c.pos[0] + pointer.x * 0.35, c.pos[1] + pointer.y * 0.2, c.pos[2])
    camera.position.lerp(pos, k)
    look.lerp(new THREE.Vector3(c.look[0], c.look[1], c.look[2]), k)
    camera.lookAt(look)
  })
  return null
}

function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12
      arr[i * 3 + 1] = Math.random() * 4.5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.02
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + delta * 0.1
      if (y > 4.5) y = 0
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={YELLOW} size={0.03} transparent opacity={0.4} sizeAttenuation toneMapped={false} />
    </points>
  )
}

function Lights({ phase }: { phase: Phase }) {
  const key = useRef<THREE.PointLight>(null)
  useFrame((_, delta) => {
    if (!key.current) return
    const target = phase === 'thinking' ? 4.4 : phase === 'presenting' ? 3.8 : 2.2
    key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, target, 1 - Math.pow(0.02, delta))
  })
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#2a2f45', '#050505', 0.5]} />
      <directionalLight position={[4, 7, 4]} intensity={0.8} color="#cdd6ff" />
      <pointLight ref={key} position={[0, 3, 3]} intensity={2.2} color={YELLOW} distance={16} />
      <pointLight position={[-4, 2, 3]} intensity={0.7} color="#6f8cff" distance={12} />
      <spotLight position={[0.2, 6, 2]} angle={0.7} penumbra={1} intensity={1.1} color="#ffffff" />
    </>
  )
}

// Night road + skyline environment.
function Environment() {
  const dashes = useMemo(() => Array.from({ length: 12 }, (_, i) => -7 + i * 1.25), [])
  const buildings = useMemo(() => {
    const rng = (n: number) => {
      const x = Math.sin(n * 43.13) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 22 }, (_, i) => {
      const h = 1 + rng(i) * 3.4
      return {
        x: -9 + i * 0.95 + rng(i + 5) * 0.4,
        h,
        w: 0.5 + rng(i + 2) * 0.4,
        z: -5.5 - rng(i + 9) * 2,
        lit: rng(i + 3) > 0.55,
      }
    })
  }, [])

  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 24]} />
        <meshStandardMaterial color="#08090c" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Curb glow line where the cab parks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.3]}>
        <planeGeometry args={[40, 0.05]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* Center dashed lane markings (along x, the drive path) */}
      {dashes.map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.011, -0.6]}>
          <planeGeometry args={[0.6, 0.08]} />
          <meshBasicMaterial color="#3a3d24" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      ))}
      {/* Distant skyline */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshStandardMaterial
              color="#0c0f16"
              emissive={b.lit ? YELLOW : '#1b2740'}
              emissiveIntensity={b.lit ? 0.12 : 0.06}
              metalness={0.4}
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}
      {/* Soft grid on the ground for depth */}
      <gridHelper args={[40, 40, '#171a12', '#0d0f0a']} position={[0, 0.002, 0]} />
    </group>
  )
}

export function AgentScene({ phase, destination }: { phase: Phase; destination: string }) {
  return (
    <Canvas
      camera={{ position: CAM.idle.pos, fov: 44 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#050608']} />
      <fog attach="fog" args={['#050608', 8, 22]} />
      <CameraRig phase={phase} />
      <Lights phase={phase} />
      <Environment />
      <VoyagoCab phase={phase} />
      <HumanAgent phase={phase} />
      <HolographicMap phase={phase} destination={destination} origin={ORIGIN} />
      <Particles />
    </Canvas>
  )
}
