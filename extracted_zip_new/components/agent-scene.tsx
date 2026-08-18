'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { VoyoAgent3D } from './voyo-agent-3d'
import { HolographicMap } from './holographic-map'
import { ORIGIN, type AgentState } from '@/lib/travel-data'

const YELLOW = '#ffe600'

function CameraRig({ state }: { state: AgentState }) {
  const { camera, pointer } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, delta)
    // Base composition per state
    const base =
      state === 'thinking'
        ? new THREE.Vector3(-0.4, 1.55, 3.9)
        : state === 'success'
          ? new THREE.Vector3(0.5, 1.45, 4.7)
          : new THREE.Vector3(0, 1.45, 5.1)
    // Subtle mouse parallax
    target.set(base.x + pointer.x * 0.4, base.y + pointer.y * 0.25, base.z)
    camera.position.lerp(target, k)
    camera.lookAt(0, 1.25, 0)
  })
  return null
}

function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7
      arr[i * 3 + 1] = Math.random() * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [count])

  useFrame((s, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.03
      const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + delta * 0.12
        if (y > 4) y = 0
        pos.setY(i, y)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={YELLOW} size={0.03} transparent opacity={0.5} sizeAttenuation toneMapped={false} />
    </points>
  )
}

function Lights({ state }: { state: AgentState }) {
  const key = useRef<THREE.PointLight>(null)
  useFrame((_, delta) => {
    if (key.current) {
      const target = state === 'thinking' ? 4.5 : state === 'success' ? 3.6 : 2.4
      key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, target, 1 - Math.pow(0.01, delta))
    }
  })
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffffff" />
      <pointLight ref={key} position={[0, 2.5, 3]} intensity={2.4} color={YELLOW} distance={12} />
      <pointLight position={[-3, 1.5, 2]} intensity={0.8} color="#88aaff" distance={10} />
      <spotLight position={[0, 6, 0]} angle={0.6} penumbra={1} intensity={1.2} color="#ffffff" />
    </>
  )
}

function Platform() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial color="#0a0b0d" metalness={0.2} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.15, 1.22, 64]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* soft grid */}
      <gridHelper args={[10, 20, YELLOW, '#1a1b1f']} position={[0, 0.001, 0]}>
        <meshBasicMaterial attach="material" transparent opacity={0.1} />
      </gridHelper>
    </group>
  )
}

export function AgentScene({ state, destination }: { state: AgentState; destination: string }) {
  return (
    <Canvas
      camera={{ position: [0, 1.45, 5.1], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <fog attach="fog" args={['#050505', 6, 14]} />
      <CameraRig state={state} />
      <Lights state={state} />
      <Platform />
      <VoyoAgent3D state={state} />
      <HolographicMap state={state} destination={destination} origin={ORIGIN} />
      <Particles />
    </Canvas>
  )
}
