import React from 'react'
import { Translate } from '@phosphor-icons/react'
import { useLanguage } from '../context/LanguageContext'

export interface LanguageSelectorProps {
  className?: string
  showIcon?: boolean
}

/**
 * Modern pill language toggle (EN | ID) with persistent localStorage state
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showIcon = true
}) => {
  const { lang, setLanguage } = useLanguage()

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-md shadow-sm ${className}`}
      role="group"
      aria-label="Language selector"
    >
      {showIcon && (
        <Translate size={14} className="ml-1.5 text-gray-400 shrink-0" />
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-full px-2.5 py-1 text-[11px] font-['Orbitron'] font-bold transition-all duration-200 ${
          lang === 'en'
            ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`rounded-full px-2.5 py-1 text-[11px] font-['Orbitron'] font-bold transition-all duration-200 ${
          lang === 'id'
            ? 'bg-[#FF2A85] text-white shadow-[0_0_12px_rgba(255,42,133,0.5)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        ID
      </button>
    </div>
  )
}
