import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import {
  Flame,
  Crosshair,
  Vibrate,
  WifiHigh,
  WarningCircle,
  ArrowsClockwise,
  Lightning,
  ArrowsLeftRight,
  HandPointing,
  Compass,
  SignOut,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import { useControllerPeer } from '../hooks/useControllerPeer'
import { useDeviceOrientation } from '../hooks/useDeviceOrientation'
import { useLanguage } from '../context/LanguageContext'
import { AstroLogo } from '../components/AstroLogo'
import { LanguageSelector } from '../components/LanguageSelector'
import { ShipPreview } from '../components/ShipPreview'
import { ALL_SHIP_SHAPES } from '../utils/shipRenderers'
import { type ShipShape, type PlayerSlot } from '../types/network'

export const ControllerView: React.FC = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetRoom = searchParams.get('room')
  const preferredSlotParam = Number(searchParams.get('slot'))
  const preferredSlot: PlayerSlot | undefined =
    preferredSlotParam === 1 || preferredSlotParam === 2 ? preferredSlotParam : undefined

  // If accessed without a room code, redirect to dedicated mobile room entry portal
  if (!targetRoom) {
    return <Navigate to="/join" replace />
  }

  // WebRTC DataChannel networking hook with liveness heartbeat & slot preference
  const {
    connectionState,
    playerSlot,
    roomId,
    setInputState,
    latestFeedback,
    latencyMs,
    errorMessage,
    requestSlotSwap,
    reconnect
  } = useControllerPeer(targetRoom, preferredSlot)

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
  const [wheelAngle, setWheelAngle] = useState<number>(0)
  const [useManualSteer, setUseManualSteer] = useState<boolean>(false)

  // Active touch states
  const [isDashing, setIsDashing] = useState<boolean>(false)
  const [isReeling, setIsReeling] = useState<boolean>(false)
  const [thrustPercent, setThrustPercent] = useState<number>(0)
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true)

  // Active drag and gesture states
  const [isThrustActive, setIsThrustActive] = useState<boolean>(false)
  const [isSteerActive, setIsSteerActive] = useState<boolean>(false)
  const isThrustDraggingRef = useRef<boolean>(false)
  const isSteerDraggingRef = useRef<boolean>(false)
  const thrustRafRef = useRef<number | null>(null)
  const steerRafRef = useRef<number | null>(null)

  // Slider refs for coordinate calculation
  const thrustTrackRef = useRef<HTMLDivElement>(null)
  const steerTrackRef = useRef<HTMLDivElement>(null)
  const thrustTrackRectRef = useRef<DOMRect | null>(null)
  const steerTrackRectRef = useRef<DOMRect | null>(null)
  const lastAngleRadRef = useRef<number | null>(null)
  const accumulatedWheelAngleRef = useRef<number>(0)

  // Cancel any pending RAFs on unmount
  useEffect(() => {
    return () => {
      if (thrustRafRef.current) cancelAnimationFrame(thrustRafRef.current)
      if (steerRafRef.current) cancelAnimationFrame(steerRafRef.current)
    }
  }, [])

  // Player theme styling (P1 Cyan #00F0FF / P2 Pink #FF2A85)
  const effectiveSlot = playerSlot || 1
  const isP1 = effectiveSlot === 1
  const themeColor = isP1 ? '#00F0FF' : '#FF2A85'

  // Selected spacecraft hull shape customization
  const [selectedShape, setSelectedShape] = useState<ShipShape>(isP1 ? 'dart' : 'manta')

  const handlePrevShape = () => {
    const idx = ALL_SHIP_SHAPES.indexOf(selectedShape)
    const nextIdx = (idx - 1 + ALL_SHIP_SHAPES.length) % ALL_SHIP_SHAPES.length
    setSelectedShape(ALL_SHIP_SHAPES[nextIdx])
    triggerTouchHaptic(15)
  }

  const handleNextShape = () => {
    const idx = ALL_SHIP_SHAPES.indexOf(selectedShape)
    const nextIdx = (idx + 1) % ALL_SHIP_SHAPES.length
    setSelectedShape(ALL_SHIP_SHAPES[nextIdx])
    triggerTouchHaptic(15)
  }

  const handleExit = () => {
    if (window.confirm(t('exitConfirm'))) {
      navigate('/join')
    }
  }

  const getShipName = (shape: ShipShape) => {
    switch (shape) {
      case 'dart': return t('shipDartName')
      case 'manta': return t('shipMantaName')
      case 'ring': return t('shipRingName')
      case 'saucer': return t('shipSaucerName')
      case 'scarab': return t('shipScarabName')
      case 'jelly': return t('shipJellyName')
    }
  }

  const getShipDesc = (shape: ShipShape) => {
    switch (shape) {
      case 'dart': return t('shipDartDesc')
      case 'manta': return t('shipMantaDesc')
      case 'ring': return t('shipRingDesc')
      case 'saucer': return t('shipSaucerDesc')
      case 'scarab': return t('shipScarabDesc')
      case 'jelly': return t('shipJellyDesc')
    }
  }

  // Micro haptic pulse on interactions
  const triggerTouchHaptic = useCallback((duration: number | number[] = 20) => {
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
      boost: isDashing,
      shape: selectedShape
    })
  }, [activeSteer, thrustPercent, isReeling, isDashing, selectedShape, setInputState])

  // --- Vertical Slider for Thrust (Cruise / Sticky by default, or Spring mode) ---
  const handleThrustPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isThrustDraggingRef.current = true
    setIsThrustActive(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    if (thrustTrackRef.current) {
      thrustTrackRectRef.current = thrustTrackRef.current.getBoundingClientRect()
    }
    triggerTouchHaptic(25)
    updateThrustFromPointer(e.clientY)
  }

  const handleThrustPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isThrustDraggingRef.current) return
    const clientY = e.clientY
    if (thrustRafRef.current) {
      cancelAnimationFrame(thrustRafRef.current)
    }
    thrustRafRef.current = requestAnimationFrame(() => {
      updateThrustFromPointer(clientY)
    })
  }

  const handleThrustPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isThrustDraggingRef.current = false
    setIsThrustActive(false)
    thrustTrackRectRef.current = null
    if (thrustRafRef.current) {
      cancelAnimationFrame(thrustRafRef.current)
      thrustRafRef.current = null
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    setThrustPercent(0) // Automatically returns to 0 on finger release
  }

  const handleThrustPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isThrustDraggingRef.current = false
    setIsThrustActive(false)
    thrustTrackRectRef.current = null
    if (thrustRafRef.current) {
      cancelAnimationFrame(thrustRafRef.current)
      thrustRafRef.current = null
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    setThrustPercent(0) // Automatically returns to 0 on gesture cancel
  }

  const updateThrustFromPointer = (clientY: number) => {
    const rect = thrustTrackRectRef.current || thrustTrackRef.current?.getBoundingClientRect()
    if (!rect) return
    // Calculate inverted progress (top = 100%, bottom = 0%)
    const rawRatio = (rect.bottom - clientY) / rect.height
    const clamped = Math.max(0, Math.min(100, Math.round(rawRatio * 100)))
    setThrustPercent(clamped)
  }

  // --- 360-Degree Relative Rotational Steering Wheel Handlers (Zero Initial Snap) ---
  const handleSteerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isSteerDraggingRef.current = true
    setIsSteerActive(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    if (steerTrackRef.current) {
      steerTrackRectRef.current = steerTrackRef.current.getBoundingClientRect()
    }
    const rect = steerTrackRectRef.current || steerTrackRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      lastAngleRadRef.current = Math.atan2(e.clientX - centerX, -(e.clientY - centerY))
    }
    triggerTouchHaptic(20)
    // Wheel angle stays at neutral 0 until moved - no initial snap!
  }

  const handleSteerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSteerDraggingRef.current) return
    const clientX = e.clientX
    const clientY = e.clientY
    if (steerRafRef.current) {
      cancelAnimationFrame(steerRafRef.current)
    }
    steerRafRef.current = requestAnimationFrame(() => {
      updateSteerFromPointer(clientX, clientY)
    })
  }

  const handleSteerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isSteerDraggingRef.current = false
    setIsSteerActive(false)
    steerTrackRectRef.current = null
    accumulatedWheelAngleRef.current = 0
    lastAngleRadRef.current = null
    if (steerRafRef.current) {
      cancelAnimationFrame(steerRafRef.current)
      steerRafRef.current = null
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    setTouchSteer(0)
    setWheelAngle(0)
  }

  const handleSteerPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isSteerDraggingRef.current = false
    setIsSteerActive(false)
    steerTrackRectRef.current = null
    accumulatedWheelAngleRef.current = 0
    lastAngleRadRef.current = null
    if (steerRafRef.current) {
      cancelAnimationFrame(steerRafRef.current)
      steerRafRef.current = null
    }
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    setTouchSteer(0)
    setWheelAngle(0)
  }

  const updateSteerFromPointer = (clientX: number, clientY: number) => {
    const rect = steerTrackRectRef.current || steerTrackRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY

    // Minimum distance from center
    const dist = Math.hypot(dx, dy)
    if (dist < 10) return

    const currentAngleRad = Math.atan2(dx, -dy)

    if (lastAngleRadRef.current === null) {
      lastAngleRadRef.current = currentAngleRad
      return
    }

    // Relative displacement between consecutive frames
    let deltaRad = currentAngleRad - lastAngleRadRef.current

    // Handle wrap-around across -PI / +PI boundary (6 o'clock)
    if (deltaRad < -Math.PI) deltaRad += Math.PI * 2
    if (deltaRad > Math.PI) deltaRad -= Math.PI * 2

    lastAngleRadRef.current = currentAngleRad

    // Accumulate rotation smoothly
    const deltaDeg = (deltaRad * 180) / Math.PI
    accumulatedWheelAngleRef.current += deltaDeg

    // Max realistic steering wheel rotation lock: +/- 150 degrees
    const MAX_ROTATION_DEG = 150
    accumulatedWheelAngleRef.current = Math.max(
      -MAX_ROTATION_DEG,
      Math.min(MAX_ROTATION_DEG, accumulatedWheelAngleRef.current)
    )

    const currentDeg = Math.round(accumulatedWheelAngleRef.current)
    setWheelAngle(currentDeg)

    // Sensitivity mapping: 120 degrees of rotation reaches full left/right lock (1.0)
    const MAX_LOCK_DEG = 120
    const DEADZONE_DEG = 3

    let normalized = 0
    if (Math.abs(currentDeg) > DEADZONE_DEG) {
      normalized = Math.max(-1.0, Math.min(1.0, currentDeg / MAX_LOCK_DEG))
    }

    setTouchSteer(Number(normalized.toFixed(2)))
  }

  // Reel button touch handler
  const handleReelDown = () => {
    setIsReeling(true)
    triggerTouchHaptic(40)
  }

  const handleReelUp = () => {
    setIsReeling(false)
  }

  // Dash button touch handler
  const handleDashDown = () => {
    setIsDashing(true)
    triggerTouchHaptic([30, 20, 30])
  }

  const handleDashUp = () => {
    setIsDashing(false)
  }

  // Room Full view
  if (connectionState === 'ROOM_FULL') {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/40 bg-red-500/10 shadow-[0_0_35px_rgba(255,42,133,0.3)] mb-6">
          <WarningCircle size={44} className="text-[#FF2A85]" />
        </div>
        <h2 className="font-['Orbitron'] text-xl font-black text-white tracking-wider mb-2">
          ROOM ALREADY FULL
        </h2>
        <p className="text-xs text-gray-400 max-w-xs mb-6">
          Room <span className="text-[#FFE600] font-bold font-mono">{roomId}</span> already has two connected pilots. Please create or join a new room.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/join')}
            className="rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black px-6 py-3 font-['Orbitron'] text-xs font-black hover:brightness-110 active:scale-95 transition"
          >
            JOIN ANOTHER ROOM
          </button>
          <Link
            to="/host"
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-['Orbitron'] text-xs font-bold text-white hover:bg-white/20 transition"
          >
            HOST A NEW GAME
          </Link>
        </div>
      </div>
    )
  }

  // Connecting view
  if (connectionState === 'CONNECTING') {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
        <div className="relative mb-6">
          <AstroLogo size={64} />
          <div className="absolute inset-0 rounded-full border border-[#00F0FF] animate-ping opacity-30" />
        </div>
        <h2 className="font-['Orbitron'] text-base font-bold text-white tracking-wider mb-1">
          {t('connectingToHost')}
        </h2>
        <p className="text-xs text-gray-400 font-mono mb-4">
          {t('roomLabel')}: <span className="text-[#FFE600] font-bold">{roomId}</span>
        </p>
        <LanguageSelector className="mt-2" />
        <button
          type="button"
          onClick={() => navigate('/join')}
          className="mt-6 text-xs text-gray-500 hover:text-gray-300 underline font-mono"
        >
          Cancel & Return to Join Screen
        </button>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#0B0F19] text-gray-100 flex flex-col justify-between p-3 pb-16 select-none overflow-y-auto overscroll-y-contain landscape:p-2 landscape:pb-10">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-[100px] transition-colors duration-500"
        style={{ backgroundColor: `${themeColor}25` }}
      />

      {/* Top Header Bar - Structured 2 Rows to Prevent Overlapping */}
      <header className="relative z-10 space-y-2 border-b border-white/10 pb-2.5">
        {/* Row 1: Brand & Key Navigation Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AstroLogo size={28} />
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] text-xs font-black tracking-wider text-white">
                ASTRO<span style={{ color: themeColor }}>TETHER</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-[#FFE600] bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                {roomId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageSelector showIcon={false} />
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 active:scale-95 transition"
              title={t('exitBtn')}
            >
              <SignOut size={14} weight="bold" />
              <span className="text-[10px] font-bold font-mono">{t('exitBtn')}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Role Pod Badge, Live Swap Button, & Telemetry */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-xl text-[10px] font-['Orbitron'] font-black tracking-wider border flex items-center gap-1.5 shadow-sm"
              style={{
                borderColor: `${themeColor}60`,
                backgroundColor: `${themeColor}20`,
                color: themeColor
              }}
            >
              <span
                className="h-2 w-2 rounded-full animate-ping"
                style={{ backgroundColor: themeColor }}
              />
              {isP1 ? t('podAlphaName') : t('podBetaName')}
            </span>

            {/* Live Pod / Role Swap Button */}
            <button
              type="button"
              onClick={() => {
                requestSlotSwap()
                triggerTouchHaptic(25)
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl border border-white/20 bg-white/10 text-[10px] font-['Orbitron'] font-bold text-gray-200 hover:bg-white/20 hover:text-white active:scale-95 transition"
              title={isP1 ? t('swapToPink') : t('swapToCyan')}
            >
              <ArrowsLeftRight size={13} className="text-[#FFE600]" />
              <span>{t('switchPodBtn')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`p-1.5 rounded-lg border border-white/10 transition ${
                hapticEnabled ? 'bg-white/10 text-[#FFE600]' : 'bg-transparent text-gray-600'
              }`}
              title="Toggle Vibration"
            >
              <Vibrate size={15} />
            </button>

            <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400 font-mono">
              <WifiHigh size={12} />
              <span>{latencyMs > 0 ? `${latencyMs}ms` : '40Hz'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Ship Hull Customizer Carousel */}
      <div className="relative z-10 my-2 landscape:my-1 px-3 py-2 landscape:py-1 rounded-2xl border border-white/10 bg-[#060911]/90 backdrop-blur-md flex items-center justify-between shadow-xl gap-2">
        <button
          type="button"
          onClick={handlePrevShape}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white active:scale-90 transition shrink-0"
          title="Previous Ship"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ShipPreview shape={selectedShape} color={themeColor} size={44} />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
              {t('shipSelectTitle')}
            </div>
            <div className="font-['Orbitron'] text-xs font-black truncate" style={{ color: themeColor }}>
              {getShipName(selectedShape)}
            </div>
            <p className="text-[10px] text-gray-400 font-['Space_Grotesk'] line-clamp-2 leading-tight">
              {getShipDesc(selectedShape)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextShape}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white active:scale-90 transition shrink-0"
          title="Next Ship"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      {/* Room Expired / Host Refreshed Modal Overlay */}
      {connectionState === 'ROOM_EXPIRED' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-3xl border border-red-500/30 bg-[#0B0F19] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="h-14 w-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <WarningCircle size={32} weight="bold" />
            </div>
            <h2 className="font-['Orbitron'] text-lg font-black text-white">
              {t('roomExpiredTitle')}
            </h2>
            <p className="text-xs text-gray-400 font-['Space_Grotesk'] leading-relaxed">
              {errorMessage || t('roomExpiredDesc')}
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/join')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black font-['Orbitron'] text-xs font-black tracking-wider hover:brightness-110 active:scale-95 transition"
              >
                {t('enterNewRoomBtn')}
              </button>
              <button
                type="button"
                onClick={reconnect}
                className="w-full py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 text-gray-300 font-['Orbitron'] text-xs font-bold hover:bg-white/10 active:scale-95 transition"
              >
                {t('returnToLobbyBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <span>{t('gyroRequestTitle')}</span>
          </div>
          <button
            type="button"
            onClick={requestGyroPermission}
            className="rounded-lg bg-[#FFE600] px-3 py-1 font-['Orbitron'] text-[11px] font-black text-black shadow-[0_0_12px_rgba(255,230,0,0.6)] active:scale-95 transition"
          >
            {t('enableMotionBtn')}
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
          className={`w-full max-w-xs py-2.5 px-6 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-150 active:scale-95 select-none ${
            isDashing
              ? 'border-[#FFE600] bg-[#FFE600] text-black shadow-[0_0_30px_rgba(255,230,0,0.9)] scale-95'
              : 'border-[#FFE600]/50 bg-[#FFE600]/15 text-[#FFE600] shadow-[0_0_15px_rgba(255,230,0,0.3)]'
          }`}
        >
          <Lightning size={20} weight="fill" className={isDashing ? 'animate-bounce' : ''} />
          <span className="font-['Orbitron'] text-xs font-black tracking-widest">
            {isDashing ? 'BOOSTING!' : t('syncDashBtn')}
          </span>
        </button>
      </div>

      {/* Main Cockpit Flight Controls (Left: Vertical Thrust | Center: Horizon/Steering Wheel | Right: Big Reel Button) */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-3 items-center py-2">
        {/* LEFT COLUMN: Vertical Slider for Thrust (Auto-returns to 0 on release) */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-1 mb-1.5 px-0.5">
            <Flame size={14} weight="fill" className="text-[#FF2A85]" />
            <span className="text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-300">
              {t('thrustLabel')}
            </span>
          </div>

          {/* Vertical Slider Track Container */}
          <div
            ref={thrustTrackRef}
            onPointerDown={handleThrustPointerDown}
            onPointerMove={handleThrustPointerMove}
            onPointerUp={handleThrustPointerUp}
            onPointerCancel={handleThrustPointerCancel}
            className="relative w-20 h-44 landscape:h-36 rounded-2xl border border-white/20 bg-black/60 p-1.5 flex flex-col justify-end overflow-hidden shadow-2xl backdrop-blur-md active:border-[#00F0FF]/60 cursor-pointer touch-none select-none"
          >
            {/* Level Fill Indicator */}
            <div
              className={`w-full rounded-xl relative flex items-center justify-center pointer-events-none ${
                isThrustActive ? 'transition-none' : 'transition-all duration-150 ease-out'
              }`}
              style={{
                height: `${thrustPercent}%`,
                background: `linear-gradient(to top, ${themeColor}88, ${themeColor})`,
                boxShadow: `0 0 20px ${themeColor}`,
                willChange: 'height'
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
                  {t('thrustSliderLabel')}
                </span>
              </div>
            )}
          </div>

          <div className="mt-1 flex items-center justify-center w-20 text-[9px] font-mono px-0.5">
            <span className="font-bold text-gray-300">
              {thrustPercent}%
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: Steering Telemetry / Horizon Leveler & Fallback Slider */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full px-1">
          {/* Gyro vs Manual mode toggle */}
          <button
            type="button"
            onClick={() => setUseManualSteer(!useManualSteer)}
            className="flex items-center gap-1 mb-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-['Orbitron'] font-bold text-gray-300 hover:text-white transition"
          >
            <Compass size={12} className={isGyroActive ? 'text-[#00F0FF]' : 'text-gray-500'} />
            <span>{isGyroActive ? 'GYRO' : 'TOUCH'}</span>
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

              <div className="mt-1.5 flex items-center justify-between w-full text-[10px] font-['Rajdhani'] font-bold text-gray-400">
                <span>{activeSteer.toFixed(2)}</span>
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
            /* Futuristic Cyberpunk Steering Wheel / Flight Yoke */
            <div className="w-full flex flex-col items-center justify-center">
              <div className="flex items-center justify-between w-full max-w-[160px] mb-1 px-1 text-[9px] font-mono font-bold">
                <span className="text-gray-400 flex items-center gap-1 font-['Orbitron']">
                  <Compass size={11} className="text-[#00F0FF]" />
                  STEER
                </span>
                <span style={{ color: themeColor }}>
                  {wheelAngle !== 0 ? `${wheelAngle > 0 ? '+' : ''}${wheelAngle}°` : 'CENTER'}
                </span>
              </div>

              {/* Touch Drag Wheel Housing */}
              <div
                ref={steerTrackRef}
                onPointerDown={handleSteerPointerDown}
                onPointerMove={handleSteerPointerMove}
                onPointerUp={handleSteerPointerUp}
                onPointerCancel={handleSteerPointerCancel}
                className="relative w-40 h-40 landscape:w-32 landscape:h-32 rounded-full border-2 border-white/15 bg-black/70 flex items-center justify-center cursor-pointer shadow-2xl active:border-[#00F0FF]/50 touch-none select-none backdrop-blur-md"
              >
                {/* Center crosshair guides */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
                  <div className="w-full h-[1px] bg-white" />
                  <div className="h-full w-[1px] bg-white absolute" />
                </div>

                {/* Rotating Wheel / Yoke */}
                <div
                  className={`relative w-32 h-32 landscape:w-26 landscape:h-26 rounded-full flex items-center justify-center pointer-events-none ${
                    isSteerActive ? 'transition-none' : 'transition-transform duration-200 ease-out'
                  }`}
                  style={{
                    transform: `rotate(${wheelAngle}deg)`,
                    willChange: 'transform'
                  }}
                >
                  {/* Outer Rim Ring */}
                  <div
                    className="absolute inset-0 rounded-full border-4 shadow-lg"
                    style={{
                      borderColor: themeColor,
                      boxShadow: isSteerActive ? `0 0 25px ${themeColor}` : `0 0 10px ${themeColor}60`
                    }}
                  />

                  {/* Top Dead-Center Alignment Notch */}
                  <div className="absolute -top-1.5 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_white] z-20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
                  </div>

                  {/* Left Spoke Grip Handle */}
                  <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-14 rounded-r-lg bg-gray-900 border-2 shadow-md flex items-center justify-center"
                    style={{ borderColor: themeColor }}
                  >
                    <div className="w-1 h-7 rounded-full bg-white/40" />
                  </div>

                  {/* Right Spoke Grip Handle */}
                  <div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-14 rounded-l-lg bg-gray-900 border-2 shadow-md flex items-center justify-center"
                    style={{ borderColor: themeColor }}
                  >
                    <div className="w-1 h-7 rounded-full bg-white/40" />
                  </div>

                  {/* Horizontal Crossbar */}
                  <div className="absolute inset-x-2 h-3 bg-gray-800/90 border-y border-white/20 rounded flex items-center justify-between px-1.5">
                    <span className="text-[6px] font-mono text-gray-400 font-bold">L</span>
                    <span className="text-[6px] font-mono text-gray-400 font-bold">R</span>
                  </div>

                  {/* Center Navigation Hub */}
                  <div
                    className="relative z-10 w-12 h-12 rounded-full bg-black/95 border-2 flex flex-col items-center justify-center shadow-inner"
                    style={{ borderColor: themeColor }}
                  >
                    <ArrowsLeftRight size={15} weight="bold" style={{ color: themeColor }} />
                    <span className="text-[7px] font-mono font-bold text-gray-300">
                      {touchSteer !== 0 ? (touchSteer > 0 ? `+${touchSteer.toFixed(2)}` : touchSteer.toFixed(2)) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Touch hint when idle */}
                {wheelAngle === 0 && !isSteerActive && (
                  <div className="pointer-events-none absolute bottom-2 flex items-center gap-1 text-[7px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>◄ ROTATE 360° ►</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Telemetry / Host Feedback Message */}
          {latestFeedback && (
            <div className="mt-2 w-full text-center rounded-lg border border-[#FFE600]/30 bg-[#FFE600]/10 py-1 px-2 text-[10px] font-['Orbitron'] text-[#FFE600]">
              {latestFeedback.e === 'COLLISION' ? t('hapticCollisionAlert') : latestFeedback.e}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Big Action Button for "REEL TETHER" (Pull) */}
        <div className="col-span-4 flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Crosshair size={16} weight="bold" className="text-[#00F0FF]" />
            <span className="text-[10px] font-['Orbitron'] font-bold tracking-wider text-gray-300">
              REEL
            </span>
          </div>

          <button
            type="button"
            onPointerDown={handleReelDown}
            onPointerUp={handleReelUp}
            onPointerCancel={handleReelUp}
            className={`relative h-44 landscape:h-36 w-24 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-100 active:scale-95 shadow-2xl backdrop-blur-md cursor-pointer select-none ${
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
                {isReeling ? 'PULLING!' : t('reelTetherBtn')}
              </span>
              <span className="block font-['Rajdhani'] text-[10px] font-bold opacity-80 mt-0.5">
                {t('reelTetherDesc')}
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
          <span>{isGyroActive ? t('gyroActive') : t('touchFallbackActive')}</span>
        </div>
        <div className="text-gray-400">
          GAS: <span className="text-white font-bold">{thrustPercent > 0 ? `${thrustPercent}%` : 'OFF'}</span>
        </div>
      </footer>
    </div>
  )
}

export default ControllerView
