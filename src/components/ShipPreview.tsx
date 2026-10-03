import React, { useEffect, useRef } from 'react'
import { type ShipShape } from '../types/network'
import { drawShipHull } from '../utils/shipRenderers'

interface ShipPreviewProps {
  shape: ShipShape
  color?: string
  size?: number
  isAnimated?: boolean
  className?: string
}

export const ShipPreview: React.FC<ShipPreviewProps> = ({
  shape,
  color = '#00F0FF',
  size = 64,
  isAnimated = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const render = (time: number) => {
      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.translate(size / 2, size / 2)
      // Slight floating wobble
      if (isAnimated) {
        ctx.rotate(-Math.PI / 2 + Math.sin(time * 0.003) * 0.08)
      } else {
        ctx.rotate(-Math.PI / 2) // Point upwards
      }

      drawShipHull(ctx, shape, color, size * 0.38, time, false)
      ctx.restore()

      if (isAnimated) {
        animId = requestAnimationFrame(render)
      }
    }

    if (isAnimated) {
      animId = requestAnimationFrame(render)
    } else {
      render(0)
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [shape, color, size, isAnimated])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`block pointer-events-none ${className}`}
    />
  )
}
