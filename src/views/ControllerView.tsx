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
  RocketLaunch
} from '@phosphor-icons/react'

export const ControllerView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialRoom = searchParams.get('room') || 'ASTRO-9042'
  const initialSlot = (searchParams.get('slot') === '2' ? 2 : 1) as 1 | 2

  const [playerSlot, setPlayerSlot] = useState<1 | 2>(initialSlot)
  const [activeDirection, setActiveDirection] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [strainLevel, setStrainLevel] = useState(42)

  // Trigger tactile haptic feedback if supported by browser
  const triggerHaptic = (ms = 40) => {
    if (hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms)
    }
  }

  const handleDirPress = (dir: string) => {
    setActiveDirection(dir)
    triggerHaptic(30)
  }

  const handleDirRelease = () => {
    setActiveDirection(null)
  }

  const handleActionPress = (action: string) => {
    setActiveAction(action)
    triggerHaptic(60)
    // Simulate strain shift
    setStrainLevel((prev) => Math.min(100, Math.max(10, prev + (action === 'BOOST' ? 12 : -8))))
  }

  const handleActionRelease = () => {
    setActiveAction(null)
  }

  const isP1 = playerSlot === 1
  const themeColor = isP1 ? '#00F0FF' : '#FF2A85'

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
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
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
            <p className="text-[10px] text-gray-400 font-mono">ROOM: {initialRoom}</p>
          </div>
        </div>

        {/* Slot Switcher Tabs */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setPlayerSlot(1)
              triggerHaptic(50)
            }}
            className={`px-3 py-1 text-xs font-['Orbitron'] font-bold rounded transition ${
              isP1
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            P1 ALPHA
          </button>
          <button
            type="button"
            onClick={() => {
              setPlayerSlot(2)
              triggerHaptic(50)
            }}
            className={`px-3 py-1 text-xs font-['Orbitron'] font-bold rounded transition ${
              !isP1
                ? 'bg-[#FF2A85] text-white shadow-[0_0_12px_rgba(255,42,133,0.6)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            P2 BETA
          </button>
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
            <span>4ms</span>
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

      {/* Center Tether Telemetry Bar */}
      <div className="relative z-10 my-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <div className="flex items-center justify-between text-[11px] font-['Rajdhani'] font-bold mb-1">
          <span className="text-gray-400">TETHER TENSION GAUGE</span>
          <span
            style={{
              color: strainLevel > 75 ? '#FF2A85' : strainLevel > 40 ? '#FFE600' : '#00F0FF'
            }}
          >
            {strainLevel}% STRAIN
          </span>
        </div>
        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${strainLevel}%`,
              backgroundColor: strainLevel > 75 ? '#FF2A85' : strainLevel > 40 ? '#FFE600' : '#00F0FF',
              boxShadow: `0 0 10px ${strainLevel > 75 ? '#FF2A85' : strainLevel > 40 ? '#FFE600' : '#00F0FF'}`
            }}
          />
        </div>
      </div>

      {/* Main Touch Control Pads */}
      <main className="relative z-10 flex-1 grid grid-cols-2 gap-4 items-center justify-center py-2">
        {/* Left Side: Directional Vector D-Pad */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-2 text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-400">
            {isP1 ? 'THRUSTER VECTOR' : 'TETHER ANGLE'}
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

            {/* CENTER STICK / BRAKE */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[9px] font-bold font-['Orbitron'] text-gray-400">
              {activeDirection || 'IDLE'}
            </div>
          </div>
        </div>

        {/* Right Side: Action Triggers */}
        <div className="flex flex-col items-center justify-center">
          <span className="mb-2 text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-400">
            {isP1 ? 'PRIMARY PROPULSION' : 'HARPOON & MATRIX'}
          </span>

          <div className="flex flex-col gap-3 w-full max-w-[160px]">
            {/* Primary Action Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('BOOST')}
              onPointerUp={handleActionRelease}
              onPointerLeave={handleActionRelease}
              className={`relative flex items-center justify-between px-4 py-3.5 rounded-xl border transition active:scale-95 ${
                activeAction === 'BOOST'
                  ? 'border-[#00F0FF] bg-[#00F0FF] text-black shadow-[0_0_25px_rgba(0,240,255,0.8)]'
                  : 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame size={20} weight="fill" />
                <span className="font-['Orbitron'] text-xs font-black">
                  {isP1 ? 'BOOST' : 'REEL IN'}
                </span>
              </div>
              <span className="text-[10px] font-bold opacity-80">PWR</span>
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('HARPOON')}
              onPointerUp={handleActionRelease}
              onPointerLeave={handleActionRelease}
              className={`relative flex items-center justify-between px-4 py-3.5 rounded-xl border transition active:scale-95 ${
                activeAction === 'HARPOON'
                  ? 'border-[#FFE600] bg-[#FFE600] text-black shadow-[0_0_25px_rgba(255,230,0,0.8)]'
                  : 'border-[#FFE600]/50 bg-[#FFE600]/15 text-[#FFE600]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Crosshair size={20} weight="bold" />
                <span className="font-['Orbitron'] text-xs font-black">
                  {isP1 ? 'ANCHOR' : 'HARPOON'}
                </span>
              </div>
              <span className="text-[10px] font-bold opacity-80">ACT</span>
            </button>

            {/* Defense / Special Button */}
            <button
              type="button"
              onPointerDown={() => handleActionPress('SHIELD')}
              onPointerUp={handleActionRelease}
              onPointerLeave={handleActionRelease}
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
          <span>TOUCH SENSOR CALIBRATED</span>
        </div>
        <div className="text-gray-400">
          MODE: <span className="text-white font-bold">{isP1 ? 'P1 PILOT' : 'P2 GUNNER'}</span>
        </div>
      </footer>
    </div>
  )
}

export default ControllerView
