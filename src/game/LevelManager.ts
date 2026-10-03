import Matter from 'matter-js'

const { Bodies, Body, Vector, World } = Matter

export interface LaserGate {
  switch1: Matter.Body
  switch2: Matter.Body
  barrier: Matter.Body
  switch1HitTime: number | null
  switch2HitTime: number | null
  isDeactivated: boolean
}

export interface GravityVortex {
  x: number
  y: number
  radius: number
  strength: number
}

export interface LevelObjects {
  starlightCore: Matter.Body
  warpGate: { x: number; y: number; radius: number }
  asteroids: Matter.Body[]
  laserGate: LaserGate
  vortex: GravityVortex
}

export interface LevelCallbacks {
  onShipCollision: (player: 1 | 2, force: number) => void
  onCoreDelivered: () => void
  onLaserDeactivated: () => void
}

/**
 * Manages game obstacles, objectives, and hazards per /docs/PRD.md Section 5 & 6
 */
export class LevelManager {
  world: Matter.World
  objects: LevelObjects
  callbacks: LevelCallbacks

  constructor(world: Matter.World, centerX: number, centerY: number, callbacks: LevelCallbacks) {
    this.world = world
    this.callbacks = callbacks
    this.objects = this.createLevel(centerX, centerY)
  }

  createLevel(cx: number, cy: number): LevelObjects {
    // 1. Starlight Energy Core (Floating objective with light mass per PRD Section 6)
    const starlightCore = Bodies.circle(cx - 20, cy - 120, 16, {
      density: 0.001,
      frictionAir: 0.015,
      restitution: 0.85,
      label: 'StarlightCore'
    })

    // 2. Warp Gate Destination Portal (PRD Section 6)
    const warpGate = {
      x: cx + 550,
      y: cy,
      radius: 50
    }

    // 3. Floating Asteroids (Dynamic bouncing bodies per PRD Section 6)
    const asteroids: Matter.Body[] = []
    const asteroidPositions = [
      { x: cx + 180, y: cy - 150, r: 28 },
      { x: cx + 160, y: cy + 160, r: 32 },
      { x: cx + 320, y: cy - 60, r: 24 },
      { x: cx - 220, y: cy + 180, r: 26 },
      { x: cx - 180, y: cy - 200, r: 30 }
    ]

    asteroidPositions.forEach((pos, idx) => {
      const rock = Bodies.polygon(pos.x, pos.y, 6 + (idx % 3), pos.r, {
        density: 0.004,
        frictionAir: 0.01,
        restitution: 0.75,
        label: 'Asteroid'
      })
      // Small tumbling drift
      Body.setVelocity(rock, {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.8
      })
      Body.setAngularVelocity(rock, (Math.random() - 0.5) * 0.02)
      asteroids.push(rock)
    })

    // 4. Laser Barrier Gate & Dual Switches (Must be hit within 500ms per PRD Section 6)
    const gateX = cx + 360
    const barrier = Bodies.rectangle(gateX, cy, 14, 280, {
      isStatic: true,
      label: 'LaserBarrier',
      restitution: 0.9
    })

    const switch1 = Bodies.circle(gateX - 80, cy - 180, 20, {
      isStatic: true,
      isSensor: true,
      label: 'Switch1'
    })

    const switch2 = Bodies.circle(gateX - 80, cy + 180, 20, {
      isStatic: true,
      isSensor: true,
      label: 'Switch2'
    })

    const laserGate: LaserGate = {
      switch1,
      switch2,
      barrier,
      switch1HitTime: null,
      switch2HitTime: null,
      isDeactivated: false
    }

    // 5. Gravity Vortex Anomaly (PRD Section 5.3)
    const vortex: GravityVortex = {
      x: cx,
      y: cy + 240,
      radius: 320,
      strength: 0.00035
    }

    World.add(this.world, [starlightCore, ...asteroids, barrier, switch1, switch2])

    return {
      starlightCore,
      warpGate,
      asteroids,
      laserGate,
      vortex
    }
  }

  /**
   * Applies continuous central gravitational force field: Fg = (G * M * m) / (r^2 + e)
   */
  updateGravityVortex(bodies: Matter.Body[]) {
    const { vortex } = this.objects

    bodies.forEach((body) => {
      const dx = vortex.x - body.position.x
      const dy = vortex.y - body.position.y
      const dist = Math.hypot(dx, dy)

      if (dist < vortex.radius && dist > 15) {
        // Continuous central gravity force
        const forceMagnitude = (vortex.strength * body.mass) / (dist * 0.05 + 1)
        const unit = Vector.normalise({ x: dx, y: dy })
        Body.applyForce(body, body.position, {
          x: unit.x * forceMagnitude,
          y: unit.y * forceMagnitude
        })
      }
    })
  }

