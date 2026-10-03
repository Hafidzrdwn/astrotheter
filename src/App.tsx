import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import HostView from './views/HostView'
import ControllerView from './views/ControllerView'
import MobileEntryView from './views/MobileEntryView'
import { LanguageProvider } from './context/LanguageContext'

/**
 * Smart resolver for root domain (/):
 * - If accessed from a mobile/touch device, seamlessly direct to mobile entry/join portal.
 * - If accessed from a desktop/laptop, direct to PC host arena display.
 */
const RootResolver: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches)
  )

  if (isMobile) {
    return <Navigate to="/join" replace />
  }

  return <HostView />
}

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          {/* Smart root resolver: mobile -> join, desktop -> host */}
          <Route path="/" element={<RootResolver />} />
          <Route path="/host" element={<HostView />} />

          {/* Mobile smartphone controller view */}
          <Route path="/controller" element={<ControllerView />} />

          {/* Dedicated mobile room entry & QR scan portal */}
          <Route path="/join" element={<MobileEntryView />} />

          {/* Fallback to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  )
}

export default App

