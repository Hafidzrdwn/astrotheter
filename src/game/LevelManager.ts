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

export interface EnergyCrystal {
  id: number
  x: number
  y: number
  radius: number
  collected: boolean
}

export interface GravityMoon {
  x: number
  y: number
  radius: number
  gravityRadius: number
  strength: number
}

export interface IonNebula {
  x: number
  y: number
  radius: number
  color: string
}

export interface LevelObjects {
  starlightCore: Matter.Body
  warpGate: { x: number; y: number; radius: number }
  asteroids: Matter.Body[]
  laserGate: LaserGate
  vortex: GravityVortex
  crystals: EnergyCrystal[]
  gravityMoons: GravityMoon[]
  ionNebulae: IonNebula[]
}

export interface LevelCallbacks {
  onShipCollision: (player: 1 | 2, force: number) => void
  onCoreDelivered: () => void
  onLaserDeactivated: () => void
  onCrystalCollected?: (crystal: EnergyCrystal) => void
}

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Manages procedural level obstacles, hazards, and collectibles
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
    // 1. Starlight Energy Core (Floating in randomized orbital quadrant)
    const coreAngle = (Math.random() * 0.8 + 0.6) * Math.PI // Upper quadrant
    const coreDist = 380 + Math.random() * 160
    const coreX = cx + Math.cos(coreAngle) * coreDist
    const coreY = cy + Math.sin(coreAngle) * coreDist

    const starlightCore = Bodies.circle(coreX, coreY, 18, {
      density: 0.001,
      frictionAir: 0.015,
      restitution: 0.85,
      label: 'StarlightCore'
    })

    // 2. Warp Gate Destination Portal (Positioned 820-950px away on opposite wing)
    const warpDist = 820 + Math.random() * 120
    const warpAngle = (Math.random() - 0.5) * 0.5 // Generally to the right
    const warpGate = {
      x: cx + Math.cos(warpAngle) * warpDist,
      y: cy + Math.sin(warpAngle) * warpDist,
      radius: 54
    }

    // 3. Laser Barrier Gate & Dual Switches (Placed between starting point and warp gate)
    const gateX = cx + 460 + (Math.random() - 0.5) * 60
    const gateY = cy + (Math.random() - 0.5) * 80
    const barrier = Bodies.rectangle(gateX, gateY, 14, 300, {
      isStatic: true,
      label: 'LaserBarrier',
      restitution: 0.9
    })

    const switch1 = Bodies.circle(gateX - 90, gateY - 210, 22, {
      isStatic: true,
      isSensor: true,
      label: 'Switch1'
    })

    const switch2 = Bodies.circle(gateX - 90, gateY + 210, 22, {
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

    // 4. Gravity Vortex Anomaly
    const vortex: GravityVortex = {
      x: cx - 180,
      y: cy + 320,
      radius: 360,
      strength: 0.00035
    }

    // 5. Gravity Slingshot Moon (Dense celestial body with orbital pull ring)
    const gravityMoons: GravityMoon[] = [
      {
        x: cx + 220,
        y: cy - 320,
        radius: 38,
        gravityRadius: 260,
        strength: 0.0004
      }
    ]

    // 6. Ion Nebulae (Cosmic acceleration cloud zones)
    const ionNebulae: IonNebula[] = [
      { x: cx + 120, y: cy + 180, radius: 140, color: 'rgba(0, 240, 255, 0.12)' },
      { x: cx + 640, y: cy - 140, radius: 160, color: 'rgba(255, 42, 133, 0.12)' }
    ]

    // 7. Collectible Energy Crystals (+5% Synergy bonus)
    const crystals: EnergyCrystal[] = [
      { id: 1, x: cx + 80, y: cy - 240, radius: 12, collected: false },
      { id: 2, x: cx - 220, y: cy - 160, radius: 12, collected: false },
      { id: 3, x: cx + 340, y: cy + 240, radius: 12, collected: false },
      { id: 4, x: cx + 580, y: cy + 160, radius: 12, collected: false },
      { id: 5, x: cx + 720, y: cy - 260, radius: 12, collected: false }
    ]

    // 8. Floating Asteroids (12 dynamic bouncing rocks spread across the sector)
    const asteroids: Matter.Body[] = []
    const asteroidSpawns = [
      { x: cx + 260, y: cy - 120, r: 28 },
      { x: cx + 240, y: cy + 190, r: 32 },
      { x: cx + 420, y: cy - 80, r: 24 },
      { x: cx - 280, y: cy + 140, r: 26 },
      { x: cx - 210, y: cy - 260, r: 30 },
      { x: cx + 520, y: cy - 280, r: 28 },
      { x: cx + 620, y: cy + 220, r: 34 },
      { x: cx + 760, y: cy + 90, r: 26 },
      { x: cx - 120, y: cy + 340, r: 30 },
      { x: cx + 380, y: cy + 380, r: 28 },
      { x: cx - 360, y: cy - 80, r: 25 },
      { x: cx + 180, y: cy - 380, r: 27 }
    ]

    asteroidSpawns.forEach((pos, idx) => {
      const rock = Bodies.polygon(pos.x, pos.y, 5 + (idx % 4), pos.r, {
        density: 0.004,
        frictionAir: 0.01,
        restitution: 0.75,
        label: 'Asteroid'
      })
      Body.setVelocity(rock, {
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.6
      })
      Body.setAngularVelocity(rock, (Math.random() - 0.5) * 0.015)
      asteroids.push(rock)
    })

    World.add(this.world, [starlightCore, ...asteroids, barrier, switch1, switch2])

    return {
      starlightCore,
      warpGate,
      asteroids,
      laserGate,
      vortex,
      crystals,
      gravityMoons,
      ionNebulae
    }
  }

  /**
   * Applies continuous gravitational forces from Vortex and Gravity Moons
   */
  updateGravityVortex(bodies: Matter.Body[]) {
    const { vortex, gravityMoons } = this.objects

    bodies.forEach((body) => {
      // 1. Central Vortex pull
      const dx = vortex.x - body.position.x
      const dy = vortex.y - body.position.y
      const dist = Math.hypot(dx, dy)

      if (dist < vortex.radius && dist > 15) {
        const forceMagnitude = (vortex.strength * body.mass) / (dist * 0.05 + 1)
        const unit = Vector.normalise({ x: dx, y: dy })
        Body.applyForce(body, body.position, {
          x: unit.x * forceMagnitude,
          y: unit.y * forceMagnitude
        })
      }

      // 2. Gravity Moon orbital pulls
      gravityMoons.forEach((moon) => {
        const mdx = moon.x - body.position.x
        const mdy = moon.y - body.position.y
        const mdist = Math.hypot(mdx, mdy)

        if (mdist < moon.gravityRadius && mdist > moon.radius) {
          const mforce = (moon.strength * body.mass) / (mdist * 0.04 + 1)
          const munit = Vector.normalise({ x: mdx, y: mdy })
          Body.applyForce(body, body.position, {
            x: munit.x * mforce,
            y: munit.y * mforce
          })
        }
      })
    })
  }

  /**
   * Checks collectible energy crystal triggers with ships and tether
   */
  checkCrystals(ship1Pos: { x: number; y: number }, ship2Pos: { x: number; y: number }) {
    const { crystals } = this.objects

    crystals.forEach((c) => {
      if (c.collected) return

      // Distance to Ship 1
      const d1 = Math.hypot(c.x - ship1Pos.x, c.y - ship1Pos.y)
      // Distance to Ship 2
      const d2 = Math.hypot(c.x - ship2Pos.x, c.y - ship2Pos.y)

      if (d1 < 36 || d2 < 36) {
        c.collected = true
        this.callbacks.onCrystalCollected?.(c)
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

    if (dist < warpGate.radius + 15) {
      this.callbacks.onCoreDelivered()
      return true
    }
    return false
  }

  /**
   * Collision event listener
   */
  handleCollisionStart(
    event: Matter.IEventCollision<Matter.Engine>,
    ship1: Matter.Body,
    ship2: Matter.Body
  ) {
    const pairs = event.pairs
    const now = Date.now()

    pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair
      const labels = [bodyA.label, bodyB.label]

      // Detect Asteroid Collisions
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

      // Dual Laser Switches Detection
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

  private checkLaserGateCoordinatedPress() {
    const gate = this.objects.laserGate
    if (gate.isDeactivated) return

    if (gate.switch1HitTime && gate.switch2HitTime) {
      const diff = Math.abs(gate.switch1HitTime - gate.switch2HitTime)
      if (diff <= 1200) {
        gate.isDeactivated = true
        gate.barrier.isSensor = true
        this.callbacks.onLaserDeactivated()
      }
    }
  }

  /**
   * Render custom level elements on the 2D canvas with spatial culling
   */
  render(ctx: CanvasRenderingContext2D, time: number, viewport?: ViewportBounds) {
    const { starlightCore, warpGate, asteroids, laserGate, vortex, crystals, gravityMoons, ionNebulae } = this.objects

    const isVisible = (x: number, y: number, r: number = 50) => {
      if (!viewport) return true
      return x + r >= viewport.minX && x - r <= viewport.maxX && y + r >= viewport.minY && y - r <= viewport.maxY
    }

    // 1. Render Ion Nebulae (Speed drift zones)
    ionNebulae.forEach((neb) => {
      if (!isVisible(neb.x, neb.y, neb.radius)) return
      ctx.save()
      const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.radius)
      grad.addColorStop(0, neb.color)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 2. Render Gravity Slingshot Moons
    gravityMoons.forEach((moon) => {
      if (!isVisible(moon.x, moon.y, moon.gravityRadius)) return
      ctx.save()
      ctx.translate(moon.x, moon.y)

      // Orbital gravity ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(0, 0, moon.gravityRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Moon body
      ctx.fillStyle = '#1E293B'
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, moon.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Moon craters
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      ctx.arc(-8, -6, 8, 0, Math.PI * 2)
      ctx.arc(10, 8, 6, 0, Math.PI * 2)
      ctx.arc(-6, 12, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // 3. Render Collectible Starlight Crystals
    crystals.forEach((c) => {
      if (c.collected || !isVisible(c.x, c.y, c.radius + 20)) return
      ctx.save()
      ctx.translate(c.x, c.y)
      const pulse = Math.sin(time * 0.005 + c.id) * 3

      // Glowing crystal diamond
      ctx.fillStyle = '#00F0FF'
      ctx.shadowColor = '#00F0FF'
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.moveTo(0, -(c.radius + pulse))
      ctx.lineTo(c.radius * 0.7, 0)
      ctx.lineTo(0, c.radius + pulse)
      ctx.lineTo(-c.radius * 0.7, 0)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 4. Render Gravity Vortex Anomaly
    if (isVisible(vortex.x, vortex.y, vortex.radius)) {
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
      ctx.restore()
    }

    // 5. Render Warp Gate
    if (isVisible(warpGate.x, warpGate.y, warpGate.radius + 30)) {
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
    }

    // 6. Render Asteroids with Culling
    asteroids.forEach((rock) => {
      if (!isVisible(rock.position.x, rock.position.y, 45)) return
      ctx.save()
      ctx.translate(rock.position.x, rock.position.y)
      ctx.rotate(rock.angle)

      ctx.fillStyle = '#171B26'
      ctx.strokeStyle = '#4A5568'
      ctx.lineWidth = 2

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

      ctx.restore()
    })

    // 7. Render Laser Barrier Gate & Switches
    const barrier = laserGate.barrier
    if (isVisible(barrier.position.x, barrier.position.y, 180)) {
      ctx.save()
      if (laserGate.isDeactivated) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(barrier.position.x, barrier.position.y - 150)
        ctx.lineTo(barrier.position.x, barrier.position.y + 150)
        ctx.stroke()
      } else {
        const flash = Math.sin(time * 0.02) * 3
        ctx.strokeStyle = '#FF2A85'
        ctx.lineWidth = 7 + flash
        ctx.shadowColor = '#FF2A85'
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.moveTo(barrier.position.x, barrier.position.y - 150)
        ctx.lineTo(barrier.position.x, barrier.position.y + 150)
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
      ctx.shadowBlur = s1Active ? 20 : 10
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
      ctx.shadowBlur = s2Active ? 20 : 10
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
    }

    // 8. Render Starlight Energy Core (Objective)
    if (isVisible(starlightCore.position.x, starlightCore.position.y, 40)) {
      ctx.save()
      ctx.translate(starlightCore.position.x, starlightCore.position.y)

      const corePulse = 18 + Math.sin(time * 0.008) * 3
      const coreGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, corePulse + 10)
      coreGlow.addColorStop(0, '#FFFFFF')
      coreGlow.addColorStop(0.4, '#FFE600')
      coreGlow.addColorStop(1, 'rgba(255, 230, 0, 0)')

      ctx.fillStyle = coreGlow
      ctx.beginPath()
      ctx.arc(0, 0, corePulse + 10, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFE600'
      ctx.shadowColor = '#FFE600'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(0, 0, 14, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, 22, time * 0.003, time * 0.003 + Math.PI)
      ctx.stroke()
      ctx.restore()
    }
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
