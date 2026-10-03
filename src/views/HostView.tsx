import React, { useState } from 'react'
import {
  RocketLaunch,
  WifiHigh,
  Lightning,
  Sparkle,
  Broadcast,
  ArrowsClockwise,
  ArrowLeft
} from '@phosphor-icons/react'
import { useHostPeer } from '../hooks/useHostPeer'
import { HostLobbyView } from './HostLobbyView'
import { GameCanvas } from '../components/GameCanvas'

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
    sendFeedbackToPlayer,
    getLatestInputs,
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

  // PLAYING state: active Matter.js 2D physics arena
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
              Matter.js 60 FPS Physics • Real-Time Dual Controller Input
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

      {/* Main Physics Arena Container with Matter.js Canvas */}
      <main className="relative z-10 my-4 flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-4 md:p-6 shadow-2xl overflow-hidden">
        {/* Interactive Matter.js 2D Canvas */}
        <GameCanvas
          getLatestInputs={getLatestInputs}
          onCollisionFeedback={(player) => {
            sendFeedbackToPlayer(player, {
              e: 'COLLISION',
              intensity: 'HEAVY'
            })
          }}
          onOverstretch={() =>
            broadcastFeedback({
              e: 'OVERSTRETCH',
              intensity: 'HEAVY'
            })
          }
          onStageCompleted={(result) => {
            broadcastFeedback({
              e: 'SUCCESS',
              intensity: 'LIGHT',
              score: result.score,
              message: `${result.title} — ${result.score}% Synergy!`
            })
          }}
        />

        {/* Arena Bottom Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 mt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestHaptic}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-200 hover:bg-white/20 active:scale-95 transition"
            >
              <Lightning size={16} className="text-[#FFE600]" />
              TRIGGER HAPTIC TEST
            </button>
            <button
              type="button"
              onClick={() => setGameState('LOBBY')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-400 hover:text-white transition"
            >
              <ArrowsClockwise size={16} />
              RE-ENTER LOBBY
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
            <span className={player1Connected ? 'text-[#00F0FF]' : 'text-gray-600'}>
              P1: {player1Connected ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span>•</span>
            <span className={player2Connected ? 'text-[#FF2A85]' : 'text-gray-600'}>
              P2: {player2Connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer System Diagnostics */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 font-['Space_Grotesk']">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Sparkle size={14} className="text-[#FFE600]" />
            AstroTether Physics Core (Matter.js)
          </span>
          <span>•</span>
          <span className="text-[#00F0FF]">P1 Pilot (Cyan)</span>
          <span>•</span>
          <span className="text-[#FF2A85]">P2 Gunner (Pink)</span>
        </div>
        <div>
          <span>Camera: Dynamic Lerp Centering • 60 FPS</span>
        </div>
      </footer>
    </div>
  )
}

export default HostView
