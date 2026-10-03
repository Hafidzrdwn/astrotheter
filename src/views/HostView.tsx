import React, { useState } from 'react'
import {
  WifiHigh,
  Lightning,
  Sparkle,
  Broadcast,
  ArrowsClockwise,
  ArrowLeft,
  Robot
} from '@phosphor-icons/react'
import { useHostPeer } from '../hooks/useHostPeer'
import { type ShipShape } from '../types/network'
import { HostLobbyView } from './HostLobbyView'
import { GameCanvas } from '../components/GameCanvas'
import { AstroLogo } from '../components/AstroLogo'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../context/LanguageContext'

export type HostGameState = 'LOBBY' | 'PLAYING'

export const HostView: React.FC = () => {
  const { t } = useLanguage()
  const [gameState, setGameState] = useState<HostGameState>('LOBBY')
  const [simulateP2, setSimulateP2] = useState<boolean>(false)
  const [p1Shape, setP1Shape] = useState<ShipShape>('dart')
  const [p2Shape, setP2Shape] = useState<ShipShape>('manta')

  // Developer mode flag (?dev=true or ?test=true)
  const isDevMode = typeof window !== 'undefined' && (
    window.location.search.includes('dev=true') ||
    window.location.search.includes('test=true')
  )

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

  // Real-time synchronization of ship customizer selections from players' phones
  React.useEffect(() => {
    if (latestInputs[1]?.sh && latestInputs[1].sh !== p1Shape) {
      setP1Shape(latestInputs[1].sh)
    }
  }, [latestInputs[1]?.sh, p1Shape])

  React.useEffect(() => {
    if (latestInputs[2]?.sh && latestInputs[2].sh !== p2Shape) {
      setP2Shape(latestInputs[2].sh)
    }
  }, [latestInputs[2]?.sh, p2Shape])

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
        simulateP2={simulateP2}
        onToggleSimulateP2={() => setSimulateP2(!simulateP2)}
        latestInputs={latestInputs}
        player1Shape={p1Shape}
        player2Shape={p2Shape}
        onP1ShapeChange={setP1Shape}
        onP2ShapeChange={setP2Shape}
        onStartGame={() => {
          // If starting without P2 connected, auto-enable P2 simulation
          if (!player2Connected) {
            setSimulateP2(true)
          }
          setGameState('PLAYING')
        }}
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
        <div className="flex items-center gap-4">
          <AstroLogo size={44} showText />
        </div>

        {/* Room, Network Telemetry, and Language Switcher */}
        <div className="flex items-center gap-3">
          <LanguageSelector />

          {simulateP2 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-[#FF2A85]/40 bg-[#FF2A85]/15 px-3 py-1.5 text-xs font-bold text-[#FF2A85] font-['Orbitron']">
              <Robot size={16} />
              <span>CO-PILOT BOT ASSIST</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
            <Broadcast size={18} className="animate-pulse text-[#00F0FF]" />
            <span className="text-[11px] text-gray-400 font-mono">{t('roomLabel')}:</span>
            <span className="font-['Orbitron'] text-sm font-bold tracking-widest text-[#FFE600]">
              {roomId}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              connectionState === 'CONNECTED'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            }`}
          >
            <WifiHigh size={18} />
            <span>{connectionState === 'CONNECTED' ? t('relayConnected') : t('relayConnecting')}</span>
          </div>

          <button
            type="button"
            onClick={() => setGameState('LOBBY')}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-gray-300 hover:bg-white/20 transition"
          >
            <ArrowLeft size={16} />
            <span>{t('returnToLobby')}</span>
          </button>
        </div>
      </header>

      {/* Main Physics Arena Container with Matter.js Canvas */}
      <main className="relative z-10 my-4 flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-4 md:p-6 shadow-2xl overflow-hidden">
        {/* Interactive Matter.js 2D Canvas */}
        <GameCanvas
          getLatestInputs={getLatestInputs}
          isP2Simulated={simulateP2}
          player1Shape={p1Shape}
          player2Shape={p2Shape}
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
          onReturnToLobby={() => setGameState('LOBBY')}
        />

        {/* Arena Bottom Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 mt-4">
          <div className="flex items-center gap-3">
            {isDevMode && (
              <button
                type="button"
                onClick={handleTestHaptic}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-200 hover:bg-white/20 active:scale-95 transition"
              >
                <Lightning size={16} className="text-[#FFE600]" />
                {t('testHapticBtn')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setGameState('LOBBY')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-400 hover:text-white transition"
            >
              <ArrowsClockwise size={16} />
              {t('returnToLobby')}
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
            <span className={player1Connected ? 'text-[#00F0FF]' : 'text-gray-600'}>
              P1: {player1Connected ? 'ONLINE' : 'KEYBOARD (WASD)'}
            </span>
            <span>•</span>
            <span className={player2Connected ? 'text-[#FF2A85]' : simulateP2 ? 'text-[#FF2A85] font-bold' : 'text-gray-600'}>
              P2: {player2Connected ? 'ONLINE' : simulateP2 ? 'SIMULATED (ARROW KEYS / AI)' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer System Diagnostics */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 font-['Space_Grotesk']">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Sparkle size={14} className="text-[#FFE600]" />
            AstroTether
          </span>
          <span>•</span>
          <span className="text-[#00F0FF]">P1 Pilot (Cyan)</span>
          <span>•</span>
          <span className="text-[#FF2A85]">{simulateP2 ? 'P2 (Simulated Bot)' : 'P2 Pilot (Pink)'}</span>
        </div>
        <div>
          <span>{simulateP2 ? t('soloDevActive') : t('brandSubtitle')}</span>
        </div>
      </footer>
    </div>
  )
}

export default HostView
