import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  RocketLaunch,
  GameController,
  ShieldCheck,
  Sparkle,
  Copy,
  Check,
  Broadcast,
  ArrowsClockwise,
  Crosshair,
  Radioactive,
  DeviceMobile
} from '@phosphor-icons/react'
import { type ControllerInputPayload } from '../types/network'
import {
  playPlayerJoinSound,
  playCountdownTick,
  playSyncHoldSound,
  playWarpLaunchSequence
} from '../utils/audio'
import { useLanguage } from '../context/LanguageContext'
import { AstroLogo } from '../components/AstroLogo'
import { LanguageSelector } from '../components/LanguageSelector'

export interface HostLobbyViewProps {
  roomId: string
  player1Connected: boolean
  player2Connected: boolean
  latestInputs: {
    1: ControllerInputPayload | null
    2: ControllerInputPayload | null
  }
  onStartGame: () => void
  regenerateRoom: () => void
}

export const HostLobbyView: React.FC<HostLobbyViewProps> = ({
  roomId,
  player1Connected,
  player2Connected,
  latestInputs,
  onStartGame,
  regenerateRoom
}) => {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const controllerUrl = `${window.location.origin}/controller?room=${roomId}`

  // Track previous connection states to trigger audio cues on player joins
  const prevP1Ref = useRef(player1Connected)
  const prevP2Ref = useRef(player2Connected)

  useEffect(() => {
    if (!prevP1Ref.current && player1Connected) {
      playPlayerJoinSound(1)
    }
    prevP1Ref.current = player1Connected
  }, [player1Connected])

  useEffect(() => {
    if (!prevP2Ref.current && player2Connected) {
      playPlayerJoinSound(2)
    }
    prevP2Ref.current = player2Connected
  }, [player2Connected])

  // Co-op 2-second synchronized "Reel" hold mechanic
  const [holdProgress, setHoldProgress] = useState(0) // 0 to 100%
  const [countdown, setCountdown] = useState<number | null>(null) // 3, 2, 1, 0 (Launch)
  const holdIntervalRef = useRef<number | null>(null)

  const bothConnected = player1Connected && player2Connected
  const p1Reeling = Boolean(latestInputs[1]?.re)
  const p2Reeling = Boolean(latestInputs[2]?.re)
  const bothReeling = bothConnected && p1Reeling && p2Reeling

  // Monitor simultaneous reel holding
  useEffect(() => {
    if (countdown !== null) return // Already in countdown

    if (bothReeling) {
      if (!holdIntervalRef.current) {
        const startTime = Date.now()
        const HOLD_DURATION = 2000 // 2 seconds

        holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100)
          setHoldProgress(progress)
          playSyncHoldSound(progress)

          if (progress >= 100) {
            if (holdIntervalRef.current) {
              window.clearInterval(holdIntervalRef.current)
              holdIntervalRef.current = null
            }
            // Trigger 3-second countdown
            startCountdown()
          }
        }, 50)
      }
    } else {
      // Released early -> reset progress
      if (holdIntervalRef.current) {
        window.clearInterval(holdIntervalRef.current)
        holdIntervalRef.current = null
      }
      setHoldProgress(0)
    }

    return () => {
      if (holdIntervalRef.current) {
        window.clearInterval(holdIntervalRef.current)
      }
    }
  }, [bothReeling, countdown])

  const startCountdown = () => {
    setCountdown(3)
    playCountdownTick(false)

    let current = 3
    const timer = window.setInterval(() => {
      current--
      if (current > 0) {
        setCountdown(current)
        playCountdownTick(false)
      } else if (current === 0) {
        setCountdown(0)
        playCountdownTick(true)
        playWarpLaunchSequence()
      } else {
        window.clearInterval(timer)
        onStartGame()
      }
    }, 1000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(controllerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen bg-[#0B0F19] text-gray-100 bg-cosmic-grid overflow-hidden flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Background ambient cosmic glow */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#00F0FF]/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-[#FF2A85]/15 blur-[130px]" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-4">
          <AstroLogo size={46} showText />
        </div>

        {/* Room, Language Selector, and Controls */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (EN | ID) */}
          <LanguageSelector />

          {/* Room Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
            <Broadcast size={18} className="animate-pulse text-[#00F0FF]" />
            <span className="text-[11px] text-gray-400 font-mono">{t('roomLabel')}:</span>
            <span className="font-['Orbitron'] text-sm font-bold tracking-widest text-[#FFE600]">
              {roomId}
            </span>
            <button
              type="button"
              onClick={regenerateRoom}
              className="text-gray-400 hover:text-white transition ml-1"
              title={t('newRoom')}
            >
              <ArrowsClockwise size={14} />
            </button>
          </div>

          <Link
            to={`/controller?room=${roomId}`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/15 px-3.5 py-2 text-xs font-semibold text-[#00F0FF] transition hover:bg-[#00F0FF]/25 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <DeviceMobile size={18} />
            <span className="hidden sm:inline">Test Controller</span>
          </Link>
        </div>
      </header>

      {/* Main Staging Grid: Left QR Onboarding | Right Player Cards & Calibration */}
      <main className="relative z-10 my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: Dynamic QR Code Scanner & Room Hub */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Sparkle size={18} className="text-[#FFE600]" />
            <h2 className="font-['Orbitron'] text-sm font-bold tracking-wider text-gray-200">
              {t('scanTitle')}
            </h2>
          </div>
          <p className="text-xs text-gray-400 text-center mb-6 max-w-xs font-['Space_Grotesk'] leading-relaxed">
            {t('scanSubtitle')}
          </p>

          {/* QR Code Container with Neon Cyber Border */}
          <div className="relative p-4 rounded-2xl border-2 border-[#00F0FF]/50 bg-black/60 shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col items-center justify-center">
            {/* Corner cyber ticks */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#00F0FF]" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#FF2A85]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#FF2A85]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#00F0FF]" />

            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG
                value={controllerUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0B0F19"
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-[11px] font-mono text-gray-400 tracking-wider">
                {t('roomLabel')}:
              </span>
              <span className="font-['Orbitron'] text-2xl font-black text-[#FFE600] tracking-widest text-glow-yellow">
                {roomId}
              </span>
            </div>
          </div>

          {/* Copy URL Input */}
          <div className="mt-6 flex w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-2">
            <input
              type="text"
              readOnly
              value={controllerUrl}
              className="w-full bg-transparent px-2 text-xs text-gray-300 outline-none truncate font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-[#00F0FF]/20 px-3 py-1.5 text-xs font-bold text-[#00F0FF] hover:bg-[#00F0FF]/30 transition shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t('copied') : t('copyLink')}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Dual Player Connection Cards & Pre-Flight Calibration */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top Status Banner */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Radioactive size={18} className="text-[#00F0FF]" />
              <span className="font-['Orbitron'] text-xs font-bold tracking-wider text-gray-300">
                {bothConnected ? t('autoStartReady') : t('lobbyTagline')}
              </span>
            </div>
            <span className="text-xs font-['Rajdhani'] font-bold text-[#FFE600]">
              {bothConnected ? '2/2 CONNECTED' : player1Connected || player2Connected ? '1/2 CONNECTED' : '0/2 CONNECTED'}
            </span>
          </div>

          {/* Dual Player Connection Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot 1: Player 1 (Cyan - Alpha Pod) */}
            <div
              className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
                player1Connected
                  ? 'border-[#00F0FF]/60 bg-[#00F0FF]/10 shadow-[0_0_25px_rgba(0,240,255,0.3)]'
                  : 'border-white/10 bg-white/5 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                      player1Connected
                        ? 'border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                        : 'border-white/10 bg-white/5 text-gray-500'
                    }`}
                  >
                    <RocketLaunch size={24} weight="duotone" className="-rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-['Orbitron'] text-sm font-black text-white">
                      {t('p1SlotTitle')}
                    </h3>
                    <p className="text-[11px] text-[#00F0FF] font-['Rajdhani'] font-bold">
                      CYAN POD
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 ${
                    player1Connected
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      player1Connected ? 'bg-[#00F0FF] animate-ping' : 'bg-gray-500 animate-pulse'
                    }`}
                  />
                  {player1Connected ? t('readyToFly') : t('waitingPilot')}
                </span>
              </div>

              {/* Status footer inside card */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-mono text-gray-400">
                <span>SIGNAL: {player1Connected ? 'STABLE (60 FPS)' : 'OFFLINE'}</span>
                <span>{player1Connected ? t('pilotJoined') : 'STANDBY'}</span>
              </div>
            </div>

            {/* Slot 2: Player 2 (Pink - Beta Pod) */}
            <div
              className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
                player2Connected
                  ? 'border-[#FF2A85]/60 bg-[#FF2A85]/10 shadow-[0_0_25px_rgba(255,42,133,0.3)]'
                  : 'border-white/10 bg-white/5 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                      player2Connected
                        ? 'border-[#FF2A85] bg-[#FF2A85]/20 text-[#FF2A85] shadow-[0_0_15px_rgba(255,42,133,0.5)]'
                        : 'border-white/10 bg-white/5 text-gray-500'
                    }`}
                  >
                    <ShieldCheck size={24} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-['Orbitron'] text-sm font-black text-white">
                      {t('p2SlotTitle')}
                    </h3>
                    <p className="text-[11px] text-[#FF2A85] font-['Rajdhani'] font-bold">
                      PINK POD
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 ${
                    player2Connected
                      ? 'bg-[#FF2A85]/20 text-[#FF2A85]'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      player2Connected ? 'bg-[#FF2A85] animate-ping' : 'bg-gray-500 animate-pulse'
                    }`}
                  />
                  {player2Connected ? t('readyToFly') : t('waitingCopilot')}
                </span>
              </div>

              {/* Status footer inside card */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-mono text-gray-400">
                <span>SIGNAL: {player2Connected ? 'STABLE (60 FPS)' : 'OFFLINE'}</span>
                <span>{player2Connected ? t('copilotJoined') : 'STANDBY'}</span>
              </div>
            </div>
          </div>

          {/* Pre-Flight Joy Check / Calibration Panel */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <GameController size={18} className="text-[#FFE600]" />
                <h3 className="font-['Orbitron'] text-xs font-bold tracking-wider text-white">
                  {t('shakeTestTitle')}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {bothConnected ? 'LIVE FEED @ 40Hz' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-['Space_Grotesk'] mb-4">
              {t('shakeTestSubtitle')}
            </p>

            {/* Live Telemetry Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Telemetry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-['Rajdhani'] font-bold">
                  <span className="text-[#00F0FF]">P1 {t('steerLabel')}</span>
                  <span className="text-gray-300 font-mono">
                    {latestInputs[1]?.st !== undefined ? `${latestInputs[1].st.toFixed(2)}` : '0.00'}
                  </span>
                </div>
                {/* Steer Bar (-1 to +1) */}
                <div className="relative h-3 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/40" />
                  <div
                    className="h-full bg-[#00F0FF] transition-all duration-75 rounded-full"
                    style={{
                      width: `${Math.abs((latestInputs[1]?.st || 0) * 50)}%`,
                      marginLeft: (latestInputs[1]?.st || 0) < 0 ? `${50 + (latestInputs[1]?.st || 0) * 50}%` : '50%'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-['Rajdhani'] font-bold pt-1">
                  <span className="text-[#00F0FF]">P1 {t('thrustLabel')}</span>
                  <span className="text-gray-300 font-mono">
                    {Math.round((latestInputs[1]?.th || 0) * 100)}%
                  </span>
                </div>
                {/* Thrust Bar (0 to 100%) */}
                <div className="h-3 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#00F0FF]/50 to-[#00F0FF] transition-all duration-75 rounded-full"
                    style={{ width: `${(latestInputs[1]?.th || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Player 2 Telemetry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-['Rajdhani'] font-bold">
                  <span className="text-[#FF2A85]">P2 {t('steerLabel')}</span>
                  <span className="text-gray-300 font-mono">
                    {latestInputs[2]?.st !== undefined ? `${latestInputs[2].st.toFixed(2)}` : '0.00'}
                  </span>
                </div>
                {/* Steer Bar (-1 to +1) */}
                <div className="relative h-3 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/40" />
                  <div
                    className="h-full bg-[#FF2A85] transition-all duration-75 rounded-full"
                    style={{
                      width: `${Math.abs((latestInputs[2]?.st || 0) * 50)}%`,
                      marginLeft: (latestInputs[2]?.st || 0) < 0 ? `${50 + (latestInputs[2]?.st || 0) * 50}%` : '50%'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-['Rajdhani'] font-bold pt-1">
                  <span className="text-[#FF2A85]">P2 {t('thrustLabel')}</span>
                  <span className="text-gray-300 font-mono">
                    {Math.round((latestInputs[2]?.th || 0) * 100)}%
                  </span>
                </div>
                {/* Thrust Bar (0 to 100%) */}
                <div className="h-3 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF2A85]/50 to-[#FF2A85] transition-all duration-75 rounded-full"
                    style={{ width: `${(latestInputs[2]?.th || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Co-Op Auto-Start Action Bar */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                  bothReeling
                    ? 'border-[#FFE600] bg-[#FFE600]/20 text-[#FFE600] shadow-[0_0_25px_rgba(255,230,0,0.7)]'
                    : 'border-white/10 bg-black/40 text-gray-500'
                }`}
              >
                <Crosshair size={28} weight="bold" className={bothReeling ? 'animate-spin' : ''} />
              </div>
              <div>
                <h4 className="font-['Orbitron'] text-xs font-black tracking-wider text-white">
                  {t('autoStartReady')}
                </h4>
                <p className="text-xs text-gray-400 font-['Space_Grotesk']">
                  {t('autoStartInstruction')}
                </p>
              </div>
            </div>

            {/* Sync Hold Progress Bar or Start Button */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {bothReeling ? (
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-black/60 h-3 rounded-full border border-[#FFE600]/50 overflow-hidden p-0.5">
                    <div
                      className="h-full bg-[#FFE600] rounded-full transition-all duration-75 shadow-[0_0_12px_#FFE600]"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                  <span className="font-['Orbitron'] text-xs font-black text-[#FFE600]">
                    {Math.round(holdProgress)}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400">
                    P1: <span className={p1Reeling ? 'text-[#00F0FF] font-bold' : 'text-gray-600'}>{p1Reeling ? 'HOLDING' : 'IDLE'}</span>
                    {' • '}
                    P2: <span className={p2Reeling ? 'text-[#FF2A85] font-bold' : 'text-gray-600'}>{p2Reeling ? 'HOLDING' : 'IDLE'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={onStartGame}
                    disabled={!bothConnected}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-['Orbitron'] font-bold text-gray-300 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen 3-Second Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div className="relative flex flex-col items-center justify-center text-center">
            {countdown > 0 ? (
              <>
                <span className="font-['Orbitron'] text-xs font-black tracking-widest text-[#00F0FF] mb-4">
                  {t('launchingCountdown')}
                </span>
                <div className="font-['Orbitron'] text-9xl md:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#00F0FF] to-[#FF2A85] drop-shadow-[0_0_60px_rgba(0,240,255,0.8)] animate-scale-up">
                  {countdown}
                </div>
                <p className="mt-4 font-['Rajdhani'] text-sm font-bold tracking-wider text-gray-400">
                  {t('lobbyTagline')}
                </p>
              </>
            ) : (
              <>
                <div className="font-['Orbitron'] text-7xl md:text-9xl font-black text-[#FFE600] drop-shadow-[0_0_80px_rgba(255,230,0,1)] animate-bounce">
                  LAUNCH!
                </div>
                <span className="mt-6 font-['Orbitron'] text-sm font-bold text-white tracking-widest">
                  {t('arenaActive')}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer System Diagnostics */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 font-['Space_Grotesk']">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Sparkle size={14} className="text-[#FFE600]" />
            AstroTether
          </span>
          <span>•</span>
          <span className="text-[#00F0FF]">{t('p1SlotTitle')}</span>
          <span>•</span>
          <span className="text-[#FF2A85]">{t('p2SlotTitle')}</span>
        </div>
        <div>
          <span>{t('brandSubtitle')}</span>
        </div>
      </footer>
    </div>
  )
}

export default HostLobbyView
