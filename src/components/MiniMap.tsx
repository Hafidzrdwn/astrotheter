import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export interface RadarEntity {
  x: number
  y: number
  angle?: number
}

export interface MiniMapProps {
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
  asteroids?: RadarEntity[]
}

export const MiniMap: React.FC<MiniMapProps> = ({
  ship1,
  ship2,
  core,
  warpGate,
  laserGate,
  asteroids = []
}) => {
  const { t } = useLanguage()
  const [isMinimized, setIsMinimized] = useState(false)

  // Radar parameters
  const RADAR_SIZE = 150
  const CENTER = RADAR_SIZE / 2
  const MAX_RADIUS = 64
  const WORLD_RANGE = 700 // Radius in world pixels covered by radar before clamping to edge

  // World origin is centered on the midpoint between both ships
  const midX = (ship1.x + ship2.x) / 2
  const midY = (ship1.y + ship2.y) / 2

  const toRadarCoords = (wx: number, wy: number) => {
    const dx = wx - midX
    const dy = wy - midY
    const dist = Math.hypot(dx, dy)
    const isClamped = dist > WORLD_RANGE
    const clampedDist = Math.min(dist, WORLD_RANGE)
    const scale = clampedDist / WORLD_RANGE
    const angle = Math.atan2(dy, dx)

    return {
      x: CENTER + Math.cos(angle) * (scale * MAX_RADIUS),
      y: CENTER + Math.sin(angle) * (scale * MAX_RADIUS),
      dist: Math.round(dist),
      isClamped,
      angle
    }
  }

  const s1R = toRadarCoords(ship1.x, ship1.y)
  const s2R = toRadarCoords(ship2.x, ship2.y)
  const coreR = toRadarCoords(core.x, core.y)
  const warpR = toRadarCoords(warpGate.x, warpGate.y)
  const sw1R = toRadarCoords(laserGate.switch1.x, laserGate.switch1.y)
  const sw2R = toRadarCoords(laserGate.switch2.x, laserGate.switch2.y)

  return (
    <div className="absolute bottom-4 right-4 z-20 select-none">
      <div className="rounded-2xl border border-white/15 bg-[#0B0F19]/90 backdrop-blur-md p-3.5 shadow-2xl text-white font-['Space_Grotesk'] transition-all w-[184px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="font-['Orbitron'] text-[10px] font-black tracking-widest text-[#00F0FF]">
              {t('radarTitle')}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white text-xs px-1"
          >
            {isMinimized ? '▼' : '▲'}
          </button>
        </div>

        {/* Circular Radar Scope */}
        {!isMinimized && (
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-full bg-[#060A14] border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] overflow-hidden"
              style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
            >
              {/* Radar Grid Circles */}
              <div
                className="absolute inset-0 rounded-full border border-cyan-500/15 pointer-events-none"
                style={{ margin: 16 }}
              />
              <div
                className="absolute inset-0 rounded-full border border-cyan-500/10 pointer-events-none"
                style={{ margin: 38 }}
              />
              {/* Crosshairs */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/15 pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/15 pointer-events-none" />

              {/* Holographic Radar Sweep Line */}
              <div
                className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent to-[#00F0FF]/60 origin-left pointer-events-none animate-spin"
                style={{ animationDuration: '4s' }}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Asteroids blips */}
                {asteroids.map((ast, idx) => {
                  const ar = toRadarCoords(ast.x, ast.y)
                  if (ar.isClamped) return null
                  return <circle key={idx} cx={ar.x} cy={ar.y} r={2} fill="#64748B" opacity={0.6} />
                })}

                {/* Laser switches & barrier */}
                {!laserGate.isDeactivated && (
                  <>
                    <line
                      x1={toRadarCoords(laserGate.x, laserGate.y - 60).x}
                      y1={toRadarCoords(laserGate.x, laserGate.y - 60).y}
                      x2={toRadarCoords(laserGate.x, laserGate.y + 60).x}
                      y2={toRadarCoords(laserGate.x, laserGate.y + 60).y}
                      stroke="#FF2A85"
                      strokeWidth={2}
                      opacity={0.7}
                    />
                    <circle cx={sw1R.x} cy={sw1R.y} r={2.5} fill="#00F0FF" />
                    <circle cx={sw2R.x} cy={sw2R.y} r={2.5} fill="#FF2A85" />
                  </>
                )}

                {/* Warp Gate */}
                <circle
                  cx={warpR.x}
                  cy={warpR.y}
                  r={warpR.isClamped ? 4 : 6}
                  fill={warpR.isClamped ? '#A855F7' : 'none'}
                  stroke="#A855F7"
                  strokeWidth={2}
                  className="animate-pulse"
                />
                {warpR.isClamped && (
                  <circle cx={warpR.x} cy={warpR.y} r={7} stroke="#A855F7" strokeWidth={1} strokeDasharray="2,2" />
                )}

                {/* Starlight Core */}
                <circle
                  cx={coreR.x}
                  cy={coreR.y}
                  r={coreR.isClamped ? 3.5 : 5}
                  fill="#FFE600"
                  className="animate-pulse"
                />
                {coreR.isClamped && (
                  <polygon
                    points={`${coreR.x},${coreR.y - 4} ${coreR.x + 3.5},${coreR.y + 4} ${coreR.x - 3.5},${coreR.y + 4}`}
                    fill="#FFE600"
                    transform={`rotate(${(coreR.angle * 180) / Math.PI + 90}, ${coreR.x}, ${coreR.y})`}
                  />
                )}

                {/* Tether line between ships */}
                <line
                  x1={s1R.x}
                  y1={s1R.y}
                  x2={s2R.x}
                  y2={s2R.y}
                  stroke="#00F0FF"
                  strokeWidth={1.5}
                  strokeDasharray="2,2"
                />

                {/* Ship 1 (Alpha Pod) */}
                <circle cx={s1R.x} cy={s1R.y} r={3.5} fill="#00F0FF" />

                {/* Ship 2 (Beta Pod) */}
                <circle cx={s2R.x} cy={s2R.y} r={3.5} fill="#FF2A85" />
              </svg>
            </div>

            {/* Quick Radar Legend - 2x2 Grid with generous spacing */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 w-full mt-2.5 pt-2 border-t border-white/10 text-[10px] font-mono text-gray-300">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#FFE600] flex-shrink-0 shadow-[0_0_6px_#FFE600]" />
                <span className="truncate">{t('radarLegendCore')}</span>
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#A855F7] flex-shrink-0 shadow-[0_0_6px_#A855F7]" />
                <span className="truncate">{t('radarLegendWarp')}</span>
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#00F0FF] flex-shrink-0 shadow-[0_0_6px_#00F0FF]" />
                <span className="truncate">{t('radarLegendP1')}</span>
              </span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#FF2A85] flex-shrink-0 shadow-[0_0_6px_#FF2A85]" />
                <span className="truncate">{t('radarLegendP2')}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
