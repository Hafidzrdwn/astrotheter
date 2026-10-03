import React from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext'

interface HowToWinModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowToWinModal: React.FC<HowToWinModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage()

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-[#0B0F19]/95 p-5 sm:p-6 shadow-2xl text-white font-['Space_Grotesk'] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 flex-shrink-0">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#00F0FF] uppercase">
              FLIGHT ACADEMY
            </span>
            <h2 className="text-lg sm:text-xl font-black font-['Orbitron'] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2A85]">
              {t('howToWinTitle')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('howToWinSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 3 Steps Container - Scrollable if screen is compact */}
        <div className="space-y-3 mb-4 overflow-y-auto pr-1">
          {/* Step 1 */}
          <div className="flex gap-3.5 items-start p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-[#FFE600]/40 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#FFE600]/15 border border-[#FFE600]/40 flex items-center justify-center text-base shadow-[0_0_15px_rgba(255,230,0,0.3)]">
              ⭐
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#FFE600]">
                {t('howToWinStep1Title')}
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {t('howToWinStep1Desc')}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3.5 items-start p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-[#FF2A85]/40 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#FF2A85]/15 border border-[#FF2A85]/40 flex items-center justify-center text-base shadow-[0_0_15px_rgba(255,42,133,0.3)]">
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#FF2A85]">
                {t('howToWinStep2Title')}
              </h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {t('howToWinStep2Desc')}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3.5 items-start p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-[#00F0FF]/40 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-base shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              🌀
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#00F0FF]">
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
          className="w-full py-3 rounded-xl font-['Orbitron'] text-xs font-black tracking-wider text-black bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2A85] shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:opacity-95 active:scale-[0.98] transition-all flex-shrink-0"
        >
          {t('howToWinClose')}
        </button>
      </div>
    </div>,
    document.body
  )
}
