import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CaretUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  Crosshair,
  Flame,
  Vibrate,
  WifiHigh,
  Desktop,
  RocketLaunch,
  WarningCircle,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { useControllerPeer } from '../hooks/useControllerPeer'

export const ControllerView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const targetRoom = searchParams.get('room') || 'AST1'

  const {
    connectionState,
    playerSlot,
    roomId,
    setInputState,
    currentInputState,
    latestFeedback,
    latencyMs,
    errorMessage,
    reconnect
  } = useControllerPeer(targetRoom)

  const [activeDirection, setActiveDirection] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [hapticEnabled, setHapticEnabled] = useState(true)

  // Local fallback slot if not yet allocated
  const effectiveSlot = playerSlot || 1
  const isP1 = effectiveSlot === 1
  const themeColor = isP1 ? '#00F0FF' : '#FF2A85'

  // Directional D-pad handlers
  const handleDirPress = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setActiveDirection(dir)
    switch (dir) {
      case 'UP':
        setInputState({ thrust: 1.0, steer: 0 })
        break
      case 'DOWN':
        setInputState({ thrust: 0, steer: 0 })
        break
      case 'LEFT':
        setInputState({ steer: -1.0 })
        break
      case 'RIGHT':
        setInputState({ steer: 1.0 })
        break
    }
  }

  const handleDirRelease = () => {
    setActiveDirection(null)
    setInputState({ steer: 0, thrust: 0 })
  }

  // Action button handlers (PRD Section 4: boost, reel)
  const handleActionPress = (action: 'BOOST' | 'REEL' | 'SHIELD') => {
    setActiveAction(action)
    if (action === 'BOOST') {
      setInputState({ boost: true })
    } else if (action === 'REEL') {
      setInputState({ reel: true })
    }
  }

  const handleActionRelease = (action: 'BOOST' | 'REEL' | 'SHIELD') => {
    setActiveAction(null)
    if (action === 'BOOST') {
      setInputState({ boost: false })
    } else if (action === 'REEL') {
      setInputState({ reel: false })
    }
  }

  // Room full view
  if (connectionState === 'ROOM_FULL') {
    return (
      <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF2A85]/20 text-[#FF2A85] border border-[#FF2A85]/40 shadow-[0_0_30px_rgba(255,42,133,0.5)] mb-6">
          <WarningCircle size={48} weight="fill" />
        </div>
        <h2 className="font-['Orbitron'] text-xl font-black text-white tracking-wider mb-2">
          ROOM IS FULL
        </h2>
        <p className="text-sm text-gray-400 max-w-xs mb-6">
          Room <span className="font-mono text-[#FFE600] font-bold">{roomId}</span> already has 2 active controllers (P1 and P2).
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={reconnect}
            className="w-full py-3 rounded-xl bg-white/10 text-white font-['Orbitron'] text-xs font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
          >
            <ArrowsClockwise size={16} />
            RETRY CONNECTION
          </button>
          <Link
            to="/host"
            className="w-full py-3 rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] font-['Orbitron'] text-xs font-bold text-center hover:bg-[#00F0FF]/20 transition"
          >
            OPEN DESKTOP HOST
          </Link>
        </div>
      </div>
    )
  }

  // Connecting view
  if (connectionState === 'CONNECTING') {
    return (
      <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 shadow-[0_0_35px_rgba(0,240,255,0.4)] mb-6">
          <RocketLaunch size={40} className="text-[#00F0FF] animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-[#00F0FF] animate-ping opacity-30" />
        </div>
        <h2 className="font-['Orbitron'] text-base font-bold text-white tracking-wider mb-1">
          PAIRING TO HOST
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-4">
          TARGET ROOM: <span className="text-[#FFE600] font-bold">{roomId}</span>
        </p>
        <p className="text-xs text-gray-500 max-w-xs">
          Direct P2P DataChannel handshake via public STUN relay...
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between p-3 select-none touch-none overflow-hidden overscroll-contain">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-[100px] transition-colors duration-500"
        style={{ backgroundColor: `${themeColor}22` }}
      />

      {/* Controller Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            style={{
              borderColor: `${themeColor}60`,
              backgroundColor: `${themeColor}20`,
              boxShadow: `0 0 15px ${themeColor}40`
            }}
          >
            <RocketLaunch size={20} weight="fill" style={{ color: themeColor }} />
          </div>
          <div>
            <h1 className="font-['Orbitron'] text-xs font-black tracking-wider text-white">
              ASTRO<span style={{ color: themeColor }}>TETHER</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">ROOM: {roomId}</p>
          </div>
        </div>

        {/* Assigned Slot Indicator */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 gap-2">
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: themeColor }}
          />
          <span className="font-['Orbitron'] text-xs font-bold" style={{ color: themeColor }}>
            {isP1 ? 'P1 ALPHA (CYAN)' : 'P2 BETA (PINK)'}
          </span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`p-1.5 rounded-lg border border-white/10 transition ${
              hapticEnabled ? 'bg-white/10 text-[#FFE600]' : 'bg-transparent text-gray-600'
            }`}
            title="Toggle Haptic Feedback"
          >
            <Vibrate size={18} />
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
            <WifiHigh size={14} />
            <span>{latencyMs > 0 ? `${latencyMs}ms` : '40Hz'}</span>
          </div>

          <Link
            to="/host"
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white"
            title="Go to Host Screen"
          >
            <Desktop size={16} />
          </Link>
        </div>
      </header>

      {/* Disconnect Warning Banner if offline */}
      {connectionState === 'DISCONNECTED' && (
        <div className="relative z-10 flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
          <span>{errorMessage || 'Disconnected from Host'}</span>
          <button
            type="button"
            onClick={reconnect}
            className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 font-bold text-white hover:bg-red-500/30"
          >
            <ArrowsClockwise size={14} />
            Reconnect
          </button>
        </div>
      )}

      {/* Center Event & Telemetry Indicator */}
      <div className="relative z-10 my-1 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <div className="flex items-center justify-between text-[11px] font-['Rajdhani'] font-bold mb-1">
          <span className="text-gray-400">DATACHANNEL STATUS</span>
          <span className="text-emerald-400 font-mono">
            STEER: {currentInputState.steer.toFixed(2)} | THRUST: {currentInputState.thrust.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${Math.max(10, currentInputState.thrust * 100)}%`,
              backgroundColor: themeColor,
              boxShadow: `0 0 10px ${themeColor}`
            }}
          />
        </div>
        {latestFeedback && (
          <div className="mt-1 text-[10px] text-[#FFE600] font-['Orbitron'] flex items-center justify-between">
            <span>FEEDBACK: {latestFeedback.e}</span>
            <span>INTENSITY: {latestFeedback.intensity || 'NORMAL'}</span>
          </div>
        )}
      </div>

      {/* Main Touch Control Pads */}
      <main className="relative z-10 flex-1 grid grid-cols-2 gap-4 items-center justify-center py-2">
        {/* Left Side: Directional Vector D-Pad */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-2 text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-400">
            {isP1 ? 'THRUSTER VECTOR' : 'TETHER VECTOR'}
          </span>

          <div className="relative h-44 w-44 rounded-full border border-white/10 bg-black/40 p-2 shadow-inner flex items-center justify-center">
            {/* UP */}
            <button
              type="button"
              onPointerDown={() => handleDirPress('UP')}
              onPointerUp={handleDirRelease}
              onPointerLeave={handleDirRelease}
              className={`absolute top-2 h-12 w-12 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                activeDirection === 'UP'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              <CaretUp size={24} weight="bold" />
            </button>

            {/* DOWN */}
            <button
              type="button"
              onPointerDown={() => handleDirPress('DOWN')}
              onPointerUp={handleDirRelease}
              onPointerLeave={handleDirRelease}
              className={`absolute bottom-2 h-12 w-12 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                activeDirection === 'DOWN'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              <CaretDown size={24} weight="bold" />
            </button>

            {/* LEFT */}
            <button
              type="button"
              onPointerDown={() => handleDirPress('LEFT')}
              onPointerUp={handleDirRelease}
              onPointerLeave={handleDirRelease}
              className={`absolute left-2 h-12 w-12 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                activeDirection === 'LEFT'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              <CaretLeft size={24} weight="bold" />
            </button>

            {/* RIGHT */}
            <button
              type="button"
              onPointerDown={() => handleDirPress('RIGHT')}
              onPointerUp={handleDirRelease}
              onPointerLeave={handleDirRelease}
              className={`absolute right-2 h-12 w-12 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                activeDirection === 'RIGHT'
                  ? 'border-[#00F0FF] bg-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              <CaretRight size={24} weight="bold" />
            </button>

            {/* CENTER STICK */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[9px] font-bold font-['Orbitron'] text-gray-400">
              {activeDirection || 'IDLE'}
            </div>
          </div>
        </div>

        {/* Right Side: Action Triggers (PRD: boost & reel) */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-2 text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-400">
            {isP1 ? 'PRIMARY PROPULSION' : 'REEL & DEFENSE'}
          </span>

          <div className="flex flex-col gap-3 w-full max-w-[160px]">
            {/* Boost Action Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('BOOST')}
              onPointerUp={() => handleActionRelease('BOOST')}
              onPointerLeave={() => handleActionRelease('BOOST')}
              className={`relative flex items-center justify-between px-4 py-3.5 rounded-xl border transition active:scale-95 ${
                activeAction === 'BOOST'
                  ? 'border-[#00F0FF] bg-[#00F0FF] text-black shadow-[0_0_25px_rgba(0,240,255,0.8)]'
                  : 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame size={20} weight="fill" />
                <span className="font-['Orbitron'] text-xs font-black">BOOST</span>
              </div>
              <span className="text-[10px] font-bold opacity-80">PWR</span>
            </button>

            {/* Reel / Pull Action Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('REEL')}
              onPointerUp={() => handleActionRelease('REEL')}
              onPointerLeave={() => handleActionRelease('REEL')}
              className={`relative flex items-center justify-between px-4 py-3.5 rounded-xl border transition active:scale-95 ${
                activeAction === 'REEL'
                  ? 'border-[#FFE600] bg-[#FFE600] text-black shadow-[0_0_25px_rgba(255,230,0,0.8)]'
                  : 'border-[#FFE600]/50 bg-[#FFE600]/15 text-[#FFE600]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Crosshair size={20} weight="bold" />
                <span className="font-['Orbitron'] text-xs font-black">REEL</span>
              </div>
              <span className="text-[10px] font-bold opacity-80">ACT</span>
            </button>

            {/* Shield / Anchor Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('SHIELD')}
              onPointerUp={() => handleActionRelease('SHIELD')}
              onPointerLeave={() => handleActionRelease('SHIELD')}
              className={`relative flex items-center justify-between px-4 py-3.5 rounded-xl border transition active:scale-95 ${
                activeAction === 'SHIELD'
                  ? 'border-[#FF2A85] bg-[#FF2A85] text-white shadow-[0_0_25px_rgba(255,42,133,0.8)]'
                  : 'border-[#FF2A85]/50 bg-[#FF2A85]/15 text-[#FF2A85]'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} weight="fill" />
                <span className="font-['Orbitron'] text-xs font-black">SHIELD</span>
              </div>
              <span className="text-[10px] font-bold opacity-80">DEF</span>
            </button>
          </div>
        </div>
      </main>

      {/* Controller Footer Status */}
      <footer className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>40Hz UDP-EQUIVALENT DATACHANNEL</span>
        </div>
        <div className="text-gray-400">
          SLOT: <span className="text-white font-bold">{isP1 ? 'PLAYER 1' : 'PLAYER 2'}</span>
        </div>
      </footer>
    </div>
  )
}

export default ControllerView
