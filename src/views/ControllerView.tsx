import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Flame,
  Crosshair,
  Vibrate,
  WifiHigh,
  Desktop,
  RocketLaunch,
  WarningCircle,
  ArrowsClockwise,
  Lightning,
  ArrowsLeftRight,
  HandPointing,
  Compass
} from '@phosphor-icons/react'
import { useControllerPeer } from '../hooks/useControllerPeer'
import { useDeviceOrientation } from '../hooks/useDeviceOrientation'

export const ControllerView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const targetRoom = searchParams.get('room') || 'AST1'

  // WebRTC DataChannel networking hook
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

  // Gyroscope / Device orientation sensor hook
  const {
    permissionState: gyroPermission,
    steer: gyroSteer,
    rawGamma,
    requestPermission: requestGyroPermission,
    calibrate: calibrateGyro
  } = useDeviceOrientation()

  // Manual fallback touch steer
  const [touchSteer, setTouchSteer] = useState<number>(0)
  const [useManualSteer, setUseManualSteer] = useState<boolean>(false)

  // Active touch states
  const [isDashing, setIsDashing] = useState<boolean>(false)
  const [isReeling, setIsReeling] = useState<boolean>(false)
  const [thrustPercent, setThrustPercent] = useState<number>(0)
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true)

  // Slider refs for coordinate calculation
  const thrustTrackRef = useRef<HTMLDivElement>(null)
  const steerTrackRef = useRef<HTMLDivElement>(null)

  // Player theme styling (P1 Cyan #00F0FF / P2 Pink #FF2A85)
  const effectiveSlot = playerSlot || 1
  const isP1 = effectiveSlot === 1
  const themeColor = isP1 ? '#00F0FF' : '#FF2A85'

  // Micro haptic pulse on interactions
  const triggerTouchHaptic = useCallback((duration = 20) => {
    if (hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration)
      } catch {
        // Ignored if device does not support or restrict vibration
      }
    }
  }, [hapticEnabled])

  // Determine effective steer: gyro (if granted and not forced manual) or touch steer fallback
  const isGyroActive = gyroPermission === 'granted' && !useManualSteer
  const activeSteer = isGyroActive ? gyroSteer : touchSteer

  // Sync inputs to the 40Hz WebRTC dispatcher
  useEffect(() => {
    setInputState({
      steer: activeSteer,
      thrust: Number((thrustPercent / 100).toFixed(3)),
      reel: isReeling,
      boost: isDashing
    })
  }, [activeSteer, thrustPercent, isReeling, isDashing, setInputState])

  // --- Vertical Spring-Slider for Thrust (0% to 100%, springs back to 0 on release) ---
  const handleThrustPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    triggerTouchHaptic(25)
    updateThrustFromPointer(e.clientY)
  }

  const handleThrustPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 || e.pressure > 0) {
      updateThrustFromPointer(e.clientY)
    }
  }

  const handleThrustPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    // Spring back to 0
    setThrustPercent(0)
    triggerTouchHaptic(15)
  }

  const updateThrustFromPointer = (clientY: number) => {
    if (!thrustTrackRef.current) return
    const rect = thrustTrackRef.current.getBoundingClientRect()
    // 0% at bottom, 100% at top
    const relativeY = rect.bottom - clientY
    const fraction = Math.max(0, Math.min(1, relativeY / rect.height))
    setThrustPercent(Math.round(fraction * 100))
  }

  // --- Horizontal Spring-Slider for Fallback Touch Steer (-1.0 to +1.0, springs to 0 on release) ---
  const handleSteerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    triggerTouchHaptic(20)
    updateSteerFromPointer(e.clientX)
  }

  const handleSteerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 || e.pressure > 0) {
      updateSteerFromPointer(e.clientX)
    }
  }

  const handleSteerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    // Spring back to center
    setTouchSteer(0)
    triggerTouchHaptic(15)
  }

  const updateSteerFromPointer = (clientX: number) => {
    if (!steerTrackRef.current) return
    const rect = steerTrackRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const diff = clientX - centerX
    const halfWidth = rect.width / 2
    const normalized = Math.max(-1, Math.min(1, diff / halfWidth))
    setTouchSteer(Number(normalized.toFixed(3)))
  }

  // --- Action Button Handlers ---
  const handleDashDown = () => {
    setIsDashing(true)
    triggerTouchHaptic(35)
  }

  const handleDashUp = () => {
    setIsDashing(false)
  }

  const handleReelDown = () => {
    setIsReeling(true)
    triggerTouchHaptic(40)
  }

  const handleReelUp = () => {
    setIsReeling(false)
  }

  // Room full view
  if (connectionState === 'ROOM_FULL') {
    return (
      <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none touch-none">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF2A85]/20 text-[#FF2A85] border border-[#FF2A85]/40 shadow-[0_0_30px_rgba(255,42,133,0.5)] mb-6">
          <WarningCircle size={48} weight="fill" />
        </div>
        <h2 className="font-['Orbitron'] text-xl font-black text-white tracking-wider mb-2">
          ROOM IS FULL
        </h2>
        <p className="text-sm text-gray-400 max-w-xs mb-6">
          Room <span className="font-mono text-[#FFE600] font-bold">{roomId}</span> already has 2 active controllers (P1 & P2).
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
      <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none touch-none">
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
          Negotiating low-latency P2P DataChannel...
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between p-3 select-none touch-none overflow-hidden overscroll-none">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-[100px] transition-colors duration-500"
        style={{ backgroundColor: `${themeColor}25` }}
      />

      {/* Top Header Bar */}
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

        {/* Status Indicators & Toggles */}
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
            title="Desktop Host Screen"
          >
            <Desktop size={16} />
          </Link>
        </div>
      </header>

      {/* Disconnect Alert if connection lost */}
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

      {/* iOS Gyroscope Permission Prompt Banner */}
      {gyroPermission === 'prompt' && (
        <div className="relative z-10 my-1 flex items-center justify-between rounded-xl border border-[#FFE600]/40 bg-[#FFE600]/10 p-2 text-xs">
          <div className="flex items-center gap-2 text-[#FFE600] font-['Rajdhani'] font-bold">
            <Compass size={18} className="animate-spin" />
            <span>SAFARI IOS: GYRO REQUIRED FOR TILT STEERING</span>
          </div>
          <button
            type="button"
            onClick={requestGyroPermission}
            className="rounded-lg bg-[#FFE600] px-3 py-1 font-['Orbitron'] text-[11px] font-black text-black shadow-[0_0_12px_rgba(255,230,0,0.6)] active:scale-95 transition"
          >
            ENABLE GYRO
          </button>
        </div>
      )}

      {/* Center Top: SYNC DASH Button (Pill Action Button) */}
      <div className="relative z-10 my-1 flex justify-center">
        <button
          type="button"
          onPointerDown={handleDashDown}
          onPointerUp={handleDashUp}
          onPointerCancel={handleDashUp}
          className={`w-full max-w-xs py-3 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-150 active:scale-95 ${
            isDashing
              ? 'border-[#FFE600] bg-[#FFE600] text-black shadow-[0_0_30px_rgba(255,230,0,0.9)] scale-95'
              : 'border-[#FFE600]/50 bg-[#FFE600]/15 text-[#FFE600] shadow-[0_0_15px_rgba(255,230,0,0.3)]'
          }`}
        >
          <Lightning size={22} weight="fill" className={isDashing ? 'animate-bounce' : ''} />
          <span className="font-['Orbitron'] text-xs font-black tracking-widest">
            {isDashing ? 'SYNC DASH ENGAGED!' : 'SYNC DASH (BOOST)'}
          </span>
        </button>
      </div>

      {/* Main Cockpit Flight Controls (Left: Vertical Spring Thrust | Center: Horizon/Steer | Right: Big Reel Button) */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-3 items-center py-2">
        {/* LEFT COLUMN: Vertical Spring-Slider for Thrust (0% to 100%) */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flame size={16} weight="fill" className="text-[#FF2A85]" />
            <span className="text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-300">
              THRUST
            </span>
          </div>

          {/* Vertical Slider Track Container */}
          <div
            ref={thrustTrackRef}
            onPointerDown={handleThrustPointerDown}
            onPointerMove={handleThrustPointerMove}
            onPointerUp={handleThrustPointerUp}
            onPointerCancel={handleThrustPointerUp}
            className="relative w-20 h-52 rounded-2xl border border-white/20 bg-black/60 p-1.5 flex flex-col justify-end overflow-hidden shadow-2xl backdrop-blur-md active:border-[#00F0FF]/60 cursor-pointer"
          >
            {/* Level Fill Indicator */}
            <div
              className="w-full rounded-xl transition-all duration-75 relative flex items-center justify-center"
              style={{
                height: `${thrustPercent}%`,
                background: `linear-gradient(to top, ${themeColor}88, ${themeColor})`,
                boxShadow: `0 0 20px ${themeColor}`
              }}
            >
              {thrustPercent > 15 && (
                <span className="font-['Orbitron'] text-[11px] font-black text-black">
                  {thrustPercent}%
                </span>
              )}
            </div>

            {/* Slider Track Rulers / Markings */}
            <div className="pointer-events-none absolute inset-x-2 top-3 bottom-3 flex flex-col justify-between opacity-30 text-[8px] font-mono text-white">
              <div className="border-b border-white/50 w-full text-right pr-1">100</div>
              <div className="border-b border-white/30 w-1/2 ml-auto" />
              <div className="border-b border-white/50 w-full text-right pr-1">50</div>
              <div className="border-b border-white/30 w-1/2 ml-auto" />
              <div className="border-b border-white/50 w-full text-right pr-1">0</div>
            </div>

            {/* Spring Hint if at 0% */}
            {thrustPercent === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <HandPointing size={20} className="text-gray-400 animate-bounce mb-1" />
                <span className="text-[9px] font-['Rajdhani'] font-bold text-gray-400">
                  SLIDE UP
                </span>
              </div>
            )}
          </div>

          <span className="mt-1 font-mono text-[10px] text-gray-400 font-bold">
            {thrustPercent}% (SPRING)
          </span>
        </div>

        {/* CENTER COLUMN: Steering Telemetry / Horizon Leveler & Fallback Slider */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full px-1">
          {/* Gyro vs Manual mode toggle */}
          <button
            type="button"
            onClick={() => setUseManualSteer(!useManualSteer)}
            className="flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-['Orbitron'] font-bold text-gray-300 hover:text-white transition"
          >
            <Compass size={12} className={isGyroActive ? 'text-[#00F0FF]' : 'text-gray-500'} />
            <span>{isGyroActive ? 'GYRO TILT' : 'TOUCH SLIDER'}</span>
          </button>

          {/* If Gyro is Active: Show Neon Artificial Horizon */}
          {isGyroActive ? (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="relative w-full h-24 rounded-2xl border border-white/10 bg-black/50 p-2 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                {/* Center crosshair */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-8 h-[1px] bg-white" />
                  <div className="h-8 w-[1px] bg-white absolute" />
                </div>

                {/* Horizon Line tilted by gamma */}
                <div
                  className="w-24 h-1 rounded-full transition-transform duration-75 shadow-lg"
                  style={{
                    backgroundColor: themeColor,
                    boxShadow: `0 0 12px ${themeColor}`,
                    transform: `rotate(${(rawGamma || 0) * 1.5}deg) translateX(${activeSteer * 20}px)`
                  }}
                />

                {/* Steer bubble */}
                <div
                  className="absolute bottom-2 h-3 w-3 rounded-full bg-white shadow-[0_0_10px_white] transition-transform duration-75"
                  style={{
                    transform: `translateX(${activeSteer * 40}px)`
                  }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between w-full text-[10px] font-['Rajdhani'] font-bold text-gray-400">
                <span>STEER: {activeSteer.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={calibrateGyro}
                  className="text-[#FFE600] underline"
                >
                  CALIBRATE
                </button>
              </div>
            </div>
          ) : (
            /* Fallback Horizontal Spring-Slider */
            <div className="w-full flex flex-col items-center justify-center">
              <span className="text-[9px] font-['Orbitron'] font-bold text-gray-400 mb-1">
                TOUCH STEER
              </span>
              <div
                ref={steerTrackRef}
                onPointerDown={handleSteerPointerDown}
                onPointerMove={handleSteerPointerMove}
                onPointerUp={handleSteerPointerUp}
                onPointerCancel={handleSteerPointerUp}
                className="relative w-full h-16 rounded-xl border border-white/20 bg-black/60 p-1 flex items-center justify-center cursor-pointer shadow-inner active:border-[#00F0FF]/50"
              >
                {/* Center marker */}
                <div className="pointer-events-none absolute h-full w-[2px] bg-white/30" />

                {/* Sliding indicator knob */}
                <div
                  className="h-12 w-8 rounded-lg flex items-center justify-center transition-transform duration-75 shadow-lg"
                  style={{
                    backgroundColor: themeColor,
                    boxShadow: `0 0 15px ${themeColor}`,
                    transform: `translateX(${touchSteer * 35}px)`
                  }}
                >
                  <ArrowsLeftRight size={16} className="text-black" />
                </div>
              </div>
              <span className="mt-1 font-mono text-[10px] text-gray-400">
                {touchSteer > 0 ? `+${touchSteer.toFixed(2)} R` : `${touchSteer.toFixed(2)} L`}
              </span>
            </div>
          )}

          {/* Telemetry / Host Feedback Message */}
          {latestFeedback && (
            <div className="mt-2 w-full text-center rounded-lg border border-[#FFE600]/30 bg-[#FFE600]/10 py-1 px-2 text-[10px] font-['Orbitron'] text-[#FFE600]">
              {latestFeedback.e}: {latestFeedback.intensity || 'PULSE'}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Big Action Button for "REEL TETHER" (Pull) */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Crosshair size={16} weight="bold" className="text-[#00F0FF]" />
            <span className="text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-300">
              HARPOON
            </span>
          </div>

          <button
            type="button"
            onPointerDown={handleReelDown}
            onPointerUp={handleReelUp}
            onPointerCancel={handleReelUp}
            className={`relative h-44 w-24 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-100 active:scale-95 shadow-2xl backdrop-blur-md cursor-pointer ${
              isReeling
                ? 'border-[#00F0FF] bg-[#00F0FF] text-black shadow-[0_0_35px_rgba(0,240,255,0.9)] scale-95'
                : 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
                isReeling
                  ? 'border-black bg-black text-[#00F0FF]'
                  : 'border-[#00F0FF]/60 bg-[#00F0FF]/20 text-[#00F0FF]'
              }`}
            >
              <Crosshair size={32} weight="bold" className={isReeling ? 'animate-spin' : ''} />
            </div>

            <div className="text-center px-1">
              <span className="block font-['Orbitron'] text-xs font-black tracking-wider">
                {isReeling ? 'REELING!' : 'REEL'}
              </span>
              <span className="block font-['Rajdhani'] text-[10px] font-bold opacity-80 mt-0.5">
                PULL TETHER
              </span>
            </div>
          </button>

          <span className="mt-1 font-mono text-[10px] text-gray-400 font-bold">
            {isReeling ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </main>

      {/* Controller Footer Diagnostics */}
      <footer className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>TOUCH SENSOR @ 40Hz</span>
        </div>
        <div className="text-gray-400">
          TETHER STRAIN: <span className="text-white font-bold">{currentInputState.thrust > 0 ? 'TIGHT' : 'SLACK'}</span>
        </div>
      </footer>
    </div>
  )
}

export default ControllerView
