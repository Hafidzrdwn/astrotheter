import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HostView from './views/HostView'
import ControllerView from './views/ControllerView'
import { LanguageProvider } from './context/LanguageContext'

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Desktop game host view */}
          <Route path="/" element={<HostView />} />
          <Route path="/host" element={<HostView />} />

          {/* Mobile smartphone controller view */}
          <Route path="/controller" element={<ControllerView />} />

          {/* Fallback to desktop host */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
