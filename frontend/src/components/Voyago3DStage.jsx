import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ORIGIN } from '../lib/travel-data'

const YELLOW = '#ffe600'
const BLACK = '#08080a'

export function Voyago3DStage({ destination = 'Chikmagalur', phase = 'idle' }) {
  const mountRef = useRef(null)
  const destRef = useRef(destination)
  destRef.current = destination

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 560

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050608')
    scene.fog = new THREE.FogExp2('#050608', 0.05)

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 1.3, 6.2)
    camera.lookAt(0.1, 0.9, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight.position.set(4, 8, 5)
    scene.add(dirLight)

    const robotPointLight = new THREE.PointLight(0xffe600, 2.8, 8)
    robotPointLight.position.set(0.9, 1.5, 1.5)
    scene.add(robotPointLight)

    const globePointLight = new THREE.PointLight(0xffe600, 1.8, 6)
    globePointLight.position.set(-1.4, 1.2, 1.2)
    scene.add(globePointLight)

    const rimLight = new THREE.PointLight(0x4080ff, 0.8, 10)
    rimLight.position.set(-3, 3, -2)
    scene.add(rimLight)

    // 3. Ground Perspective Grid & Platform Ring
    const grid = new THREE.GridHelper(24, 28, 0xffe600, 0x181a14)
    grid.position.set(0, 0, 0)
    grid.material.opacity = 0.22
    grid.material.transparent = true
    scene.add(grid)

    // Glowing Yellow Platform Ring under Robot
    const ringGeo = new THREE.RingGeometry(1.05, 1.15, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.set(0.9, 0.015, 0)
    scene.add(ringMesh)

    // Soft yellow ground glow under ring
    const groundGlowGeo = new THREE.PlaneGeometry(3.2, 3.2)
    const groundGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    })
    const groundGlowMesh = new THREE.Mesh(groundGlowGeo, groundGlowMat)
    groundGlowMesh.rotation.x = -Math.PI / 2
    groundGlowMesh.position.set(0.9, 0.008, 0)
    scene.add(groundGlowMesh)

    // 4. Ambient Floating Dust Particles
    const particleCount = 80
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14
      particlePositions[i * 3 + 1] = Math.random() * 4.5
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xffe600,
      size: 0.035,
      transparent: true,
      opacity: 0.55
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ==========================================
    // 5. THE ICONIC 3D VOYO ROBOT AGENT (RIGHT SIDE)
    // ==========================================
    const robotGroup = new THREE.Group()
    robotGroup.position.set(0.9, 0, 0)
    scene.add(robotGroup)

    // Glossy black obsidian lacquered material
    const robotBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0a0b0f,
      metalness: 0.88,
      roughness: 0.14
    })

    // Glowing electric yellow emissive material
    const glowYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xffe600,
      emissiveIntensity: 2.6,
      roughness: 0.2
    })

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 24)
    const footGeo = new THREE.CapsuleGeometry(0.12, 0.18, 12, 18)

    const leftLeg = new THREE.Mesh(legGeo, robotBodyMat)
    leftLeg.position.set(-0.24, 0.28, 0)
    robotGroup.add(leftLeg)

    const leftFoot = new THREE.Mesh(footGeo, robotBodyMat)
    leftFoot.rotation.x = Math.PI / 2
    leftFoot.position.set(-0.24, 0.08, 0.05)
    robotGroup.add(leftFoot)

    const rightLeg = new THREE.Mesh(legGeo, robotBodyMat)
    rightLeg.position.set(0.24, 0.28, 0)
    robotGroup.add(rightLeg)

    const rightFoot = new THREE.Mesh(footGeo, robotBodyMat)
    rightFoot.rotation.x = Math.PI / 2
    rightFoot.position.set(0.24, 0.08, 0.05)
    robotGroup.add(rightFoot)

    // Torso (Glossy curved body)
    const torsoGeo = new THREE.CapsuleGeometry(0.38, 0.45, 16, 24)
    const torso = new THREE.Mesh(torsoGeo, robotBodyMat)
    torso.position.set(0, 0.92, 0)
    robotGroup.add(torso)

    // Chest Arc Reactor Core (Glowing Yellow Center)
    const coreGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 32)
    const core = new THREE.Mesh(coreGeo, glowYellowMat)
    core.rotation.x = Math.PI / 2
    core.position.set(0, 0.95, 0.36)
    robotGroup.add(core)

    // Inner white-hot core
    const coreInnerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.07, 24)
    const coreInnerMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const coreInner = new THREE.Mesh(coreInnerGeo, coreInnerMat)
    coreInner.rotation.x = Math.PI / 2
    coreInner.position.set(0, 0.95, 0.37)
    robotGroup.add(coreInner)

    // Arms & Shoulder Spheres
    const shoulderGeo = new THREE.SphereGeometry(0.14, 24, 24)
    const armGeo = new THREE.CapsuleGeometry(0.1, 0.38, 12, 18)

    // Left Arm
    const leftShoulder = new THREE.Mesh(shoulderGeo, robotBodyMat)
    leftShoulder.position.set(-0.48, 1.12, 0)
    robotGroup.add(leftShoulder)

    const leftArm = new THREE.Mesh(armGeo, robotBodyMat)
    leftArm.position.set(-0.52, 0.82, 0)
    leftArm.rotation.z = 0.12
    robotGroup.add(leftArm)

    // Right Arm
    const rightShoulder = new THREE.Mesh(shoulderGeo, robotBodyMat)
    rightShoulder.position.set(0.48, 1.12, 0)
    robotGroup.add(rightShoulder)

    const rightArm = new THREE.Mesh(armGeo, robotBodyMat)
    rightArm.position.set(0.52, 0.82, 0)
    rightArm.rotation.z = -0.12
    robotGroup.add(rightArm)

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 32, 32)
    headGeo.scale(1.15, 0.95, 1.05)
    const head = new THREE.Mesh(headGeo, robotBodyMat)
    head.position.set(0, 1.62, 0)
    robotGroup.add(head)

    // Glowing Yellow Eyes (Rounded Visor Rectangles)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.14, 0.04)
    const eyeL = new THREE.Mesh(eyeGeo, glowYellowMat)
    eyeL.position.set(-0.13, 1.62, 0.39)
    robotGroup.add(eyeL)

    const eyeR = new THREE.Mesh(eyeGeo, glowYellowMat)
    eyeR.position.set(0.13, 1.62, 0.39)
    robotGroup.add(eyeR)

    // Ear Bolts
    const earGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 18)
    const earL = new THREE.Mesh(earGeo, glowYellowMat)
    earL.rotation.z = Math.PI / 2
    earL.position.set(-0.46, 1.62, 0)
    robotGroup.add(earL)

    const earR = new THREE.Mesh(earGeo, glowYellowMat)
    earR.rotation.z = Math.PI / 2
    earR.position.set(0.46, 1.62, 0)
    robotGroup.add(earR)

    // Antenna on Top
    const antStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12)
    const antStem = new THREE.Mesh(antStemGeo, robotBodyMat)
    antStem.position.set(0, 2.05, 0)
    robotGroup.add(antStem)

    // Glowing Yellow Sphere Tip
    const antTipGeo = new THREE.SphereGeometry(0.07, 24, 24)
    const antTip = new THREE.Mesh(antTipGeo, glowYellowMat)
    antTip.position.set(0, 2.2, 0)
    robotGroup.add(antTip)

    // ==========================================
    // 6. 3D HOLOGRAPHIC GLOBE & ROUTE (LEFT SIDE)
    // ==========================================
    const globeGroup = new THREE.Group()
    globeGroup.position.set(-1.45, 1.0, 0.2)
    scene.add(globeGroup)

    // Wireframe Geodesic Globe
    const globeRadius = 0.58
    const globeIcosaGeo = new THREE.IcosahedronGeometry(globeRadius, 2)
    const globeWireMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    })
    const globeWire = new THREE.Mesh(globeIcosaGeo, globeWireMat)
    globeGroup.add(globeWire)

    // Latitude Rings
    for (let r of [0.25, 0.48, 0.58]) {
      const ringG = new THREE.TorusGeometry(r, 0.005, 8, 48)
      const ringM = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0.35 })
      const ringMesh = new THREE.Mesh(ringG, ringM)
      ringMesh.rotation.x = Math.PI / 2
      globeGroup.add(ringMesh)
    }

    // Dynamic Route Arc Curve
    const routeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.45, -0.1, 0.35),
      new THREE.Vector3(0, 0.65, 0.1),
      new THREE.Vector3(0.45, 0.1, -0.25)
    )
    const routePts = routeCurve.getPoints(50)
    const routeGeo = new THREE.BufferGeometry().setFromPoints(routePts)
    const routeMat = new THREE.LineBasicMaterial({ color: 0xffe600, linewidth: 3, transparent: true, opacity: 0.9 })
    const routeLine = new THREE.Line(routeGeo, routeMat)
    globeGroup.add(routeLine)

    // Origin / Destination Pins
    const pinOrigGeo = new THREE.SphereGeometry(0.035, 16, 16)
    const pinOrigMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const pinOrig = new THREE.Mesh(pinOrigGeo, pinOrigMat)
    pinOrig.position.copy(routePts[0])
    globeGroup.add(pinOrig)

    const pinDestGeo = new THREE.SphereGeometry(0.045, 16, 16)
    const pinDestMat = new THREE.MeshBasicMaterial({ color: 0xffe600 })
    const pinDest = new THREE.Mesh(pinDestGeo, pinDestMat)
    pinDest.position.copy(routePts[routePts.length - 1])
    globeGroup.add(pinDest)

    // 7. Animation Loop
    let animId
    let clock = new THREE.Clock()

    const animate = () => {
      const delta = clock.getDelta()
      const t = clock.getElapsedTime()

      // Robot gentle floating & breathing animation
      robotGroup.position.y = Math.sin(t * 1.6) * 0.04
      antTip.scale.setScalar(1 + Math.sin(t * 3.5) * 0.1)

      // Natural eye blinking
      const blinkCycle = t % 4
      if (blinkCycle > 3.85) {
        eyeL.scale.y = 0.1
        eyeR.scale.y = 0.1
      } else {
        eyeL.scale.y = 1
        eyeR.scale.y = 1
      }

      // Globe continuous 3D rotation
      globeWire.rotation.y += delta * 0.4
      globeGroup.position.y = 1.0 + Math.sin(t * 1.2) * 0.02

      // Particles subtle upward movement
      const pos = particles.geometry.attributes.position
      for (let i = 0; i < particleCount; i++) {
        let py = pos.getY(i) + delta * 0.1
        if (py > 4.5) py = 0
        pos.setY(i, py)
      }
      pos.needsUpdate = true

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!container) return
      const nw = container.clientWidth || 600
      const nh = container.clientHeight || 560
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[440px] md:min-h-[560px] lg:min-h-[640px] bg-[#050608] overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Status Pill */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 animate-voyo-float">
        <div className="flex items-center gap-2 rounded-full border border-yellow-400/50 bg-black/85 px-4 py-1.5 backdrop-blur shadow-2xl">
          <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-white tracking-wide">
            VOYO — Your AI Travel Buddy
          </span>
        </div>
      </div>

      {/* Holographic Route Badge (Left side over Globe) */}
      <div className="pointer-events-none absolute left-[12%] md:left-[16%] top-[24%] md:top-[28%] z-10 -translate-x-1/2">
        <div className="rounded-full border border-yellow-400/60 bg-black/85 px-3.5 py-1 backdrop-blur shadow-lg shadow-yellow-400/10">
          <span className="font-mono text-xs md:text-sm font-bold text-yellow-400 tracking-wider">
            {ORIGIN} ➔ {destination}
          </span>
        </div>
      </div>

      {/* Floating Context Labels around Globe */}
      <div className="pointer-events-none absolute left-[12%] md:left-[16%] top-[37%] md:top-[40%] z-10 -translate-x-1/2">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          WEATHER
        </span>
      </div>
      <div className="pointer-events-none absolute left-[4%] md:left-[6%] top-[50%] z-10">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          FOOD
        </span>
      </div>
      <div className="pointer-events-none absolute left-[22%] md:left-[26%] top-[50%] z-10">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          BUDGET
        </span>
      </div>
      <div className="pointer-events-none absolute left-[6%] md:left-[8%] top-[62%] z-10">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          EVENTS
        </span>
      </div>
      <div className="pointer-events-none absolute left-[18%] md:left-[22%] top-[62%] z-10">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          STAYS
        </span>
      </div>
    </div>
  )
}

export default Voyago3DStage
