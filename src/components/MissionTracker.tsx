import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export interface MissionTrackerProps {
  isCoreCaptured: boolean
  isLaserDeactivated: boolean
  isStageDone: boolean
  coreDistanceToWarp: number
  onOpenHowToWin: () => void
}

export const MissionTracker: React.FC<MissionTrackerProps> = ({
  isCoreCaptured,
  isLaserDeactivated,
  isStageDone,
  coreDistanceToWarp,
  onOpenHowToWin
}) => {
  const { t } = useLanguage()
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="absolute top-16 left-4 z-20 select-none">
      <div className="rounded-2xl border border-white/15 bg-[#0B0F19]/90 backdrop-blur-md p-3.5 shadow-2xl text-white font-['Space_Grotesk'] w-[330px] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">🎯</span>
            <span className="font-['Orbitron'] text-[11px] font-black tracking-wide text-gray-100 truncate">
              {t('missionTrackerTitle')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onOpenHowToWin}
              className="whitespace-nowrap flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/25 shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95 transition-all"
              title="Panduan Cara Menang"
            >
              <span>{t('howToWinBtn')}</span>
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white text-xs px-1 py-1 rounded hover:bg-white/10 transition-colors"
            >
              {isMinimized ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {!isMinimized && (
          <div className="space-y-2 text-xs">
            {/* Task 1: Starlight Core */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                isCoreCaptured
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Orbitron'] text-[10px] font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-[#FFE600]">⭐</span>
                  {t('task1Title')}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCoreCaptured
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                  }`}
                >
                  {isCoreCaptured ? '✓ TRAPPED' : 'SEEKING'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {isCoreCaptured ? t('task1StatusCaptured') : t('task1StatusSearching')}
              </p>
            </div>

            {/* Task 2: Laser Gate */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                isLaserDeactivated
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Orbitron'] text-[10px] font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-[#FF2A85]">⚡</span>
                  {t('task2Title')}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isLaserDeactivated
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isLaserDeactivated ? '✓ OPEN' : 'LOCKED'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {isLaserDeactivated ? t('task2StatusOpen') : t('task2StatusLocked')}
              </p>
            </div>

            {/* Task 3: Warp Gate Delivery */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                isStageDone
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Orbitron'] text-[10px] font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="text-[#00F0FF]">🌀</span>
                  {t('task3Title')}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isStageDone
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-[#00F0FF]/20 text-[#00F0FF]'
                  }`}
                >
                  {isStageDone ? '✓ VICTORY' : `${coreDistanceToWarp}px`}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {isStageDone
                  ? t('task3StatusDelivered')
                  : `${coreDistanceToWarp} ${t('task3StatusDistance')}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
