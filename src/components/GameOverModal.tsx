import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Trophy,
  Skull,
  ArrowsClockwise,
  ArrowLeft,
  Sparkle,
  Heart,
  Timer,
  ShieldWarning,
  Lightning
} from '@phosphor-icons/react'
import { type CoupleSynergyResult } from '../hooks/useCoupleSynergy'
import { useLanguage } from '../context/LanguageContext'
import { AstroLogo } from './AstroLogo'

export interface FlightPoint {
  x: number
  y: number
}

export interface GameOverModalProps {
  outcome: 'VICTORY' | 'DEFEAT'
  result: CoupleSynergyResult
  ship1Path: FlightPoint[]
  ship2Path: FlightPoint[]
  onRematch: () => void
  onReturnToLobby?: () => void
}

/**
 * Stylized 9:16 vertical card summary screen per user requirements
 * Displays time elapsed, Couple Synergy Score, flight path tracking thumbnail,
 * relationship status title, and instant rematch controls without dropping WebRTC.
 */
export const GameOverModal: React.FC<GameOverModalProps> = ({
  outcome,
  result,
  ship1Path,
  ship2Path,
  onRematch,
  onReturnToLobby
}) => {
  const { t } = useLanguage()
  const pathCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isVictory = outcome === 'VICTORY'

  // Dynamic localized relationship title & quote
  const getLocalizedTitle = () => {
    if (result.score >= 90) return { title: t('harmonicDuoTitle'), quote: t('harmonicDuoQuote') }
    if (result.score >= 75) return { title: t('tetherLoversTitle'), quote: t('tetherLoversQuote') }
    if (result.score >= 55) return { title: t('tugOfWarTitle'), quote: t('tugOfWarQuote') }
    return { title: t('chaosCoupleTitle'), quote: t('chaosCoupleQuote') }
  }

  const { title: displayTitle, quote: displayQuote } = getLocalizedTitle()

  // Render the flight path tracking thumbnail inside the 2D mini canvas
  useEffect(() => {
    const canvas = pathCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = (canvas.width = canvas.clientWidth || 320)
    const h = (canvas.height = canvas.clientHeight || 150)

    // Clear background
    ctx.fillStyle = '#060911'
    ctx.fillRect(0, 0, w, h)

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    const allPoints = [...ship1Path, ...ship2Path]
    if (allPoints.length < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '10px Space Grotesk'
      ctx.textAlign = 'center'
      ctx.fillText('Synchronized Telemetry Acquired', w / 2, h / 2)
      return
    }

    // Calculate bounding box for normalization
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    allPoints.forEach((p) => {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    })

    const pad = 24
    const spanX = Math.max(maxX - minX, 100)
    const spanY = Math.max(maxY - minY, 100)

    const mapX = (x: number) => pad + ((x - minX) / spanX) * (w - pad * 2)
    const mapY = (y: number) => pad + ((y - minY) / spanY) * (h - pad * 2)

    // 1. Draw periodic connecting tether links between ship trails
    const minLen = Math.min(ship1Path.length, ship2Path.length)
    ctx.lineWidth = 1
    for (let i = 0; i < minLen; i += Math.max(1, Math.floor(minLen / 12))) {
      const p1 = ship1Path[i]
      const p2 = ship2Path[i]
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.25)'
      ctx.beginPath()
      ctx.moveTo(mapX(p1.x), mapY(p1.y))
      ctx.lineTo(mapX(p2.x), mapY(p2.y))
      ctx.stroke()
    }

    // 2. Draw Ship 1 (Alpha Pod - Cyan) Path
    if (ship1Path.length > 1) {
      ctx.shadowColor = '#00F0FF'
      ctx.shadowBlur = 8
      ctx.strokeStyle = '#00F0FF'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(mapX(ship1Path[0].x), mapY(ship1Path[0].y))
      for (let i = 1; i < ship1Path.length; i++) {
        ctx.lineTo(mapX(ship1Path[i].x), mapY(ship1Path[i].y))
      }
      ctx.stroke()
    }

    // 3. Draw Ship 2 (Beta Pod - Pink) Path
    if (ship2Path.length > 1) {
      ctx.shadowColor = '#FF2A85'
      ctx.shadowBlur = 8
      ctx.strokeStyle = '#FF2A85'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(mapX(ship2Path[0].x), mapY(ship2Path[0].y))
      for (let i = 1; i < ship2Path.length; i++) {
        ctx.lineTo(mapX(ship2Path[i].x), mapY(ship2Path[i].y))
      }
      ctx.stroke()
    }

    ctx.shadowBlur = 0

    // 4. Draw Start marker
    if (ship1Path.length > 0) {
      const sx = mapX(ship1Path[0].x)
      const sy = mapY(ship1Path[0].y)
      ctx.fillStyle = '#FFE600'
      ctx.beginPath()
      ctx.arc(sx, sy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '8px Orbitron'
      ctx.fillText('START', sx + 6, sy - 4)
    }

    // 5. Draw Finish marker
    if (ship1Path.length > 0) {
      const fx = mapX(ship1Path[ship1Path.length - 1].x)
      const fy = mapY(ship1Path[ship1Path.length - 1].y)
      ctx.fillStyle = '#00F0FF'
      ctx.beginPath()
      ctx.arc(fx, fy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '8px Orbitron'
      ctx.fillText('FINISH', fx + 6, fy - 4)
    }
  }, [ship1Path, ship2Path])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in duration-300">
      {/* 9:16 Styled Vertical Card Container with adaptive height */}
      <div
        className={`relative flex flex-col justify-between w-full max-w-[380px] max-h-[92vh] rounded-[28px] border-2 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl overflow-y-auto ${
          isVictory
            ? 'border-[#00F0FF]/50 shadow-[0_0_60px_rgba(0,240,255,0.25)]'
            : 'border-[#FF2A85]/50 shadow-[0_0_60px_rgba(255,42,133,0.25)]'
        }`}
      >
        {/* Background ambient lighting */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full blur-[90px] ${
            isVictory ? 'bg-[#00F0FF]/25' : 'bg-[#FF2A85]/25'
          }`}
        />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-[#FFE600]/15 blur-[80px]" />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2.5 flex-shrink-0">
          <AstroLogo size={26} showText />
          <span
            className={`rounded-full px-3 py-1 font-['Orbitron'] text-[10px] font-bold tracking-wider uppercase border ${
              isVictory
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/50 bg-red-500/10 text-red-300'
            }`}
          >
            {isVictory ? t('missionVictoryTitle') : t('missionDefeatTitle')}
          </span>
        </div>

        {/* Main Score Hero Section */}
        <div className="relative z-10 my-1.5 flex flex-col items-center text-center flex-shrink-0">
          {/* Trophy / Skull Icon badge */}
          <div
            className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2 p-[2px] shadow-xl ${
              isVictory
                ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.4)]'
                : 'border-[#FF2A85] bg-[#FF2A85]/15 text-[#FF2A85] shadow-[0_0_30px_rgba(255,42,133,0.4)]'
            }`}
          >
            {isVictory ? (
              <Trophy size={30} weight="duotone" />
            ) : (
              <Skull size={30} weight="duotone" />
            )}
          </div>

          {/* Relationship Status Title */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold text-gray-200">
            <Heart size={13} weight="fill" className="text-[#FF2A85] animate-pulse" />
            <span className="font-['Orbitron'] text-[11px] tracking-wide text-white">
              {displayTitle}
            </span>
          </div>

          {/* Calculated Couple Synergy Percentage */}
          <div className="my-1.5">
            <div className="flex items-baseline justify-center gap-1">
              <span
                className={`font-['Orbitron'] text-4xl sm:text-5xl font-black tracking-tight ${
                  result.score >= 85
                    ? 'text-[#00F0FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]'
                    : result.score >= 65
                    ? 'text-[#FFE600] drop-shadow-[0_0_20px_rgba(255,230,0,0.6)]'
                    : 'text-[#FF2A85] drop-shadow-[0_0_20px_rgba(255,42,133,0.6)]'
                }`}
              >
                {result.score}
              </span>
              <span className="font-['Orbitron'] text-xl font-bold text-gray-400">%</span>
            </div>
            <p className="font-['Rajdhani'] text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              {t('coupleScoreTitle')}
            </p>
          </div>

          {/* Playful quote */}
          <p className="px-3 text-xs italic text-gray-300 font-['Space_Grotesk'] line-clamp-2">
            "{displayQuote}"
          </p>
        </div>

        {/* Flight Path Tracking Thumbnail Mini-Canvas */}
        <div className="relative z-10 my-1 rounded-2xl border border-white/10 bg-[#060911]/90 p-2 overflow-hidden flex-shrink-0">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-gray-400 font-['Orbitron']">
            <span className="flex items-center gap-1">
              <Sparkle size={12} className="text-[#FFE600]" />
              {t('flightPathTracking')}
            </span>
            <div className="flex items-center gap-2 font-mono text-[9px]">
              <span className="text-[#00F0FF]">■ P1</span>
              <span className="text-[#FF2A85]">■ P2</span>
            </div>
          </div>
          <canvas
            ref={pathCanvasRef}
            className="h-20 w-full rounded-xl border border-white/5 bg-[#060911]"
          />
        </div>

        {/* Telemetry Stats Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-1.5 py-1.5 flex-shrink-0">
          <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-center">
            <Timer size={15} className="text-gray-400 mb-0.5" />
            <span className="font-['Orbitron'] text-[11px] font-bold text-white">
              {result.runTimeFormatted}
            </span>
            <span className="text-[9px] text-gray-400 font-['Space_Grotesk']">{t('durationStat')}</span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-center">
            <Lightning size={15} className="text-[#FFE600] mb-0.5" />
            <span className="font-['Orbitron'] text-[11px] font-bold text-[#FFE600]">
              {result.tensionConsistencyPercent}%
            </span>
            <span className="text-[9px] text-gray-400 font-['Space_Grotesk']">{t('tetherFlowStat')}</span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-center">
            <ShieldWarning size={15} className="text-[#FF2A85] mb-0.5" />
            <span className="font-['Orbitron'] text-[11px] font-bold text-[#FF2A85]">
              {result.collisionCount}
            </span>
            <span className="text-[9px] text-gray-400 font-['Space_Grotesk']">{t('collisionStat')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-col gap-2 pt-2 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onRematch}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#00B4D8] to-[#FF2A85] py-2.5 font-['Orbitron'] text-xs font-black tracking-wider text-black shadow-lg hover:brightness-110 active:scale-95 transition"
          >
            <ArrowsClockwise size={16} weight="bold" />
            <span>{t('instantRematchBtn')}</span>
          </button>

          {onReturnToLobby && (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-1.5 font-['Orbitron'] text-[10px] font-bold tracking-wider text-gray-400 hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={13} />
              <span>{t('returnToLobbyBtn')}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GameOverModal
