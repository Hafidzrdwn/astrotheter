import React, { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { type ControllerInputPayload } from '../types/network'
import { LevelManager } from '../game/LevelManager'
import { useCoupleSynergy, type CoupleSynergyResult } from '../hooks/useCoupleSynergy'
import { playTone, playWarpLaunchSequence } from '../utils/audio'
import { SoundFX } from '../utils/SoundFX'
import { GameOverModal, type FlightPoint } from './GameOverModal'
import { useLanguage } from '../context/LanguageContext'
import { HowToWinModal } from './HowToWinModal'
import { MissionTracker } from './MissionTracker'
import { MiniMap, type RadarEntity } from './MiniMap'

const { Engine, World, Bodies, Body, Constraint, Events } = Matter

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
  onCollisionFeedback?: (player: 1 | 2) => void
  onStageCompleted?: (result: CoupleSynergyResult) => void
  onReturnToLobby?: () => void
  isP2Simulated?: boolean
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  getLatestInputs,
  onTetherSnap,
  onOverstretch,
  onCollisionFeedback,
  onStageCompleted,
  onReturnToLobby,
  isP2Simulated = false
}) => {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Diagnostics state for telemetry overlay
  const [telemetry, setTelemetry] = useState({
    distance: 160,
    strainPercent: 0,
    fps: 60,
    status: 'OPTIMAL' as 'OPTIMAL' | 'STRETCHING' | 'CRITICAL',
    laserDeactivated: false,
    coreDistanceToWarp: 600
  })

  // Couple synergy calculation hook (PRD Section 8)
  const {
    currentScore: liveSynergyScore,
    recordTick,
    recordCollision,
    evaluateFinalSynergy,
    resetMetrics
  } = useCoupleSynergy()

  // Game over modal state (9:16 vertical card)
  const [gameOverResult, setGameOverResult] = useState<{
    outcome: 'VICTORY' | 'DEFEAT'
    result: CoupleSynergyResult
  } | null>(null)

  // Rematch trigger counter (resets game world cleanly without reloading page or dropping WebRTC)
  const [rematchCount, setRematchCount] = useState(0)

  // Mission objectives, guidance & radar state
  const [isHowToWinOpen, setIsHowToWinOpen] = useState(false)
  const [isCoreCaptured, setIsCoreCaptured] = useState(false)
  const [isStageDoneState, setIsStageDoneState] = useState(false)
  const [activeBanner, setActiveBanner] = useState<string | null>(null)
  const [radarData, setRadarData] = useState<{
    ship1: RadarEntity
    ship2: RadarEntity
    core: RadarEntity
    warpGate: { x: number; y: number; radius: number }
    laserGate: {
      isDeactivated: boolean
      x: number
      y: number
      switch1: RadarEntity
      switch2: RadarEntity
    }
    asteroids: RadarEntity[]
  } | null>(null)

  const isCoreCapturedRef = useRef(false)
  const hasAnnouncedCoreRef = useRef(false)
  const hasAnnouncedWarpRef = useRef(false)

  // Recorded flight path trails for post-game route mapping
  const ship1PathRef = useRef<FlightPoint[]>([])
  const ship2PathRef = useRef<FlightPoint[]>([])

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

    // Reset telemetry metrics & flight trails for fresh match
    resetMetrics()
    ship1PathRef.current = []
    ship2PathRef.current = []

    // Start procedural engine hum
    SoundFX.startEngineHum()

    // Setup Canvas dimensions
    let width = (canvas.width = container.clientWidth || 900)
    let height = (canvas.height = container.clientHeight || 500)

    const handleResize = () => {
      if (!container || !canvas) return
      width = canvas.width = container.clientWidth
      height = canvas.height = container.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // 1. Matter.js Physics Engine Setup (Zero Gravity Space per PRD Section 5)
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

    // Level Obstacles & Hazards Manager (PRD Section 5 & 6)
    let isStageDone = false
    const levelManager = new LevelManager(world, width / 2, height / 2, {
      onShipCollision: (player, _force) => {
        recordCollision()
        SoundFX.playCollisionHit(true)
        onCollisionFeedback?.(player)
      },
      onLaserDeactivated: () => {
        playTone(880, 'sine', 0.2, 0.2)
        setTelemetry((prev) => ({ ...prev, laserDeactivated: true }))
        setActiveBanner(t('bannerLaserOpen'))
        setTimeout(() => setActiveBanner(null), 3500)
      },
      onCoreDelivered: () => {
        if (isStageDone) return
        isStageDone = true
        setIsStageDoneState(true)
        SoundFX.stopEngineHum()
        SoundFX.playSuccessArpeggio()
        playWarpLaunchSequence()
        const result = evaluateFinalSynergy()
        setGameOverResult({ outcome: 'VICTORY', result })
        onStageCompleted?.(result)
      }
    })

    // Matter.js collision listener
    const collisionListener = (event: Matter.IEventCollision<Matter.Engine>) => {
      levelManager.handleCollisionStart(event, ship1, ship2)
    }
    Events.on(engine, 'collisionStart', collisionListener)

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
    let wasReelOrBoostActive = false
    let recordCounter = 0

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

      // P2 Inputs: Mobile controller, Keyboard Arrow keys, or Solo Bot Auto-Pilot
      let p2Steer = inputs[2]?.st ?? 0
      let p2Thrust = inputs[2]?.th ?? 0
      let p2Reel = inputs[2]?.re ?? false
      let p2Boost = inputs[2]?.bo ?? false

      const isArrowKeyPressed =
        Boolean(keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown'] || keys['Enter'])

      if (keys['ArrowLeft']) p2Steer = -1.0
      if (keys['ArrowRight']) p2Steer = 1.0
      if (keys['ArrowUp']) p2Thrust = 1.0
      if (keys['ArrowDown']) p2Reel = true
      if (keys['Enter']) p2Boost = true

      // Intelligent Co-Pilot Auto-Assist when simulated and not manually overridden
      if (isP2Simulated && !inputs[2] && !isArrowKeyPressed) {
        const curDist = Math.hypot(ship2.position.x - ship1.position.x, ship2.position.y - ship1.position.y)
        if (curDist > 250) {
          // Reel in to prevent overstretch
          p2Reel = true
          const angleToP1 = Math.atan2(ship1.position.y - ship2.position.y, ship1.position.x - ship2.position.x)
          const angleDiff = Math.sin(angleToP1 - ship2.angle)
          p2Steer = Math.max(-1, Math.min(1, angleDiff * 2))
          p2Thrust = 0.4
        } else if (curDist < 130) {
          // Push slightly away to maintain tension
          p2Thrust = 0.25
        } else {
          // Smart Co-Pilot target navigation: prioritize Core, then Warp Gate or Switch 2
          let target = levelManager.objects.starlightCore.position
          if (isCoreCapturedRef.current) {
            // Once core is trapped in tether, guide directly towards Warp Gate!
            target = levelManager.objects.warpGate
          } else if (
            !levelManager.objects.laserGate.isDeactivated &&
            Math.hypot(
              ship1.position.x - levelManager.objects.laserGate.switch1.position.x,
              ship1.position.y - levelManager.objects.laserGate.switch1.position.y
            ) < 220
          ) {
            // P1 is near Switch 1! Co-pilot flies towards Switch 2 for coordinated press!
            target = levelManager.objects.laserGate.switch2.position
          }

          const angleToTarget = Math.atan2(target.y - ship2.position.y, target.x - ship2.position.x)
          const angleDiff = Math.sin(angleToTarget - ship2.angle)
          p2Steer = Math.max(-0.8, Math.min(0.8, angleDiff * 1.5))
          p2Thrust = p1Thrust > 0.1 ? 0.35 : 0.18
        }
      }

      // Procedural Audio: Update continuous engine hum pitch & gain
      if (!isStageDone) {
        SoundFX.updateEngineHum(p1Thrust, p2Thrust)
      }

      // Slingshot / Boost Sound Trigger
      const isReelOrBoostActive = p1Reel || p2Reel || p1Boost || p2Boost
      if (isReelOrBoostActive && !wasReelOrBoostActive && !isStageDone) {
        SoundFX.playBoostSlingshot()
      }
      wasReelOrBoostActive = isReelOrBoostActive

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

      // 5. Reel Constraint Behavior (Decrease length by 50% & increase stiffness per PRD Section 5)
      const isReelActive = p1Reel || p2Reel
      if (isReelActive) {
        tether.length = 80 // 50% of 160px
        tether.stiffness = 0.1
      } else {
        tether.length = 160
        tether.stiffness = 0.04
      }

      // 6. Tether Line Segment Shepherding Physics & Trapping Check
      const x1 = ship1.position.x
      const y1 = ship1.position.y
      const x2 = ship2.position.x
      const y2 = ship2.position.y
      const coreBody = levelManager.objects.starlightCore
      const cx = coreBody.position.x
      const cy = coreBody.position.y

      const segDx = x2 - x1
      const segDy = y2 - y1
      const segLenSq = segDx * segDx + segDy * segDy
      let tSeg = 0
      if (segLenSq > 0.001) {
        tSeg = Math.max(0, Math.min(1, ((cx - x1) * segDx + (cy - y1) * segDy) / segLenSq))
      }
      const closestX = x1 + tSeg * segDx
      const closestY = y1 + tSeg * segDy
      const distToTether = Math.hypot(cx - closestX, cy - closestY)

      // Core is considered trapped if between 12% and 88% along tether length and close to line
      const isCurrentlyTrapped = distToTether < 45 && tSeg > 0.12 && tSeg < 0.88
      if (isCurrentlyTrapped !== isCoreCapturedRef.current) {
        isCoreCapturedRef.current = isCurrentlyTrapped
        setIsCoreCaptured(isCurrentlyTrapped)
        if (isCurrentlyTrapped && !hasAnnouncedCoreRef.current) {
          hasAnnouncedCoreRef.current = true
          setActiveBanner(t('bannerCoreTrapped'))
          setTimeout(() => setActiveBanner(null), 3500)
        }
      }

      // Physical elastic push from the tether to the core
      if (distToTether < 28 && distToTether > 0.5) {
        const pushNx = (cx - closestX) / distToTether
        const pushNy = (cy - closestY) / distToTether
        const avgVx = (ship1.velocity.x + ship2.velocity.x) * 0.5
        const avgVy = (ship1.velocity.y + ship2.velocity.y) * 0.5
        Body.applyForce(coreBody, coreBody.position, {
          x: pushNx * 0.0004 + avgVx * 0.0003,
          y: pushNy * 0.0004 + avgVy * 0.0003
        })
      }

      // 7. Update Gravity Vortex Anomaly Field (PRD Section 5.3)
      levelManager.updateGravityVortex([ship1, ship2, coreBody])

      // 8. Check if Starlight Core was delivered
      if (!isStageDone) {
        levelManager.checkCoreDelivery()
      }

      // 9. Step Matter.js Physics Engine
      Engine.update(engine, 1000 / 60)

      // Calculate Tether Distance & Strain
      const dx = ship2.position.x - ship1.position.x
      const dy = ship2.position.y - ship1.position.y
      const distance = Math.hypot(dx, dy)
      const strainPercent = Math.min(100, Math.round(((distance - 160) / (440 - 160)) * 100))

      // Procedural Audio: Tether strain accelerating ping
      if (!isStageDone) {
        SoundFX.updateTetherStrain(distance, 420)
      }

      // Record flight path trails every 8 frames for post-game route mapping
      recordCounter++
      if (recordCounter % 8 === 0 && !isStageDone) {
        ship1PathRef.current.push({ x: ship1.position.x, y: ship1.position.y })
        ship2PathRef.current.push({ x: ship2.position.x, y: ship2.position.y })
      }

      // Record couple synergy metric telemetry
      recordTick(distance, p1Thrust > 0.1 || p1Steer !== 0, p2Thrust > 0.1 || p2Steer !== 0)

      // Critical Tether Snap Defeat Check (> 430px elongation)
      if (distance > 430 && !isStageDone) {
        isStageDone = true
        SoundFX.stopEngineHum()
        SoundFX.playTetherSnap()
        World.remove(world, tether)
        onTetherSnap?.()
        const result = evaluateFinalSynergy()
        setGameOverResult({ outcome: 'DEFEAT', result })
      }

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

      // Calculate core distance to warp gate
      const coreDist = Math.round(
        Math.hypot(
          levelManager.objects.starlightCore.position.x - levelManager.objects.warpGate.x,
          levelManager.objects.starlightCore.position.y - levelManager.objects.warpGate.y
        )
      )

      if (coreDist < 250 && !hasAnnouncedWarpRef.current) {
        hasAnnouncedWarpRef.current = true
        setActiveBanner(t('bannerNearWarp'))
        setTimeout(() => setActiveBanner(null), 3500)
      }

      // Update Tactical Radar telemetry every 6 frames
      if (frameCount % 6 === 0) {
        setRadarData({
          ship1: { x: ship1.position.x, y: ship1.position.y, angle: ship1.angle },
          ship2: { x: ship2.position.x, y: ship2.position.y, angle: ship2.angle },
          core: { x: levelManager.objects.starlightCore.position.x, y: levelManager.objects.starlightCore.position.y },
          warpGate: levelManager.objects.warpGate,
          laserGate: {
            isDeactivated: levelManager.objects.laserGate.isDeactivated,
            x: levelManager.objects.laserGate.barrier.position.x,
            y: levelManager.objects.laserGate.barrier.position.y,
            switch1: { x: levelManager.objects.laserGate.switch1.position.x, y: levelManager.objects.laserGate.switch1.position.y },
            switch2: { x: levelManager.objects.laserGate.switch2.position.x, y: levelManager.objects.laserGate.switch2.position.y }
          },
          asteroids: levelManager.objects.asteroids.map((a) => ({ x: a.position.x, y: a.position.y }))
        })
      }

      setTelemetry((prev) => ({
        ...prev,
        distance: Math.round(distance),
        strainPercent: Math.max(0, strainPercent),
        status,
        coreDistanceToWarp: coreDist
      }))

      // 9. Smooth Lerp Camera Centering
      const midX = (ship1.position.x + ship2.position.x) / 2
      const midY = (ship1.position.y + ship2.position.y) / 2
      camX += (midX - camX) * 0.08
      camY += (midY - camY) * 0.08

      // 10. Render Frame
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

      // Render Level Objects: Warp Gate, Asteroids, Laser Gate, Starlight Core, Vortex
      levelManager.render(ctx, time)

      // 11. Render Particles (Thrusters)
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
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1.0

      // 12. Render Dynamic Tether Rope (Strain-Dependent Color & Glow)
      ctx.beginPath()
      ctx.moveTo(ship1.position.x, ship1.position.y)
      ctx.lineTo(ship2.position.x, ship2.position.y)

      if (status === 'CRITICAL') {
        const isBlink = Math.floor(time / 100) % 2 === 0
        ctx.strokeStyle = isBlink ? '#FF0033' : '#FF2A85'
        ctx.lineWidth = 4.5
        ctx.shadowColor = '#FF0033'
        ctx.shadowBlur = 24
      } else if (status === 'STRETCHING') {
        const pulse = 0.7 + Math.sin(time / 150) * 0.3
        ctx.strokeStyle = `rgba(255, 230, 0, ${pulse})`
        ctx.lineWidth = 3.5
        ctx.shadowColor = '#FFE600'
        ctx.shadowBlur = 16
      } else {
        ctx.strokeStyle = '#00F0FF'
        ctx.lineWidth = 2.5
        ctx.shadowColor = '#00F0FF'
        ctx.shadowBlur = 10
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Render Tension Energy Pulse Node at Midpoint
      const pulseT = (Math.sin(time / 200) + 1) / 2
      const pulseX = ship1.position.x + dx * 0.5
      const pulseY = ship1.position.y + dy * 0.5
      ctx.fillStyle = status === 'CRITICAL' ? '#FF2A85' : '#00F0FF'
      ctx.beginPath()
      ctx.arc(pulseX, pulseY, 3 + pulseT * 3, 0, Math.PI * 2)
      ctx.fill()

      // 13. Render Sparks on Critical Strain
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.life -= dt / s.maxLife

        if (s.life <= 0) {
          sparks.splice(i, 1)
          continue
        }

        ctx.fillStyle = Math.random() > 0.5 ? '#FFE600' : '#FFFFFF'
        ctx.globalAlpha = s.life
        ctx.beginPath()
        ctx.arc(s.x, s.y, Math.random() * 2 + 1, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1.0

      // 14. Render Ship 1: Player 1 (Alpha Pod - Neon Cyan)
      ctx.save()
      ctx.translate(ship1.position.x, ship1.position.y)
      ctx.rotate(ship1.angle)

      // Ship body glow
      ctx.shadowColor = '#00F0FF'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#0B0F19'
      ctx.strokeStyle = '#00F0FF'
      ctx.lineWidth = 2.5

      // Futuristically faceted triangle pod
      ctx.beginPath()
      ctx.moveTo(SHIP_RADIUS + 4, 0)
      ctx.lineTo(-SHIP_RADIUS * 0.75, -SHIP_RADIUS * 0.85)
      ctx.lineTo(-SHIP_RADIUS * 0.45, 0)
      ctx.lineTo(-SHIP_RADIUS * 0.75, SHIP_RADIUS * 0.85)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Cockpit dome
      ctx.fillStyle = '#00F0FF'
      ctx.beginPath()
      ctx.arc(SHIP_RADIUS * 0.2, 0, 5, 0, Math.PI * 2)
      ctx.fill()

      // Tether anchor ring
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // 15. Render Ship 2: Player 2 (Beta Pod - Neon Pink)
      ctx.save()
      ctx.translate(ship2.position.x, ship2.position.y)
      ctx.rotate(ship2.angle)

      ctx.shadowColor = '#FF2A85'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#0B0F19'
      ctx.strokeStyle = '#FF2A85'
      ctx.lineWidth = 2.5

      // Sleek curved aerodynamic pod
      ctx.beginPath()
      ctx.moveTo(SHIP_RADIUS + 4, 0)
      ctx.quadraticCurveTo(-SHIP_RADIUS * 0.3, -SHIP_RADIUS * 0.9, -SHIP_RADIUS * 0.8, -SHIP_RADIUS * 0.5)
      ctx.lineTo(-SHIP_RADIUS * 0.5, 0)
      ctx.lineTo(-SHIP_RADIUS * 0.8, SHIP_RADIUS * 0.5)
      ctx.quadraticCurveTo(-SHIP_RADIUS * 0.3, SHIP_RADIUS * 0.9, SHIP_RADIUS + 4, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Cockpit dome
      ctx.fillStyle = '#FF2A85'
      ctx.beginPath()
      ctx.arc(SHIP_RADIUS * 0.2, 0, 5, 0, Math.PI * 2)
      ctx.fill()

      // Tether anchor ring
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      ctx.restore() // End Camera translation

      // 15. Render Off-Screen Directional Pointers (Screen Space)
      const drawOffscreenPointer = (targetX: number, targetY: number, color: string, label: string) => {
        const screenX = targetX - camX + width / 2
        const screenY = targetY - camY + height / 2
        const margin = 42

        // Only draw if outside screen viewport
        if (screenX < margin || screenX > width - margin || screenY < margin || screenY > height - margin) {
          const angle = Math.atan2(targetY - camY, targetX - camX)
          const dist = Math.round(Math.hypot(targetX - camX, targetY - camY))

          const halfW = width / 2 - margin
          const halfH = height / 2 - margin
          let edgeX = width / 2 + Math.cos(angle) * halfW
          let edgeY = height / 2 + Math.sin(angle) * halfH

          edgeX = Math.max(margin, Math.min(width - margin, edgeX))
          edgeY = Math.max(margin, Math.min(height - margin, edgeY))

          ctx.save()
          ctx.translate(edgeX, edgeY)

          // Pulsing pointer chevron
          ctx.rotate(angle)
          ctx.fillStyle = color
          ctx.shadowColor = color
          ctx.shadowBlur = 14
          ctx.beginPath()
          ctx.moveTo(12, 0)
          ctx.lineTo(-8, -8)
          ctx.lineTo(-4, 0)
          ctx.lineTo(-8, 8)
          ctx.closePath()
          ctx.fill()

          // Distance label text
          ctx.rotate(-angle)
          ctx.font = 'bold 10px Orbitron'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#FFFFFF'
          ctx.shadowColor = '#000000'
          ctx.shadowBlur = 4
          ctx.fillText(`${label} ${dist}m`, 0, angle > 0 ? 18 : -14)
          ctx.restore()
        }
      }

      drawOffscreenPointer(
        levelManager.objects.starlightCore.position.x,
        levelManager.objects.starlightCore.position.y,
        '#FFE600',
        '⭐ CORE'
      )
      drawOffscreenPointer(levelManager.objects.warpGate.x, levelManager.objects.warpGate.y, '#A855F7', '🌀 WARP')
      if (!levelManager.objects.laserGate.isDeactivated) {
        drawOffscreenPointer(
          levelManager.objects.laserGate.barrier.position.x,
          levelManager.objects.laserGate.barrier.position.y,
          '#FF2A85',
          '⚡ GATE'
        )
      }
    }

    animId = requestAnimationFrame(renderLoop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      Events.off(engine, 'collisionStart', collisionListener)
      World.clear(world, false)
      Engine.clear(engine)
      SoundFX.stopEngineHum()
    }
  }, [rematchCount]) // Depend on rematchCount to trigger clean resets

  const handleRematch = () => {
    setGameOverResult(null)
    setIsStageDoneState(false)
    setIsCoreCaptured(false)
    isCoreCapturedRef.current = false
    hasAnnouncedCoreRef.current = false
    hasAnnouncedWarpRef.current = false
    setRematchCount((prev) => prev + 1)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full min-h-[500px] h-[580px] rounded-2xl overflow-hidden bg-[#060911] border border-white/10 shadow-2xl select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Top Telemetry HUD Overlay */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Tether Status Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-2 shadow-lg">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              telemetry.status === 'CRITICAL'
                ? 'bg-red-500 animate-ping'
                : telemetry.status === 'STRETCHING'
                ? 'bg-yellow-400'
                : 'bg-emerald-400'
            }`}
          />
          <span className="font-['Orbitron'] text-[11px] font-bold text-gray-200">
            {t('tetherTension')}: {telemetry.distance}px ({telemetry.strainPercent}%)
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
              telemetry.status === 'CRITICAL'
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : telemetry.status === 'STRETCHING'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {telemetry.status}
          </span>
        </div>

        {/* Live Couple Synergy Meter */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-2 shadow-lg">
          <span className="text-gray-400 font-['Space_Grotesk'] text-[11px]">{t('coupleSynergy')}:</span>
          <span
            className={`font-['Orbitron'] text-sm font-black ${
              liveSynergyScore >= 80
                ? 'text-[#00F0FF]'
                : liveSynergyScore >= 60
                ? 'text-[#FFE600]'
                : 'text-[#FF2A85]'
            }`}
          >
            {liveSynergyScore}%
          </span>
        </div>

        {/* Level Objective & Gate Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-2 shadow-lg">
            <span className="text-[10px] text-gray-400 font-mono">{t('coreDistance')}:</span>
            <span className="font-['Orbitron'] text-xs font-bold text-[#FFE600]">
              {telemetry.coreDistanceToWarp}px
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-md shadow-lg ${
              telemetry.laserDeactivated
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/40 bg-red-500/10 text-red-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="font-['Orbitron'] text-[10px] font-bold">
              {t('laserGate')}: {telemetry.laserDeactivated ? t('laserDeactivated') : t('laserActive')}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic In-Game Event Banner Toast */}
      {activeBanner && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0B0F19]/95 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_25px_rgba(0,240,255,0.4)] animate-bounce font-['Orbitron']">
          <span>{activeBanner}</span>
        </div>
      )}

      {/* Progressive Mission Tracker & Tasks Checklist */}
      <MissionTracker
        isCoreCaptured={isCoreCaptured}
        isLaserDeactivated={telemetry.laserDeactivated}
        isStageDone={isStageDoneState}
        coreDistanceToWarp={telemetry.coreDistanceToWarp}
        onOpenHowToWin={() => setIsHowToWinOpen(true)}
      />

      {/* Tactical Radar / Mini-map */}
      {radarData && (
        <MiniMap
          ship1={radarData.ship1}
          ship2={radarData.ship2}
          core={radarData.core}
          warpGate={radarData.warpGate}
          laserGate={radarData.laserGate}
          asteroids={radarData.asteroids}
        />
      )}

      {/* How to Win Visual Briefing Modal */}
      <HowToWinModal isOpen={isHowToWinOpen} onClose={() => setIsHowToWinOpen(false)} />

      {/* Critical Overstretch Danger HUD Alert */}
      {telemetry.status === 'CRITICAL' && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-500 bg-red-950/80 px-4 py-1.5 text-xs font-black text-red-200 tracking-wider font-['Orbitron'] animate-bounce shadow-[0_0_30px_rgba(255,0,51,0.6)]">
          <span>{t('overstretchWarning')}</span>
        </div>
      )}

      {/* Stylized 9:16 Vertical Card End Screen Modal (Victory or Tether Defeat) */}
      {gameOverResult && (
        <GameOverModal
          outcome={gameOverResult.outcome}
          result={gameOverResult.result}
          ship1Path={ship1PathRef.current}
          ship2Path={ship2PathRef.current}
          onRematch={handleRematch}
          onReturnToLobby={onReturnToLobby}
        />
      )}
    </div>
  )
}

export default GameCanvas
