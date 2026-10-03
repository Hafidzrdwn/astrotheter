import React, { createContext, useContext, useState } from 'react'
import { translations, type Language, type TranslationDictionary } from '../i18n/translations'

const STORAGE_KEY = 'astrotether_lang'

interface LanguageContextType {
  lang: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof TranslationDictionary) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'id' || saved === 'en') {
        return saved
      }
    }
    return 'en' // Default language is English per requirements
  })

  const setLanguage = (newLang: Language) => {
    setLangState(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang)
    }
  }

  const t = (key: keyof TranslationDictionary): string => {
    const currentDict = translations[lang] || translations.en
    return currentDict[key] || translations.en[key] || String(key)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
