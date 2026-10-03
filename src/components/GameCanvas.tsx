import React, { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { type ControllerInputPayload } from '../types/network'

const { Engine, World, Bodies, Body, Constraint } = Matter

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export interface GameCanvasProps {
  getLatestInputs: () => {
    1: ControllerInputPayload | null
    2: ControllerInputPayload | null
  }
  onTetherSnap?: () => void
  onOverstretch?: () => void
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  getLatestInputs,
  onTetherSnap,
  onOverstretch
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Diagnostics state for telemetry overlay
  const [telemetry, setTelemetry] = useState({
    distance: 160,
    strainPercent: 0,
    fps: 60,
    status: 'OPTIMAL' as 'OPTIMAL' | 'STRETCHING' | 'CRITICAL'
  })

  // Keyboard fallback state for desktop testing
  const keysRef = useRef<{ [key: string]: boolean }>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup Canvas dimensions
    let width = (canvas.width = container.clientWidth || 900)
    let height = (canvas.height = container.clientHeight || 500)

    const handleResize = () => {
      if (!container || !canvas) return
      width = canvas.width = container.clientWidth
      height = canvas.height = container.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // 1. Matter.js Physics Engine Setup (Zero Gravity Space)
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }
    })
    const world = engine.world

    const SHIP_RADIUS = 24
    const INITIAL_DISTANCE = 160

    // Ship 1: Player 1 (Cyan - Alpha Pod)
    const ship1 = Bodies.circle(width / 2 - INITIAL_DISTANCE / 2, height / 2, SHIP_RADIUS, {
      frictionAir: 0.02,
      density: 0.002,
      restitution: 0.6,
      label: 'Ship1'
    })

    // Ship 2: Player 2 (Pink - Beta Pod)
    const ship2 = Bodies.circle(width / 2 + INITIAL_DISTANCE / 2, height / 2, SHIP_RADIUS, {
      frictionAir: 0.02,
      density: 0.002,
      restitution: 0.6,
      label: 'Ship2'
    })

    // Initial angles: Ship 1 faces right, Ship 2 faces left
    Body.setAngle(ship1, 0)
    Body.setAngle(ship2, Math.PI)

    // Elastic Tether Constraint (Hooke's Law: L0 = 160, k = 0.04, gamma = 0.08 per PRD Section 5)
    const tether = Constraint.create({
      bodyA: ship1,
      bodyB: ship2,
      length: 160,
      stiffness: 0.04,
      damping: 0.08
    })

    World.add(world, [ship1, ship2, tether])

    // Visual Particle & Spark Systems
    const particles: Particle[] = []
    const sparks: Spark[] = []

    // Smooth Camera Tracker
    let camX = width / 2
    let camY = height / 2

    // Stars field
    const stars: { x: number; y: number; s: number; a: number }[] = []
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        s: Math.random() * 2 + 0.5,
        a: Math.random() * 0.7 + 0.3
      })
    }

    // Animation Loop
    let animId: number
    let lastTime = performance.now()
    let frameCount = 0
    let lastFpsTime = lastTime
    let criticalWarningTriggered = false

    const renderLoop = (time: number) => {
      animId = requestAnimationFrame(renderLoop)

      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      // FPS tracking
      frameCount++
      if (time - lastFpsTime > 500) {
        setTelemetry((prev) => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (time - lastFpsTime))
        }))
        frameCount = 0
        lastFpsTime = time
      }

      // 2. Fetch inputs (Mobile Controller or Desktop Keyboard Fallback)
      const inputs = getLatestInputs()
      const keys = keysRef.current

      // P1 Inputs: WASD fallback
      let p1Steer = inputs[1]?.st ?? 0
      let p1Thrust = inputs[1]?.th ?? 0
      let p1Reel = inputs[1]?.re ?? false
      let p1Boost = inputs[1]?.bo ?? false

      if (keys['KeyA']) p1Steer = -1.0
      if (keys['KeyD']) p1Steer = 1.0
      if (keys['KeyW']) p1Thrust = 1.0
      if (keys['KeyS']) p1Reel = true
      if (keys['Space']) p1Boost = true

      // P2 Inputs: Arrow Keys fallback
      let p2Steer = inputs[2]?.st ?? 0
      let p2Thrust = inputs[2]?.th ?? 0
      let p2Reel = inputs[2]?.re ?? false
      let p2Boost = inputs[2]?.bo ?? false

      if (keys['ArrowLeft']) p2Steer = -1.0
      if (keys['ArrowRight']) p2Steer = 1.0
      if (keys['ArrowUp']) p2Thrust = 1.0
      if (keys['ArrowDown']) p2Reel = true
      if (keys['Enter']) p2Boost = true

      // 3. Apply Forces to Ship 1
      const THRUST_MAG = 0.0025 * (p1Boost ? 1.8 : 1.0)
      const ROTATION_SPEED = 0.065

      Body.setAngularVelocity(ship1, p1Steer * ROTATION_SPEED)

      if (p1Thrust > 0.05) {
        const angle1 = ship1.angle
        const force1 = {
          x: Math.cos(angle1) * p1Thrust * THRUST_MAG,
          y: Math.sin(angle1) * p1Thrust * THRUST_MAG
        }
        Body.applyForce(ship1, ship1.position, force1)

        // Spawn Thruster Exhaust Particles (Cyan)
        const exhaustX = ship1.position.x - Math.cos(angle1) * (SHIP_RADIUS + 4)
        const exhaustY = ship1.position.y - Math.sin(angle1) * (SHIP_RADIUS + 4)
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: exhaustX + (Math.random() - 0.5) * 6,
            y: exhaustY + (Math.random() - 0.5) * 6,
            vx: -Math.cos(angle1) * (2 + Math.random() * 3) + (Math.random() - 0.5),
            vy: -Math.sin(angle1) * (2 + Math.random() * 3) + (Math.random() - 0.5),
            life: 1,
            maxLife: 0.35 + Math.random() * 0.2,
            color: '#00F0FF',
            size: Math.random() * 3.5 + 2
          })
        }
      }

      // 4. Apply Forces to Ship 2
      const THRUST_MAG2 = 0.0025 * (p2Boost ? 1.8 : 1.0)
      Body.setAngularVelocity(ship2, p2Steer * ROTATION_SPEED)

      if (p2Thrust > 0.05) {
        const angle2 = ship2.angle
        const force2 = {
          x: Math.cos(angle2) * p2Thrust * THRUST_MAG2,
          y: Math.sin(angle2) * p2Thrust * THRUST_MAG2
        }
        Body.applyForce(ship2, ship2.position, force2)

        // Spawn Thruster Exhaust Particles (Pink)
        const exhaustX2 = ship2.position.x - Math.cos(angle2) * (SHIP_RADIUS + 4)
        const exhaustY2 = ship2.position.y - Math.sin(angle2) * (SHIP_RADIUS + 4)
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: exhaustX2 + (Math.random() - 0.5) * 6,
            y: exhaustY2 + (Math.random() - 0.5) * 6,
            vx: -Math.cos(angle2) * (2 + Math.random() * 3) + (Math.random() - 0.5),
            vy: -Math.sin(angle2) * (2 + Math.random() * 3) + (Math.random() - 0.5),
            life: 1,
            maxLife: 0.35 + Math.random() * 0.2,
            color: '#FF2A85',
            size: Math.random() * 3.5 + 2
          })
        }
      }

      // 5. Reel Constraint Behavior (Decrease length by 50% & increase stiffness)
      const isReelActive = p1Reel || p2Reel
      if (isReelActive) {
        tether.length = 80 // 50% of 160px
        tether.stiffness = 0.1
      } else {
        tether.length = 160
        tether.stiffness = 0.04
      }

      // 6. Step Matter.js Physics Engine
      Engine.update(engine, 1000 / 60)

      // Calculate Tether Distance & Strain
      const dx = ship2.position.x - ship1.position.x
      const dy = ship2.position.y - ship1.position.y
      const distance = Math.hypot(dx, dy)
      const strainPercent = Math.min(100, Math.round(((distance - 160) / (440 - 160)) * 100))

      let status: 'OPTIMAL' | 'STRETCHING' | 'CRITICAL' = 'OPTIMAL'
      if (distance > 380) {
        status = 'CRITICAL'
        if (!criticalWarningTriggered) {
          criticalWarningTriggered = true
          onOverstretch?.()
        }
        // Emit sparks along the rope when strain is critical
        for (let s = 0; s < 3; s++) {
          const t = Math.random()
          sparks.push({
            x: ship1.position.x + dx * t + (Math.random() - 0.5) * 8,
            y: ship1.position.y + dy * t + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            maxLife: 0.2 + Math.random() * 0.2
          })
        }
      } else if (distance > 240) {
        status = 'STRETCHING'
        criticalWarningTriggered = false
      } else {
        criticalWarningTriggered = false
      }

      setTelemetry((prev) => ({
        ...prev,
        distance: Math.round(distance),
        strainPercent: Math.max(0, strainPercent),
        status
      }))

      // 7. Smooth Lerp Camera Centering
      const midX = (ship1.position.x + ship2.position.x) / 2
      const midY = (ship1.position.y + ship2.position.y) / 2
      camX += (midX - camX) * 0.08
      camY += (midY - camY) * 0.08

      // 8. Render Frame
      ctx.clearRect(0, 0, width, height)

      ctx.save()
      // Center camera
      ctx.translate(width / 2 - camX, height / 2 - camY)

      // Render Parallax Cosmic Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)'
      ctx.lineWidth = 1
      const gridSize = 60
      const startX = Math.floor((camX - width) / gridSize) * gridSize
      const endX = Math.ceil((camX + width) / gridSize) * gridSize
      const startY = Math.floor((camY - height) / gridSize) * gridSize
      const endY = Math.ceil((camY + height) / gridSize) * gridSize

      ctx.beginPath()
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY)
        ctx.lineTo(x, endY)
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
      }
      ctx.stroke()

      // Render Distant Stars
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.a})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2)
        ctx.fill()
      })

      // Render Thruster Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= dt / p.maxLife

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life * 0.8
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // Render Sparks (Critical Strain)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]
        sp.x += sp.vx
        sp.y += sp.vy
        sp.life -= dt / sp.maxLife

        if (sp.life <= 0) {
          sparks.splice(i, 1)
          continue
        }

        ctx.fillStyle = '#FFE600'
        ctx.shadowColor = '#FF2A85'
        ctx.shadowBlur = 10
        ctx.fillRect(sp.x, sp.y, 2.5, 2.5)
        ctx.shadowBlur = 0
      }

      // 9. Render Tether Line
      ctx.save()
      let tetherColor = '#00F0FF'
      let tetherWidth = 3
      let glowBlur = 15

      if (status === 'CRITICAL') {
        const flash = Math.sin(time * 0.03) > 0
        tetherColor = flash ? '#FF2A85' : '#FF0033'
        tetherWidth = 4
        glowBlur = 25
      } else if (status === 'STRETCHING') {
        tetherColor = '#FFE600'
        tetherWidth = 3
        glowBlur = 18
      } else if (isReelActive) {
        tetherColor = '#00F0FF'
        tetherWidth = 4
        glowBlur = 20
      }

      ctx.strokeStyle = tetherColor
      ctx.shadowColor = tetherColor
      ctx.shadowBlur = glowBlur
      ctx.lineWidth = tetherWidth

      ctx.beginPath()
      ctx.moveTo(ship1.position.x, ship1.position.y)
      ctx.lineTo(ship2.position.x, ship2.position.y)
      ctx.stroke()

      // Draw Energy Node at Center of Tether
      const tetherMidX = (ship1.position.x + ship2.position.x) / 2
      const tetherMidY = (ship1.position.y + ship2.position.y) / 2
      ctx.fillStyle = '#FFFFFF'
      ctx.shadowColor = tetherColor
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(tetherMidX, tetherMidY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 10. Render Ship 1: P1 Alpha Pod (Cyan)
      ctx.save()
      ctx.translate(ship1.position.x, ship1.position.y)
      ctx.rotate(ship1.angle)

      ctx.shadowColor = '#00F0FF'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#0B0F19'
      ctx.strokeStyle = '#00F0FF'
      ctx.lineWidth = 2.5

      // Triangular Arrow Hull
      ctx.beginPath()
      ctx.moveTo(SHIP_RADIUS + 4, 0)
      ctx.lineTo(-SHIP_RADIUS + 4, -SHIP_RADIUS + 6)
      ctx.lineTo(-SHIP_RADIUS + 10, 0)
      ctx.lineTo(-SHIP_RADIUS + 4, SHIP_RADIUS - 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Cockpit Glow Core
      ctx.fillStyle = '#00F0FF'
      ctx.beginPath()
      ctx.arc(2, 0, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 11. Render Ship 2: P2 Beta Pod (Pink)
      ctx.save()
      ctx.translate(ship2.position.x, ship2.position.y)
      ctx.rotate(ship2.angle)

      ctx.shadowColor = '#FF2A85'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#0B0F19'
      ctx.strokeStyle = '#FF2A85'
      ctx.lineWidth = 2.5

      // Futuristic Rounded Hull with Wings
      ctx.beginPath()
      ctx.moveTo(SHIP_RADIUS + 4, 0)
      ctx.lineTo(-SHIP_RADIUS + 6, -SHIP_RADIUS + 4)
      ctx.lineTo(-SHIP_RADIUS + 8, 0)
      ctx.lineTo(-SHIP_RADIUS + 6, SHIP_RADIUS - 4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Core Shield Matrix
      ctx.fillStyle = '#FF2A85'
      ctx.beginPath()
      ctx.arc(2, 0, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.restore()
    }

    animId = requestAnimationFrame(renderLoop)

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      World.clear(world, false)
      Engine.clear(engine)
    }
  }, [getLatestInputs, onOverstretch, onTetherSnap])

  return (
    <div ref={containerRef} className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-[#070A12] border border-white/10 shadow-2xl">
      {/* 2D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left Live Telemetry HUD */}
      <div className="pointer-events-none absolute top-4 left-4 z-20 flex flex-col gap-1 rounded-xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md px-3.5 py-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              telemetry.status === 'OPTIMAL'
                ? 'bg-[#00F0FF] animate-pulse'
                : telemetry.status === 'STRETCHING'
                ? 'bg-[#FFE600]'
                : 'bg-[#FF2A85] animate-ping'
            }`}
          />
          <span className="font-['Orbitron'] font-bold text-white text-[11px]">
            TETHER: {telemetry.distance}px
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              telemetry.status === 'OPTIMAL'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                : telemetry.status === 'STRETCHING'
                ? 'bg-[#FFE600]/20 text-[#FFE600]'
                : 'bg-[#FF2A85]/20 text-[#FF2A85]'
            }`}
          >
            {telemetry.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 gap-4 pt-1 border-t border-white/10">
          <span>STRAIN: {telemetry.strainPercent}%</span>
          <span>{telemetry.fps} FPS</span>
        </div>
      </div>

      {/* Top Right Desktop Controls Guide */}
      <div className="pointer-events-none absolute top-4 right-4 z-20 hidden md:flex flex-col gap-1 rounded-xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-2 text-[10px] font-mono text-gray-400">
        <span className="font-['Orbitron'] font-bold text-gray-300">KEYBOARD BACKUP:</span>
        <div className="flex items-center gap-3">
          <span className="text-[#00F0FF]">P1: WASD / Space</span>
          <span>•</span>
          <span className="text-[#FF2A85]">P2: Arrows / Enter</span>
        </div>
      </div>

      {/* Critical Overstretch Warning Overlay */}
      {telemetry.status === 'CRITICAL' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div className="flex items-center gap-2 rounded-xl border border-[#FF2A85]/60 bg-[#FF2A85]/20 px-4 py-2 font-['Orbitron'] text-xs font-black text-[#FF2A85] shadow-[0_0_25px_rgba(255,42,133,0.8)] animate-bounce">
            ⚠️ TETHER STRAIN CRITICAL (&gt;380px) — SLINGSHOT OR REEL NOW!
          </div>
        </div>
      )}
    </div>
  )
}

export default GameCanvas
