import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RocketLaunch,
  GameController,
  QrCode,
  WifiHigh,
  ShieldCheck,
  Lightning,
  DeviceMobile,
  Sparkle,
  Copy,
  Check,
  Play,
  Broadcast,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { useHostPeer } from '../hooks/useHostPeer'

export const HostView: React.FC = () => {
  const [copied, setCopied] = useState(false)
  const {
    roomId,
    connectionState,
    player1Connected,
    player2Connected,
    latestInputs,
    broadcastFeedback,
    regenerateRoom
  } = useHostPeer()

  const controllerUrl = `${window.location.origin}/controller?room=${roomId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(controllerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTestHaptic = () => {
    broadcastFeedback({
      e: 'COLLISION',
      intensity: 'HEAVY',
      score: 100
    })
  }

  return (
    <div className="relative min-h-screen bg-[#0B0F19] text-gray-100 bg-cosmic-grid overflow-hidden flex flex-col justify-between p-4 md:p-8">
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
              <span className="rounded-md border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-2 py-0.5 text-xs font-semibold text-[#00F0FF]">
                HOST ARENA
              </span>
            </div>
            <p className="text-xs text-gray-400 font-['Space_Grotesk']">
              Dual-Screen Co-Op Orbital Defense Station
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
            <button
              type="button"
              onClick={regenerateRoom}
              className="text-gray-400 hover:text-white transition ml-1"
              title="Generate new 4-char Room ID"
            >
              <ArrowsClockwise size={14} />
            </button>
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

          <Link
            to={`/controller?room=${roomId}`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/15 px-3 py-2 text-xs font-semibold text-[#00F0FF] transition hover:bg-[#00F0FF]/25 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <DeviceMobile size={18} />
            <span className="hidden sm:inline">Launch Test Controller</span>
          </Link>
        </div>
      </header>

      {/* Main Game Stage & Tether Simulation Preview */}
      <main className="relative z-10 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Arena Screen (Host Game Canvas Preview) */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden min-h-[460px]">
          {/* Radial space vignette inside the arena */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(11,15,25,0)_0%,_rgba(11,15,25,0.85)_100%)]" />

          {/* Simulation Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  player1Connected && player2Connected
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-yellow-400'
                }`}
              />
              <span className="font-['Orbitron'] text-xs font-bold tracking-wider text-gray-300">
                {player1Connected && player2Connected
                  ? 'DUAL PILOTS ENGAGED — READY FOR FLIGHT'
                  : 'AWAITING CO-OP CONTROLLER PAIRING'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-['Rajdhani'] font-bold tracking-wider">
              <span className="text-[#00F0FF]">P1 SYNC: {player1Connected ? '100%' : 'OFFLINE'}</span>
              <span className="text-[#FF2A85]">P2 SYNC: {player2Connected ? '100%' : 'OFFLINE'}</span>
            </div>
          </div>

          {/* Interactive Tether Arena Mockup */}
          <div className="relative z-10 my-8 flex items-center justify-around h-64 border border-white/5 rounded-xl bg-black/40 p-4">
            {/* Player 1 Pod (Neon Cyan) */}
            <div className="flex flex-col items-center gap-2 group">
              <div
                className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#00F0FF] transition-all duration-300 ${
                  player1Connected
                    ? 'bg-[#00F0FF]/15 shadow-[0_0_25px_rgba(0,240,255,0.6)]'
                    : 'bg-[#00F0FF]/5 opacity-60'
                }`}
              >
                <RocketLaunch size={36} weight="duotone" className="text-[#00F0FF] -rotate-45" />
                <span className="absolute -top-3 rounded-full bg-[#00F0FF] px-2 py-0.5 text-[10px] font-black text-black font-['Orbitron']">
                  P1 ALPHA
                </span>
              </div>
              <span className="font-['Rajdhani'] text-xs font-bold text-[#00F0FF] tracking-wider">
                {latestInputs[1]
                  ? `STEER: ${latestInputs[1].st.toFixed(2)} | THRUST: ${latestInputs[1].th.toFixed(2)}`
                  : player1Connected
                  ? 'IDLE / READY'
                  : 'WAITING FOR SCAN'}
              </span>
            </div>

            {/* Glowing Tether Line with Pulse Effect */}
            <div className="relative flex-1 mx-6 flex items-center justify-center">
              <div
                className={`w-full h-1 rounded-full transition-all duration-300 ${
                  player1Connected && player2Connected
                    ? 'bg-gradient-to-r from-[#00F0FF] via-[#FFE600] to-[#FF2A85] shadow-[0_0_15px_rgba(255,230,0,0.8)]'
                    : 'bg-white/20 border-dashed'
                }`}
              >
                {player1Connected && player2Connected && (
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_12px_#FFE600] animate-[ping_2s_infinite]" />
                )}
              </div>
              <div className="absolute -top-7 rounded-md border border-[#FFE600]/30 bg-[#FFE600]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFE600] font-['Orbitron'] tracking-wider">
                QUANTUM TETHER LINK
              </div>
            </div>

            {/* Player 2 Pod (Neon Pink) */}
            <div className="flex flex-col items-center gap-2 group">
              <div
                className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#FF2A85] transition-all duration-300 ${
                  player2Connected
                    ? 'bg-[#FF2A85]/15 shadow-[0_0_25px_rgba(255,42,133,0.6)]'
                    : 'bg-[#FF2A85]/5 opacity-60'
                }`}
              >
                <ShieldCheck size={36} weight="duotone" className="text-[#FF2A85]" />
                <span className="absolute -top-3 rounded-full bg-[#FF2A85] px-2 py-0.5 text-[10px] font-black text-white font-['Orbitron']">
                  P2 BETA
                </span>
              </div>
              <span className="font-['Rajdhani'] text-xs font-bold text-[#FF2A85] tracking-wider">
                {latestInputs[2]
                  ? `STEER: ${latestInputs[2].st.toFixed(2)} | REEL: ${latestInputs[2].re ? 'ON' : 'OFF'}`
                  : player2Connected
                  ? 'IDLE / READY'
                  : 'WAITING FOR SCAN'}
              </span>
            </div>
          </div>

          {/* Arena Bottom Controls */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!player1Connected && !player2Connected}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] px-6 py-3 font-['Orbitron'] text-xs font-black tracking-wider text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} weight="fill" />
                START CO-OP LAUNCH
              </button>
              <button
                type="button"
                onClick={handleTestHaptic}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-['Orbitron'] text-xs font-bold tracking-wider text-gray-300 transition hover:bg-white/10 active:scale-95"
              >
                <Lightning size={16} className="text-[#FFE600]" />
                TEST HAPTIC PULSE
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-['Space_Grotesk']">
                {player1Connected && player2Connected
                  ? 'Both smartphones synchronized.'
                  : 'Scan QR with both phones to begin.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Pairing & Dual Phone QR Code Hub */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* QR Code / Mobile Pairing Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-[#00F0FF]" />
                <h2 className="font-['Orbitron'] text-sm font-bold tracking-wide text-white">
                  CONNECT SMARTPHONES
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#FFE600] font-['Rajdhani']">
                ROOM: {roomId}
              </span>
            </div>

            {/* QR Mockup & Instructions */}
            <div className="my-4 flex flex-col items-center justify-center rounded-xl bg-white/5 p-4 border border-white/5">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
                <div className="h-full w-full border-4 border-black border-dashed flex flex-col items-center justify-center text-black">
                  <GameController size={48} weight="fill" className="text-[#0B0F19]" />
                  <span className="text-[11px] font-black tracking-widest font-['Orbitron'] mt-1">
                    {roomId}
                  </span>
                  <span className="text-[8px] font-bold text-gray-600">P2P WEBRTC DIRECT</span>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-gray-400 max-w-xs">
                Open URL on both mobile browsers. Connection 1 becomes Player 1 (Cyan), connection 2 becomes Player 2 (Pink).
              </p>

              {/* Copy URL Input */}
              <div className="mt-3 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-1.5">
                <input
                  type="text"
                  readOnly
                  value={controllerUrl}
                  className="w-full bg-transparent px-2 text-xs text-gray-300 outline-none truncate font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded bg-[#00F0FF]/20 px-2.5 py-1 text-xs font-bold text-[#00F0FF] hover:bg-[#00F0FF]/30 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Controller Slots Status */}
            <div className="space-y-3">
              {/* Slot 1 */}
              <div
                className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                  player1Connected
                    ? 'border-[#00F0FF]/50 bg-[#00F0FF]/10'
                    : 'border-white/10 bg-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      player1Connected
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    <GameController size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-['Orbitron'] text-xs font-bold text-[#00F0FF]">
                      SLOT 1: ALPHA (CYAN)
                    </h3>
                    <p className="text-[11px] text-gray-400">Primary Steer & Left Thrusters</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    player1Connected
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {player1Connected ? 'CONNECTED' : 'WAITING'}
                </span>
              </div>

              {/* Slot 2 */}
              <div
                className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                  player2Connected
                    ? 'border-[#FF2A85]/50 bg-[#FF2A85]/10'
                    : 'border-white/10 bg-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      player2Connected
                        ? 'bg-[#FF2A85]/20 text-[#FF2A85]'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    <GameController size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-['Orbitron'] text-xs font-bold text-[#FF2A85]">
                      SLOT 2: BETA (PINK)
                    </h3>
                    <p className="text-[11px] text-gray-400">Reel Harpoon & Kinetic Shield</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    player2Connected
                      ? 'bg-[#FF2A85]/20 text-[#FF2A85]'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {player2Connected ? 'CONNECTED' : 'WAITING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Diagnostics */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 font-['Space_Grotesk']">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Sparkle size={14} className="text-[#FFE600]" />
            AstroTether PeerJS WebRTC v1.0
          </span>
          <span>•</span>
          <span className="text-[#00F0FF]">Un-ordered zero-retransmit UDP DataChannel</span>
          <span>•</span>
          <span className="text-[#FF2A85]">40Hz High Frequency Input</span>
        </div>
        <div>
          <span>Target Display: Desktop 1080p/4K Ultra-Wide</span>
        </div>
      </footer>
    </div>
  )
}

export default HostView