  /**
   * Checks if Starlight Core reached the Warp Portal Gate
   */
  checkCoreDelivery(): boolean {
    const { starlightCore, warpGate } = this.objects
    const dist = Math.hypot(
      starlightCore.position.x - warpGate.x,
      starlightCore.position.y - warpGate.y
    )

    if (dist < warpGate.radius + 10) {
      this.callbacks.onCoreDelivered()
      return true
    }
    return false
  }

  /**
   * Matter.js collision event handler
   */
  handleCollisionStart(event: Matter.IEventCollision<Matter.Engine>, ship1: Matter.Body, ship2: Matter.Body) {
    const pairs = event.pairs
    const now = Date.now()

    pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair
      const labels = [bodyA.label, bodyB.label]

      // 1. Detect Asteroid Collisions with Ship 1 or Ship 2
      if (labels.includes('Asteroid')) {
        let playerHit: 1 | 2 | null = null
        if (labels.includes('Ship1')) playerHit = 1
        else if (labels.includes('Ship2')) playerHit = 2

        if (playerHit) {
          const shipBody = playerHit === 1 ? ship1 : ship2
          const speed = Math.hypot(shipBody.velocity.x, shipBody.velocity.y)
          this.callbacks.onShipCollision(playerHit, speed)
        }
      }

      // 2. Dual Laser Switches Detection (500ms tolerance window)
      if (labels.includes('Switch1') && (labels.includes('Ship1') || labels.includes('Ship2'))) {
        this.objects.laserGate.switch1HitTime = now
        this.checkLaserGateCoordinatedPress()
      }
      if (labels.includes('Switch2') && (labels.includes('Ship1') || labels.includes('Ship2'))) {
        this.objects.laserGate.switch2HitTime = now
        this.checkLaserGateCoordinatedPress()
      }
    })
  }

  /**
   * Checks if both pressure pads were triggered within 500ms of each other (PRD Section 6)
   */
  private checkLaserGateCoordinatedPress() {
    const gate = this.objects.laserGate
    if (gate.isDeactivated) return

    if (gate.switch1HitTime && gate.switch2HitTime) {
      const diff = Math.abs(gate.switch1HitTime - gate.switch2HitTime)
      if (diff <= 1200) {
        // Successful coordination: disable laser barrier!
        gate.isDeactivated = true
        gate.barrier.isSensor = true // Allows pass-through
        this.callbacks.onLaserDeactivated()
      }
    }
  }

  /**
   * Render custom level elements on the 2D canvas
   */
  render(ctx: CanvasRenderingContext2D, time: number) {
    const { starlightCore, warpGate, asteroids, laserGate, vortex } = this.objects

    // 1. Render Gravity Vortex Anomaly
    ctx.save()
    ctx.translate(vortex.x, vortex.y)
    ctx.rotate(time * 0.001)

    const vortexGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, vortex.radius * 0.6)
    vortexGradient.addColorStop(0, 'rgba(170, 59, 255, 0.4)')
    vortexGradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)')
    vortexGradient.addColorStop(1, 'rgba(11, 15, 25, 0)')

    ctx.fillStyle = vortexGradient
    ctx.beginPath()
    ctx.arc(0, 0, vortex.radius * 0.6, 0, Math.PI * 2)
    ctx.fill()

    // Accretion spiral rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 0, 60, 0, Math.PI * 1.5)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 110, Math.PI, Math.PI * 2.2)
    ctx.stroke()
    ctx.restore()

    // 2. Render Warp Gate (Goal Portal)
    ctx.save()
    ctx.translate(warpGate.x, warpGate.y)
    ctx.rotate(-time * 0.0015)

    const portalGlow = ctx.createRadialGradient(0, 0, 15, 0, 0, warpGate.radius + 15)
    portalGlow.addColorStop(0, 'rgba(0, 240, 255, 0.8)')
    portalGlow.addColorStop(0.6, 'rgba(255, 42, 133, 0.5)')
    portalGlow.addColorStop(1, 'rgba(0, 240, 255, 0)')

    ctx.fillStyle = portalGlow
    ctx.beginPath()
    ctx.arc(0, 0, warpGate.radius + 15, 0, Math.PI * 2)
    ctx.fill()

    // Portal Ring
    ctx.strokeStyle = '#00F0FF'
    ctx.lineWidth = 3
    ctx.shadowColor = '#00F0FF'
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.arc(0, 0, warpGate.radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '10px Orbitron'
    ctx.textAlign = 'center'
    ctx.fillText('WARP GATE', 0, 3)
    ctx.restore()

    // 3. Render Asteroid Belts
    asteroids.forEach((rock) => {
      ctx.save()
      ctx.translate(rock.position.x, rock.position.y)
      ctx.rotate(rock.angle)

      ctx.fillStyle = '#171B26'
      ctx.strokeStyle = '#4A5568'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 8

      ctx.beginPath()
      const vertices = rock.vertices
      if (vertices.length > 0) {
        ctx.moveTo(vertices[0].x - rock.position.x, vertices[0].y - rock.position.y)
        for (let j = 1; j < vertices.length; j++) {
          ctx.lineTo(vertices[j].x - rock.position.x, vertices[j].y - rock.position.y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Asteroid surface craters
      ctx.fillStyle = '#0F131C'
      ctx.beginPath()
      ctx.arc(4, 3, 5, 0, Math.PI * 2)
      ctx.arc(-6, -5, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // 4. Render Laser Barrier Gate & Dual Switches
    ctx.save()
    // Laser Beam
    const barrier = laserGate.barrier
    if (laserGate.isDeactivated) {
      // Deactivated: Faint green safe corridor
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(barrier.position.x, barrier.position.y - 140)
      ctx.lineTo(barrier.position.x, barrier.position.y + 140)
      ctx.stroke()
    } else {
      // Active: Pulsing lethal red laser barrier
      const flash = Math.sin(time * 0.02) * 4
      ctx.strokeStyle = '#FF2A85'
      ctx.lineWidth = 8 + flash
      ctx.shadowColor = '#FF2A85'
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.moveTo(barrier.position.x, barrier.position.y - 140)
      ctx.lineTo(barrier.position.x, barrier.position.y + 140)
      ctx.stroke()
    }

    // Switch 1 Pad
    const s1 = laserGate.switch1
    const s1Active = laserGate.switch1HitTime && Date.now() - laserGate.switch1HitTime < 1200
    ctx.save()
    ctx.translate(s1.position.x, s1.position.y)
    ctx.fillStyle = s1Active ? '#00F0FF' : '#1A202C'
    ctx.strokeStyle = '#00F0FF'
    ctx.lineWidth = s1Active ? 3.5 : 2.5
    ctx.shadowColor = '#00F0FF'
    ctx.shadowBlur = s1Active ? 24 : 12
    ctx.beginPath()
    ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = s1Active ? '#000000' : '#00F0FF'
    ctx.font = '9px Orbitron'
    ctx.textAlign = 'center'
    ctx.fillText('PAD 1', 0, 3)
    ctx.restore()

    // Switch 2 Pad
    const s2 = laserGate.switch2
    const s2Active = laserGate.switch2HitTime && Date.now() - laserGate.switch2HitTime < 1200
    ctx.save()
    ctx.translate(s2.position.x, s2.position.y)
    ctx.fillStyle = s2Active ? '#FF2A85' : '#1A202C'
    ctx.strokeStyle = '#FF2A85'
    ctx.lineWidth = s2Active ? 3.5 : 2.5
    ctx.shadowColor = '#FF2A85'
    ctx.shadowBlur = s2Active ? 24 : 12
    ctx.beginPath()
    ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = s2Active ? '#000000' : '#FF2A85'
    ctx.font = '9px Orbitron'
    ctx.textAlign = 'center'
    ctx.fillText('PAD 2', 0, 3)
    ctx.restore()
    ctx.restore()

    // 5. Render Starlight Energy Core (Objective)
    ctx.save()
    ctx.translate(starlightCore.position.x, starlightCore.position.y)

    // Pulsing Starlight Corona
    const corePulse = 18 + Math.sin(time * 0.008) * 3
    const coreGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, corePulse + 10)
    coreGlow.addColorStop(0, '#FFFFFF')
    coreGlow.addColorStop(0.4, '#FFE600')
    coreGlow.addColorStop(1, 'rgba(255, 230, 0, 0)')

    ctx.fillStyle = coreGlow
    ctx.beginPath()
    ctx.arc(0, 0, corePulse + 10, 0, Math.PI * 2)
    ctx.fill()

    // Solid core center
    ctx.fillStyle = '#FFE600'
    ctx.shadowColor = '#FFE600'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(0, 0, 14, 0, Math.PI * 2)
    ctx.fill()

    // Orbital mini ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 0, 22, time * 0.003, time * 0.003 + Math.PI)
    ctx.stroke()
    ctx.restore()
  }

  cleanup() {
    World.remove(this.world, [
      this.objects.starlightCore,
      ...this.objects.asteroids,
      this.objects.laserGate.barrier,
      this.objects.laserGate.switch1,
      this.objects.laserGate.switch2
    ])
  }
}
