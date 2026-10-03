import React from 'react'
import { useLanguage } from '../context/LanguageContext'

interface HowToWinModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowToWinModal: React.FC<HowToWinModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/20 bg-[#0B0F19]/95 p-6 shadow-2xl text-white font-['Space_Grotesk']">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#00F0FF] uppercase">
              FLIGHT ACADEMY
            </span>
            <h2 className="text-xl font-black font-['Orbitron'] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2A85]">
              {t('howToWinTitle')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('howToWinSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 3 Steps Container */}
        <div className="space-y-3.5 mb-6">
          {/* Step 1 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#FFE600]/40 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(255,230,0,0.3)]">
              ⭐
            </div>
            <div className="flex-1">
              <h3 className="font-['Orbitron'] text-sm font-bold text-[#FFE600]">
                {t('howToWinStep1Title')}
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {t('howToWinStep1Desc')}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#FF2A85]/40 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FF2A85]/10 border border-[#FF2A85]/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(255,42,133,0.3)]">
              ⚡
            </div>
            <div className="flex-1">
              <h3 className="font-['Orbitron'] text-sm font-bold text-[#FF2A85]">
                {t('howToWinStep2Title')}
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {t('howToWinStep2Desc')}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00F0FF]/40 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              🌀
            </div>
            <div className="flex-1">
              <h3 className="font-['Orbitron'] text-sm font-bold text-[#00F0FF]">
                {t('howToWinStep3Title')}
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {t('howToWinStep3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-['Orbitron'] text-xs font-black tracking-wider text-black bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2A85] shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:opacity-95 active:scale-[0.98] transition-all"
        >
          {t('howToWinClose')}
        </button>
      </div>
    </div>
  )
}
