import { type ShipShape } from '../types/network'

/**
 * Procedural Vector Renderers for the 6 Spacecraft Hulls
 * Zero-asset, high performance canvas rendering
 */
export const drawShipHull = (
  ctx: CanvasRenderingContext2D,
  shape: ShipShape = 'dart',
  color: string = '#00F0FF',
  radius: number = 24,
  time: number = 0,
  isThrusting: boolean = false
) => {
  ctx.save()

  // Base glowing hull strokes
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.fillStyle = '#080D1A'
  ctx.shadowColor = color
  ctx.shadowBlur = 14

  switch (shape) {
    case 'dart': {
      // 1. Apex Dart (Supersonic Interceptor)
      ctx.beginPath()
      ctx.moveTo(radius * 1.2, 0) // Sharp nose
      ctx.lineTo(-radius * 0.7, -radius * 0.85) // Wingtip left
      ctx.lineTo(-radius * 0.35, -radius * 0.3) // Inner wing joint
      ctx.lineTo(-radius * 0.8, -radius * 0.2) // Left thruster fin
      ctx.lineTo(-radius * 0.6, 0) // Center thruster
      ctx.lineTo(-radius * 0.8, radius * 0.2) // Right thruster fin
      ctx.lineTo(-radius * 0.35, radius * 0.3) // Inner wing joint
      ctx.lineTo(-radius * 0.7, radius * 0.85) // Wingtip right
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Cockpit canopy
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(radius * 0.5, 0)
      ctx.lineTo(-radius * 0.1, -radius * 0.2)
      ctx.lineTo(-radius * 0.1, radius * 0.2)
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'manta': {
      // 2. Cosmic Manta (Bio-Aerodynamic Curved Ray)
      ctx.beginPath()
      ctx.moveTo(radius * 1.05, 0) // Rounded nose
      ctx.bezierCurveTo(radius * 0.6, -radius * 0.7, 0, -radius * 1.1, -radius * 0.7, -radius * 0.9)
      ctx.quadraticCurveTo(-radius * 0.4, -radius * 0.2, -radius * 0.85, 0)
      ctx.quadraticCurveTo(-radius * 0.4, radius * 0.2, -radius * 0.7, radius * 0.9)
      ctx.bezierCurveTo(0, radius * 1.1, radius * 0.6, radius * 0.7, radius * 1.05, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Center spine bioluminescence
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(radius * 0.7, 0)
      ctx.lineTo(-radius * 0.5, 0)
      ctx.stroke()
      break
    }

    case 'ring': {
      // 3. Quantum Ring (Torus Ring with Suspended Antimatter Core)
      // Outer Ring
      ctx.beginPath()
      ctx.ellipse(0, 0, radius * 0.95, radius * 0.75, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Inner hollow void
      ctx.fillStyle = '#060911'
      ctx.beginPath()
      ctx.ellipse(0, 0, radius * 0.55, radius * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Dual forward emitter horns
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(radius * 0.9, -radius * 0.3, 3, 0, Math.PI * 2)
      ctx.arc(radius * 0.9, radius * 0.3, 3, 0, Math.PI * 2)
      ctx.fill()

      // Floating spinning core particle
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(Math.cos(time * 0.005) * 5, Math.sin(time * 0.005) * 3, 4, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'saucer': {
      // 4. Retro Saucer (Pulsing Neon UFO)
      // Disk hull
      ctx.beginPath()
      ctx.ellipse(0, 0, radius * 1.05, radius * 0.65, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Central neon dome
      const domeGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.45)
      domeGlow.addColorStop(0, '#FFFFFF')
      domeGlow.addColorStop(0.7, color)
      domeGlow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = domeGlow
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2)
      ctx.fill()

      // Rotating rim running lights
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < 4; i++) {
        const a = time * 0.003 + (i * Math.PI) / 2
        const lx = Math.cos(a) * (radius * 0.85)
        const ly = Math.sin(a) * (radius * 0.5)
        ctx.beginPath()
        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'scarab': {
      // 5. Cyber Scarab (Industrial Mecha Fighter with Twin Pincers)
      ctx.beginPath()
      // Pincer Left
      ctx.moveTo(radius * 1.1, -radius * 0.45)
      ctx.lineTo(radius * 0.6, -radius * 0.25)
      ctx.lineTo(radius * 0.7, -radius * 0.7)
      ctx.lineTo(radius * 0.2, -radius * 0.85)
      // Armored flanks
      ctx.lineTo(-radius * 0.7, -radius * 0.65)
      ctx.lineTo(-radius * 0.85, 0)
      ctx.lineTo(-radius * 0.7, radius * 0.65)
      ctx.lineTo(radius * 0.2, radius * 0.85)
      ctx.lineTo(radius * 0.7, radius * 0.7)
      ctx.lineTo(radius * 0.6, radius * 0.25)
      // Pincer Right
      ctx.lineTo(radius * 1.1, radius * 0.45)
      ctx.lineTo(radius * 0.4, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Mecha Visor slit
      ctx.fillStyle = '#FFE600'
      ctx.fillRect(radius * 0.1, -radius * 0.25, 4, radius * 0.5)
      break
    }

    case 'jelly': {
      // 6. Star Jelly (Mystic Crystalline Bio-Cephalopod)
      const wave = Math.sin(time * 0.006) * 3

      ctx.beginPath()
      // Dome head
      ctx.arc(radius * 0.3, 0, radius * 0.75, -Math.PI / 2, Math.PI / 2)
      // Tentacle 1 (top)
      ctx.quadraticCurveTo(-radius * 0.3, radius * 0.7, -radius * 1.1, radius * 0.4 + wave)
      ctx.quadraticCurveTo(-radius * 0.5, radius * 0.2, -radius * 0.3, 0)
      // Tentacle 2 (bottom)
      ctx.quadraticCurveTo(-radius * 0.5, -radius * 0.2, -radius * 1.1, -radius * 0.4 - wave)
      ctx.quadraticCurveTo(-radius * 0.3, -radius * 0.7, radius * 0.3, -radius * 0.75)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Glowing bio-eye
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(radius * 0.5, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }

  // Anchor tether pivot point
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(0, 0, 3, 0, Math.PI * 2)
  ctx.fill()

  // Extra afterburner flare if thrusting
  if (isThrusting) {
    ctx.strokeStyle = '#FFE600'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-radius * 0.8, -radius * 0.2)
    ctx.lineTo(-radius * 1.3 - Math.random() * 6, 0)
    ctx.lineTo(-radius * 0.8, radius * 0.2)
    ctx.stroke()
  }

  ctx.restore()
}

export const ALL_SHIP_SHAPES: ShipShape[] = ['dart', 'manta', 'ring', 'saucer', 'scarab', 'jelly']
