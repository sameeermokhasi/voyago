import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ORIGIN } from '../lib/travel-data'

const YELLOW = '#ffe600'
const lerp = THREE.MathUtils.lerp

// Target poses per state
const POSES = {
  idle: { headX: 0, headZ: 0, rArmX: 0.08, rArmZ: -0.12, rElbow: 0.15, lArmX: 0.08, lArmZ: 0.12, eye: 1.8, bob: 1 },
  thinking: { headX: 0.06, headZ: 0.18, rArmX: -1.85, rArmZ: 0.55, rElbow: 1.35, lArmX: 0.08, lArmZ: 0.12, eye: 3.2, bob: 0.6 },
  success: { headX: -0.04, headZ: 0, rArmX: -2.3, rArmZ: -0.6, rElbow: 0.2, lArmX: 0.12, lArmZ: 0.16, eye: 2.4, bob: 1.4 },
}

export function AgentScene({ state = 'idle', destination = 'Chikmagalur' }) {
  const containerRef = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const destRef = useRef(destination)
  destRef.current = destination

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 700
    const height = container.clientHeight || 750

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#030304')
    scene.fog = new THREE.FogExp2('#030304', 0.03)

    // Wide perspective camera positioned back to fit entire robot + rings + antenna
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 1.25, 6.0)
    camera.lookAt(0, 1.0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)

    // 2. Studio Lighting (Golden Highlights & Deep Specular Reflections)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6)
    dirLight.position.set(3.5, 7, 4.5)
    scene.add(dirLight)

    const frontKeyLight = new THREE.PointLight(0xffe600, 3.2, 12)
    frontKeyLight.position.set(0, 2.0, 3.0)
    scene.add(frontKeyLight)

    const backRimLight = new THREE.PointLight(0x80aaff, 1.2, 10)
    backRimLight.position.set(-2.5, 2.5, -2)
    scene.add(backRimLight)

    // 3. Platform & Double Concentric Glowing Floor Rings (Matching Image 3)
    const platformGroup = new THREE.Group()
    platformGroup.position.set(0, 0.02, 0)
    scene.add(platformGroup)

    const baseGeo = new THREE.CircleGeometry(2.8, 64)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x08090b, metalness: 0.35, roughness: 0.8 })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    baseMesh.rotation.x = -Math.PI / 2
    platformGroup.add(baseMesh)

    // Inner Radiant Yellow Ring
    const innerRingGeo = new THREE.RingGeometry(1.05, 1.16, 64)
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    })
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat)
    innerRingMesh.rotation.x = -Math.PI / 2
    innerRingMesh.position.y = 0.012
    platformGroup.add(innerRingMesh)

    // Outer Secondary Glow Ring
    const outerRingGeo = new THREE.RingGeometry(1.32, 1.40, 64)
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    })
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat)
    outerRingMesh.rotation.x = -Math.PI / 2
    outerRingMesh.position.y = 0.008
    platformGroup.add(outerRingMesh)

    // Ground Grid
    const grid = new THREE.GridHelper(20, 24, 0xffe600, 0x181a14)
    grid.position.set(0, 0.001, 0)
    grid.material.opacity = 0.16
    grid.material.transparent = true
    platformGroup.add(grid)

    // Distant City Skyline Horizon Lights (Matching Image 3)
    const horizonCount = 50
    const horizonGeo = new THREE.BufferGeometry()
    const horizonPos = new Float32Array(horizonCount * 3)
    for (let i = 0; i < horizonCount; i++) {
      horizonPos[i * 3] = (i - horizonCount / 2) * 0.22
      horizonPos[i * 3 + 1] = 0.85 + Math.sin(i * 14.7) * 0.06
      horizonPos[i * 3 + 2] = -4.2
    }
    horizonGeo.setAttribute('position', new THREE.BufferAttribute(horizonPos, 3))
    const horizonLights = new THREE.Points(horizonGeo, new THREE.PointsMaterial({ color: 0xffe600, size: 0.035, transparent: true, opacity: 0.8 }))
    scene.add(horizonLights)

    // 4. Ambient Floating Gold Particles
    const particleCount = 75
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8
      particlePositions[i * 3 + 1] = Math.random() * 4.2
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4.5
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xffe600, size: 0.03, transparent: true, opacity: 0.5 }))
    scene.add(particles)

    // ==========================================
    // 5. EXACT 3D VOYO ROBOT AGENT (PROPERLY SCALED & CENTERED)
    // ==========================================
    const robotRoot = new THREE.Group()
    robotRoot.position.set(0, 0, 0)
    robotRoot.scale.set(0.85, 0.85, 0.85) // Perfect scale to ensure head/antenna/feet are never cut off
    scene.add(robotRoot)

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x121317,
      metalness: 0.52,
      roughness: 0.32
    })

    const bodyLightMat = new THREE.MeshStandardMaterial({
      color: 0x22242c,
      metalness: 0.55,
      roughness: 0.32
    })

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfffbe0,
      emissive: 0xffe600,
      emissiveIntensity: 2.5,
      roughness: 0.1
    })

    const glowYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xffe600,
      emissiveIntensity: 2.6,
      roughness: 0.15
    })

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.14, 0.46, 8, 16)
    const leftLeg = new THREE.Mesh(legGeo, bodyMat)
    leftLeg.position.set(-0.22, 0.6, 0)
    robotRoot.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, bodyMat)
    rightLeg.position.set(0.22, 0.6, 0)
    robotRoot.add(rightLeg)

    // Torso Group
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 1.22, 0)
    robotRoot.add(torsoGroup)

    const torsoGeo = new THREE.CapsuleGeometry(0.42, 0.44, 12, 20)
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat)
    torsoGroup.add(torsoMesh)

    // Large Glowing Chest Arc Reactor Core (Matching Image 3)
    const chestOuterGeo = new THREE.TorusGeometry(0.19, 0.018, 12, 36)
    const chestOuter = new THREE.Mesh(chestOuterGeo, bodyLightMat)
    chestOuter.position.set(0, 0.07, 0.38)
    torsoGroup.add(chestOuter)

    const chestCoreGeo = new THREE.CircleGeometry(0.17, 32)
    const chestCore = new THREE.Mesh(chestCoreGeo, glowYellowMat)
    chestCore.position.set(0, 0.07, 0.39)
    torsoGroup.add(chestCore)

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.15, 20, 20)
    const leftShoulder = new THREE.Mesh(shoulderGeo, bodyLightMat)
    leftShoulder.position.set(-0.48, 0.28, 0)
    torsoGroup.add(leftShoulder)

    const rightShoulder = new THREE.Mesh(shoulderGeo, bodyLightMat)
    rightShoulder.position.set(0.48, 0.28, 0)
    torsoGroup.add(rightShoulder)

    // Left Arm
    const lArm = new THREE.Group()
    lArm.position.set(-0.48, 0.26, 0)
    torsoGroup.add(lArm)

    const armUpperGeo = new THREE.CapsuleGeometry(0.095, 0.36, 6, 14)
    const lArmUpper = new THREE.Mesh(armUpperGeo, bodyMat)
    lArmUpper.position.set(0, -0.28, 0)
    lArm.add(lArmUpper)

    const armForeGeo = new THREE.CapsuleGeometry(0.085, 0.28, 6, 14)
    const lArmFore = new THREE.Mesh(armForeGeo, bodyLightMat)
    lArmFore.position.set(0, -0.58, 0)
    lArm.add(lArmFore)

    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), bodyMat)
    lHand.position.set(0, -0.8, 0)
    lArm.add(lHand)

    // Right Arm (with Elbow for Thinking Gesture)
    const rArm = new THREE.Group()
    rArm.position.set(0.48, 0.26, 0)
    torsoGroup.add(rArm)

    const rArmUpper = new THREE.Mesh(armUpperGeo, bodyMat)
    rArmUpper.position.set(0, -0.28, 0)
    rArm.add(rArmUpper)

    const rElbow = new THREE.Group()
    rElbow.position.set(0, -0.46, 0)
    rArm.add(rElbow)

    const rArmFore = new THREE.Mesh(armForeGeo, bodyLightMat)
    rArmFore.position.set(0, -0.18, 0)
    rElbow.add(rArmFore)

    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), bodyMat)
    rHand.position.set(0, -0.38, 0)
    rElbow.add(rHand)

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16), bodyLightMat)
    neck.position.set(0, 0.5, 0)
    torsoGroup.add(neck)

    // Head Group
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 0.82, 0)
    torsoGroup.add(headGroup)

    const headGeo = new THREE.BoxGeometry(0.7, 0.58, 0.58)
    const headMesh = new THREE.Mesh(headGeo, bodyMat)
    headGroup.add(headMesh)

    // Visor Plate
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.05), new THREE.MeshStandardMaterial({ color: 0x08090b, metalness: 0.8, roughness: 0.18 }))
    visorMesh.position.set(0, 0.02, 0.295)
    headGroup.add(visorMesh)

    // Glowing Yellow Capsule Eyes (Matching Image 3)
    const eyeGeo = new THREE.CapsuleGeometry(0.045, 0.055, 6, 14)
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.13, 0.03, 0.325)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.13, 0.03, 0.325)
    headGroup.add(rightEye)

    // Ear Pods (Yellow Bolts on sides)
    const earGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.06, 20)
    const leftEar = new THREE.Mesh(earGeo, glowYellowMat)
    leftEar.rotation.z = Math.PI / 2
    leftEar.position.set(-0.36, 0, 0)
    headGroup.add(leftEar)

    const rightEar = new THREE.Mesh(earGeo, glowYellowMat)
    rightEar.rotation.z = Math.PI / 2
    rightEar.position.set(0.36, 0, 0)
    headGroup.add(rightEar)

    // Top Antenna Stem
    const antStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), bodyLightMat)
    antStem.position.set(0, 0.38, 0)
    headGroup.add(antStem)

    // Glowing Yellow Antenna Bulb
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), glowYellowMat)
    antTip.position.set(0, 0.5, 0)
    headGroup.add(antTip)

    // ==========================================
    // 6. 3D HOLOGRAPHIC INDIA MAP (LEFT OF ROBOT)
    // ==========================================
    const indiaMapGroup = new THREE.Group()
    indiaMapGroup.position.set(-1.3, 0.95, 0.8)
    indiaMapGroup.scale.setScalar(0.68)
    scene.add(indiaMapGroup)

    // Accurate Vector Boundary of India
    const indiaShape = new THREE.Shape()
    const indiaCoords = [
      [-0.08, 0.88],  // Kashmir North Tip
      [0.08, 0.85],   // Ladakh
      [0.2, 0.68],    // Himachal / Uttarakhand
      [0.16, 0.52],   // Nepal Border
      [0.34, 0.48],   // Sikkim
      [0.54, 0.55],   // Arunachal Pradesh
      [0.68, 0.42],   // Assam / Nagaland
      [0.6, 0.26],    // Manipur / Mizoram
      [0.45, 0.22],   // Tripura
      [0.34, 0.16],   // West Bengal / Sundarbans
      [0.26, -0.06],  // Odisha Coast
      [0.16, -0.32],  // Andhra Pradesh Coast
      [0.06, -0.6],   // Tamil Nadu Coast
      [0.0, -0.84],   // Kanyakumari (South Tip)
      [-0.08, -0.74], // Kerala Coast
      [-0.14, -0.46], // Karnataka Coast (Mangalore/Udupi)
      [-0.2, -0.34],  // Goa Coast
      [-0.3, -0.08],  // Maharashtra Coast (Mumbai)
      [-0.48, 0.04],  // Gujarat (Kutch/Kathiawar)
      [-0.56, 0.16],  // Gujarat West (Dwarka)
      [-0.38, 0.32],  // Rajasthan Border
      [-0.24, 0.52],  // Punjab Border
      [-0.18, 0.74],  // Jammu West
    ]

    indiaShape.moveTo(indiaCoords[0][0], indiaCoords[0][1])
    for (let i = 1; i < indiaCoords.length; i++) {
      indiaShape.lineTo(indiaCoords[i][0], indiaCoords[i][1])
    }
    indiaShape.closePath()

    // 1. Extruded Holographic 3D Map Body
    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 }
    const indiaGeo = new THREE.ExtrudeGeometry(indiaShape, extrudeSettings)
    const indiaMat = new THREE.MeshStandardMaterial({
      color: 0x181812,
      roughness: 0.2,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
    })
    const indiaMesh = new THREE.Mesh(indiaGeo, indiaMat)
    indiaMesh.position.set(0, 0, -0.04)
    indiaMapGroup.add(indiaMesh)

    // 2. Glowing Golden Border Line Loop
    const borderPoints = indiaCoords.map(([x, y]) => new THREE.Vector3(x, y, 0.055))
    borderPoints.push(borderPoints[0].clone())
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints)
    const borderLine = new THREE.Line(borderGeo, new THREE.LineBasicMaterial({ color: 0xffe600, linewidth: 2, transparent: true, opacity: 0.9 }))
    indiaMapGroup.add(borderLine)

    // 3. Holographic Coordinate Topographic Grid Points Inside India
    const gridPoints = []
    for (let x = -0.5; x <= 0.6; x += 0.08) {
      for (let y = -0.8; y <= 0.8; y += 0.08) {
        // Quick point in polygon / rough bounding check
        if (
          (y > -0.8 && y < -0.3 && x > -0.2 && x < 0.2) ||
          (y >= -0.3 && y < 0.2 && x > -0.45 && x < 0.35) ||
          (y >= 0.2 && y < 0.5 && x > -0.35 && x < 0.6) ||
          (y >= 0.5 && y < 0.85 && x > -0.18 && x < 0.22)
        ) {
          gridPoints.push(new THREE.Vector3(x, y, 0.05))
        }
      }
    }
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints)
    const gridMat = new THREE.PointsMaterial({ color: 0xffe600, size: 0.02, transparent: true, opacity: 0.45 })
    const gridMesh = new THREE.Points(gridGeo, gridMat)
    indiaMapGroup.add(gridMesh)

    // 4. City Coordinates Map
    const cityCoordsMap = {
      bangalore: new THREE.Vector3(0.04, -0.46, 0.06),
      chikmagalur: new THREE.Vector3(-0.06, -0.42, 0.06),
      mumbai: new THREE.Vector3(-0.28, -0.06, 0.06),
      goa: new THREE.Vector3(-0.16, -0.34, 0.06),
      jaipur: new THREE.Vector3(-0.18, 0.32, 0.06),
      manali: new THREE.Vector3(-0.08, 0.64, 0.06),
      udaipur: new THREE.Vector3(-0.26, 0.18, 0.06),
      kerala: new THREE.Vector3(-0.04, -0.68, 0.06),
      varanasi: new THREE.Vector3(0.18, 0.24, 0.06),
      rishikesh: new THREE.Vector3(0.02, 0.56, 0.06),
    }

    const origPos = cityCoordsMap.bangalore
    const destKey = (destination || 'Chikmagalur').trim().toLowerCase()
    const destPos = cityCoordsMap[destKey] || new THREE.Vector3(-0.06, -0.42, 0.06)

    // Origin Beacon (Bangalore - White Pulsing)
    const pinOrig = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    pinOrig.position.copy(origPos)
    indiaMapGroup.add(pinOrig)

    // Destination Beacon (Destination - Yellow Pulsing)
    const pinDest = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe600 }))
    pinDest.position.copy(destPos)
    indiaMapGroup.add(pinDest)

    // Glowing Destination Target Ring
    const destRing = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.07, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe600, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    )
    destRing.position.copy(destPos)
    indiaMapGroup.add(destRing)

    // 5. Parabolic 3D Glowing Flight Route Arc
    const midX = (origPos.x + destPos.x) / 2
    const midY = (origPos.y + destPos.y) / 2
    const dist = origPos.distanceTo(destPos)
    const arcHeight = Math.max(0.2, dist * 0.75)

    const routeCurve = new THREE.QuadraticBezierCurve3(
      origPos,
      new THREE.Vector3(midX, midY, 0.06 + arcHeight),
      destPos
    )
    const routePts = routeCurve.getPoints(50)
    const routeGeo = new THREE.BufferGeometry().setFromPoints(routePts)
    const routeLine = new THREE.Line(
      routeGeo,
      new THREE.LineBasicMaterial({ color: 0xffe600, linewidth: 2, transparent: true, opacity: 0.9 })
    )
    indiaMapGroup.add(routeLine)

    // 7. Render Loop
    let animId
    let clock = new THREE.Clock()
    let mouse = { x: 0, y: 0 }

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }
    window.addEventListener('mousemove', onMouseMove)

    const animate = () => {
      const delta = clock.getDelta()
      const t = clock.getElapsedTime()
      const currState = stateRef.current || 'idle'
      const p = POSES[currState] || POSES.idle
      const k = 1 - Math.pow(0.001, delta)

      // Dynamic Camera Position (Always maintains full framing!)
      const baseCam =
        currState === 'thinking'
          ? new THREE.Vector3(-0.3, 1.35, 5.2)
          : currState === 'success'
            ? new THREE.Vector3(-0.4, 1.25, 5.6)
            : new THREE.Vector3(0, 1.25, 6.0)

      camera.position.x = lerp(camera.position.x, baseCam.x + mouse.x * 0.2, 0.05)
      camera.position.y = lerp(camera.position.y, baseCam.y + mouse.y * 0.12, 0.05)
      camera.position.z = lerp(camera.position.z, baseCam.z, 0.05)
      camera.lookAt(0, 0.95, 0)

      // Key light intensity
      const targetLight = currState === 'thinking' ? 4.5 : currState === 'success' ? 3.6 : 3.0
      frontKeyLight.intensity = lerp(frontKeyLight.intensity, targetLight, 0.05)

      // Robot floating & breathing
      robotRoot.position.y = lerp(robotRoot.position.y, Math.sin(t * 1.1) * 0.035 * p.bob, k)
      robotRoot.rotation.y = lerp(robotRoot.rotation.y, Math.sin(t * 0.4) * 0.06, k * 0.5)

      torsoGroup.scale.y = lerp(torsoGroup.scale.y, 1 + Math.sin(t * 1.6) * 0.012 * p.bob, k)

      // Head
      headGroup.rotation.x = lerp(headGroup.rotation.x, p.headX + Math.sin(t * 0.7) * 0.02, k)
      headGroup.rotation.z = lerp(headGroup.rotation.z, p.headZ, k)
      headGroup.rotation.y = lerp(headGroup.rotation.y, Math.sin(t * 0.5) * 0.05, k * 0.6)

      // Right Arm (Thinking / Pose)
      rArm.rotation.x = lerp(rArm.rotation.x, p.rArmX, k)
      rArm.rotation.z = lerp(rArm.rotation.z, p.rArmZ, k)
      rElbow.rotation.x = lerp(rElbow.rotation.x, p.rElbow, k)

      // Left Arm
      lArm.rotation.x = lerp(lArm.rotation.x, p.lArmX + Math.sin(t * 1.2) * 0.025, k)
      lArm.rotation.z = lerp(lArm.rotation.z, p.lArmZ, k)

      // Eyes blink & pulse
      const blinkCycle = t % 4
      const eyeScaleY = blinkCycle > 3.85 ? 0.1 : 1
      leftEye.scale.y = eyeScaleY
      rightEye.scale.y = eyeScaleY

      const pulse = currState === 'thinking' ? 1 + Math.sin(t * 6) * 0.35 : 1
      eyeMat.emissiveIntensity = lerp(eyeMat.emissiveIntensity, p.eye * pulse, k)
      glowYellowMat.emissiveIntensity = lerp(glowYellowMat.emissiveIntensity, (currState === 'idle' ? 2.0 : 2.8) * pulse, k)

      // 3D India Map Floating & Subtle Perspective Tilt
      indiaMapGroup.rotation.y = lerp(indiaMapGroup.rotation.y, Math.sin(t * 0.5) * 0.15 + (mouse.x * 0.18), 0.05)
      indiaMapGroup.rotation.x = lerp(indiaMapGroup.rotation.x, 0.18 - (mouse.y * 0.12), 0.05)
      indiaMapGroup.position.y = 0.95 + Math.sin(t * 1.2) * 0.03

      // Pulsing destination target ring
      const ringScale = 1 + Math.sin(t * 4) * 0.15
      destRing.scale.set(ringScale, ringScale, ringScale)

      // Particles drift
      const pos = particles.geometry.attributes.position
      for (let i = 0; i < particleCount; i++) {
        let py = pos.getY(i) + delta * 0.12
        if (py > 4.2) py = 0
        pos.setY(i, py)
      }
      pos.needsUpdate = true

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const nw = container.clientWidth || 700
      const nh = container.clientHeight || 750
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[600px] md:min-h-[720px] lg:min-h-[800px] bg-[#030304] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Holographic Route Badge (Matching Image 3: Yellow Text on Black Pill) */}
      <div className="pointer-events-none absolute left-[12%] md:left-[15%] top-[24%] md:top-[28%] z-10 -translate-x-1/2">
        <div className="rounded-full border border-yellow-400/50 bg-black/85 px-3.5 py-1 font-mono text-xs md:text-sm font-bold text-yellow-400 tracking-wider shadow-lg shadow-yellow-400/10">
          {ORIGIN} ➔ {destination || '—'}
        </div>
      </div>

      {/* Floating Context Labels around Globe */}
      <div className="pointer-events-none absolute left-[12%] md:left-[15%] top-[36%] md:top-[40%] z-10 -translate-x-1/2">
        <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          WEATHER
        </span>
      </div>
      <div className="pointer-events-none absolute left-[4%] md:left-[6%] top-[48%] z-10">
        <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          FOOD
        </span>
      </div>
      <div className="pointer-events-none absolute left-[20%] md:left-[24%] top-[48%] z-10">
        <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          BUDGET
        </span>
      </div>
      <div className="pointer-events-none absolute left-[5%] md:left-[7%] top-[60%] z-10">
        <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          EVENTS
        </span>
      </div>
      <div className="pointer-events-none absolute left-[18%] md:left-[21%] top-[60%] z-10">
        <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/70 backdrop-blur">
          STAYS
        </span>
      </div>
    </div>
  )
}

export default AgentScene
