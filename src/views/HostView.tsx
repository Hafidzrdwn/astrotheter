import React, { useState } from 'react'
import {
  RocketLaunch,
  WifiHigh,
  ShieldCheck,
  Lightning,
  Sparkle,
  Broadcast,
  ArrowsClockwise,
  ArrowLeft
} from '@phosphor-icons/react'
import { useHostPeer } from '../hooks/useHostPeer'
import { HostLobbyView } from './HostLobbyView'

export type HostGameState = 'LOBBY' | 'PLAYING'

export const HostView: React.FC = () => {
  const [gameState, setGameState] = useState<HostGameState>('LOBBY')

  const {
    roomId,
    connectionState,
    player1Connected,
    player2Connected,
    latestInputs,
    broadcastFeedback,
    regenerateRoom
  } = useHostPeer()

  const handleTestHaptic = () => {
    broadcastFeedback({
      e: 'COLLISION',
      intensity: 'HEAVY',
      score: 100
    })
  }

  // If in LOBBY state: render the onboarding & pairing lobby
  if (gameState === 'LOBBY') {
    return (
      <HostLobbyView
        roomId={roomId}
        player1Connected={player1Connected}
        player2Connected={player2Connected}
        latestInputs={latestInputs}
        onStartGame={() => setGameState('PLAYING')}
        regenerateRoom={regenerateRoom}
      />
    )
  }

  // PLAYING state: active game arena
  return (
    <div className="relative min-h-screen bg-[#0B0F19] text-gray-100 bg-cosmic-grid overflow-hidden flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Background ambient cosmic glow */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#00F0FF]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-[#FF2A85]/15 blur-[120px]" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#FF2A85] p-[2px] shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0B0F19]">
              <RocketLaunch size={28} weight="fill" className="text-[#00F0FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Orbitron'] text-2xl md:text-3xl font-black tracking-wider text-white">
                ASTRO<span className="text-[#FF2A85]">TETHER</span>
              </h1>
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 animate-pulse">
                ORBITAL SECTOR-07 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-['Space_Grotesk']">
              Live Mission Arena • Dual-Screen Simulation
            </p>
          </div>
        </div>

        {/* Room & Network Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
            <Broadcast size={18} className="animate-pulse text-[#00F0FF]" />
            <span className="text-xs text-gray-400">ROOM:</span>
            <span className="font-['Orbitron'] text-sm font-bold tracking-widest text-[#FFE600]">
              {roomId}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              connectionState === 'CONNECTED'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <WifiHigh size={18} />
            <span>RELAY {connectionState}</span>
          </div>

          <button
            type="button"
            onClick={() => setGameState('LOBBY')}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/20 transition"
          >
            <ArrowLeft size={16} />
            <span>Return to Lobby</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage & Tether Simulation Preview */}
      <main className="relative z-10 my-6 flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden min-h-[520px]">
        {/* Radial space vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(11,15,25,0)_0%,_rgba(11,15,25,0.85)_100%)]" />

        {/* Simulation Telemetry Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-['Orbitron'] text-xs font-bold tracking-wider text-gray-300">
              PHYSICS ENGINE ACTIVE: 60 FPS • WEBRTC ~40Hz
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs font-['Rajdhani'] font-bold tracking-wider">
            <span className="text-[#00F0FF]">P1 THRUST: {Math.round((latestInputs[1]?.th || 0) * 100)}%</span>
            <span className="text-[#FFE600]">
              TETHER HARMONY: {latestInputs[1]?.re && latestInputs[2]?.re ? '100% (SYNC)' : '94%'}
            </span>
            <span className="text-[#FF2A85]">P2 THRUST: {Math.round((latestInputs[2]?.th || 0) * 100)}%</span>
          </div>
        </div>

        {/* Interactive Tether Arena Stage */}
        <div className="relative z-10 my-8 flex items-center justify-around h-72 border border-white/5 rounded-2xl bg-black/50 p-6 overflow-hidden">
          {/* Cosmic dust particles mock */}
          <div className="pointer-events-none absolute inset-0 bg-cosmic-grid opacity-30" />

          {/* Player 1 Pod (Neon Cyan) */}
          <div className="flex flex-col items-center gap-2 group z-10">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-transform duration-150"
              style={{
                transform: `rotate(${((latestInputs[1]?.st || 0) * 35)}deg) scale(${1 + (latestInputs[1]?.th || 0) * 0.15})`
              }}
            >
              <RocketLaunch size={44} weight="duotone" className="text-[#00F0FF] -rotate-45" />
              <span className="absolute -top-3 rounded-full bg-[#00F0FF] px-2.5 py-0.5 text-[10px] font-black text-black font-['Orbitron']">
                P1 ALPHA
              </span>
            </div>
            <span className="font-['Rajdhani'] text-xs font-bold text-[#00F0FF] tracking-wider">
              STEER: {latestInputs[1]?.st?.toFixed(2) || '0.00'} | THRUST: {Math.round((latestInputs[1]?.th || 0) * 100)}%
            </span>
          </div>

          {/* Dynamic Quantum Tether */}
          <div className="relative flex-1 mx-8 flex items-center justify-center z-10">
            <div
              className={`w-full h-1.5 rounded-full transition-all duration-150 relative ${
                latestInputs[1]?.re || latestInputs[2]?.re
                  ? 'bg-gradient-to-r from-[#00F0FF] via-[#FFE600] to-[#FF2A85] shadow-[0_0_25px_rgba(255,230,0,1)]'
                  : 'bg-gradient-to-r from-[#00F0FF] via-[#FFE600]/60 to-[#FF2A85] shadow-[0_0_15px_rgba(255,230,0,0.6)]'
              }`}
            >
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_15px_#FFE600] animate-ping" />
            </div>
            <div className="absolute -top-7 rounded-md border border-[#FFE600]/40 bg-[#FFE600]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FFE600] font-['Orbitron'] tracking-wider shadow-[0_0_12px_rgba(255,230,0,0.3)]">
              {latestInputs[1]?.re || latestInputs[2]?.re ? 'TETHER TENSION: TIGHT' : 'TETHER TENSION: NOMINAL'}
            </div>
          </div>

          {/* Player 2 Pod (Neon Pink) */}
          <div className="flex flex-col items-center gap-2 group z-10">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#FF2A85] bg-[#FF2A85]/15 shadow-[0_0_35px_rgba(255,42,133,0.6)] transition-transform duration-150"
              style={{
                transform: `rotate(${((latestInputs[2]?.st || 0) * 35)}deg) scale(${1 + (latestInputs[2]?.th || 0) * 0.15})`
              }}
            >
              <ShieldCheck size={44} weight="duotone" className="text-[#FF2A85]" />
              <span className="absolute -top-3 rounded-full bg-[#FF2A85] px-2.5 py-0.5 text-[10px] font-black text-white font-['Orbitron']">
                P2 BETA
              </span>
            </div>
            <span className="font-['Rajdhani'] text-xs font-bold text-[#FF2A85] tracking-wider">
              STEER: {latestInputs[2]?.st?.toFixed(2) || '0.00'} | REEL: {latestInputs[2]?.re ? 'PULLING' : 'FREE'}
            </span>
          </div>
        </div>

        {/* Arena Bottom Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestHaptic}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-200 hover:bg-white/20 active:scale-95 transition"
            >
              <Lightning size={16} className="text-[#FFE600]" />
              TRIGGER HAPTIC TEST
            </button>
            <button
              type="button"
              onClick={() => setGameState('LOBBY')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-400 hover:text-white transition"
            >
              <ArrowsClockwise size={16} />
              RE-ENTER LOBBY
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-400 font-['Rajdhani'] font-bold tracking-wider">
              DUAL PHONE PEER SYNC ACTIVE
            </p>
          </div>
        </div>
      </main>

      {/* Footer System Diagnostics */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 font-['Space_Grotesk']">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Sparkle size={14} className="text-[#FFE600]" />
            AstroTether Mission Control
          </span>
          <span>•</span>
          <span className="text-[#00F0FF]">P1 Pilot (Cyan)</span>
          <span>•</span>
          <span className="text-[#FF2A85]">P2 Gunner (Pink)</span>
        </div>
        <div>
          <span>Target Resolution: 1080p/4K 60FPS</span>
        </div>
      </footer>
    </div>
  )
}

export default HostView
