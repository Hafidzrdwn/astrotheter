import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HostView from './views/HostView'
import ControllerView from './views/ControllerView'

export const App: React.FC = () => {
  return (
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
  )
}

export default App
