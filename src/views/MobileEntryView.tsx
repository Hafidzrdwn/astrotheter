import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  RocketLaunch,
  Camera,
  WarningCircle,
  Sparkle,
  ArrowRight,
  Desktop,
  CheckCircle,
  X
} from '@phosphor-icons/react'
import { AstroLogo } from '../components/AstroLogo'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../context/LanguageContext'
import { type PlayerSlot } from '../types/network'

export const MobileEntryView: React.FC = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [roomCode, setRoomCode] = useState<string>(() => {
    return (searchParams.get('room') || '').toUpperCase()
  })
  const [preferredSlot, setPreferredSlot] = useState<PlayerSlot | 0>(0) // 0 = auto
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Camera QR Scanner state
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  const handleLaunch = (codeToUse?: string) => {
    const code = (codeToUse || roomCode).trim().toUpperCase()
    if (!code || code.length < 3) {
      setErrorMessage(t('invalidRoomCode'))
      return
    }

    const slotQuery = preferredSlot > 0 ? `&slot=${preferredSlot}` : ''
    navigate(`/controller?room=${code}${slotQuery}`)
  }

  // Camera QR Code Scanner using BarcodeDetector API if supported
  const startCameraScanner = async () => {
    setErrorMessage(null)
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check for native BarcodeDetector API
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector
      if (BarcodeDetectorClass) {
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] })
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue || ''
              stopCameraScanner()

              // Extract room code if full URL, else use raw string
              try {
                const url = new URL(rawValue)
                const roomParam = url.searchParams.get('room')
                if (roomParam) {
                  handleLaunch(roomParam)
                  return
                }
              } catch {}

              const match = rawValue.match(/room=([A-Z0-9]+)/i)
              if (match && match[1]) {
                handleLaunch(match[1])
              } else if (rawValue.length >= 3 && rawValue.length <= 6) {
                handleLaunch(rawValue)
              }
            }
          } catch {}
        }, 300)
      }
    } catch (err) {
      console.warn('Camera error:', err)
      setErrorMessage(t('cameraPermissionDenied'))
      stopCameraScanner()
    }
  }

  const stopCameraScanner = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopCameraScanner()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 bg-cosmic-grid flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed -top-40 left-1/4 h-80 w-80 rounded-full bg-[#00F0FF]/15 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-40 right-1/4 h-80 w-80 rounded-full bg-[#FF2A85]/15 blur-[100px]" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <AstroLogo size={36} showText />
        <LanguageSelector />
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-4">
        <div className="rounded-3xl border border-white/10 bg-[#0B0F19]/85 backdrop-blur-2xl p-6 shadow-2xl space-y-6">
          {/* Title & Description */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] text-[11px] font-['Orbitron'] font-bold tracking-wider">
              <Sparkle size={14} className="text-[#FFE600]" />
              MOBILE FLIGHT PORTAL
            </div>
            <h1 className="font-['Orbitron'] text-xl font-black text-white tracking-wide">
              {t('mobileEntryTitle')}
            </h1>
            <p className="text-xs text-gray-400 font-['Space_Grotesk'] leading-relaxed">
              {t('mobileEntrySubtitle')}
            </p>
          </div>

          {/* Camera QR Scanner Active View */}
          {isScanning ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#00F0FF] bg-black aspect-square flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Reticle Overlay */}
              <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-[#00F0FF]/80 rounded-2xl flex items-center justify-center">
                <span className="text-[11px] text-center font-mono text-cyan-300 bg-black/60 px-3 py-1.5 rounded-lg">
                  {t('cameraScanning')}
                </span>
              </div>
              <button
                type="button"
                onClick={stopCameraScanner}
                className="absolute top-3 right-3 rounded-full bg-black/70 border border-white/20 p-2 text-white hover:bg-black"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Room Code Input Card */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  {t('roomLabel')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase())
                      setErrorMessage(null)
                    }}
                    placeholder={t('roomCodePlaceholder')}
                    className="w-full rounded-2xl border-2 border-white/20 bg-black/60 px-4 py-3.5 font-['Orbitron'] text-xl font-black tracking-widest text-[#FFE600] outline-none focus:border-[#00F0FF] focus:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition placeholder:text-gray-600 placeholder:font-sans placeholder:text-sm placeholder:font-normal"
                  />
                  {roomCode.length >= 3 && (
                    <span className="absolute right-4 text-emerald-400">
                      <CheckCircle size={22} weight="fill" />
                    </span>
                  )}
                </div>
              </div>

              {/* Pod / Role Preference Picker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  {t('rolePreferenceLabel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Auto */}
                  <button
                    type="button"
                    onClick={() => setPreferredSlot(0)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      preferredSlot === 0
                        ? 'border-[#FFE600] bg-[#FFE600]/15 text-white shadow-[0_0_12px_rgba(255,230,0,0.3)]'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <RocketLaunch size={18} className="text-[#FFE600]" />
                    <span className="text-[11px] font-['Orbitron'] font-bold">
                      {t('roleAuto')}
                    </span>
                  </button>

                  {/* Alpha - Cyan */}
                  <button
                    type="button"
                    onClick={() => setPreferredSlot(1)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      preferredSlot === 1
                        ? 'border-[#00F0FF] bg-[#00F0FF]/15 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="h-3 w-3 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                    <span className="text-[11px] font-['Orbitron'] font-bold text-[#00F0FF]">
                      ALPHA
                    </span>
                    <span className="text-[9px] text-gray-400">Cyan</span>
                  </button>

                  {/* Beta - Pink */}
                  <button
                    type="button"
                    onClick={() => setPreferredSlot(2)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      preferredSlot === 2
                        ? 'border-[#FF2A85] bg-[#FF2A85]/15 text-white shadow-[0_0_12px_rgba(255,42,133,0.3)]'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="h-3 w-3 rounded-full bg-[#FF2A85] shadow-[0_0_8px_#FF2A85]" />
                    <span className="text-[11px] font-['Orbitron'] font-bold text-[#FF2A85]">
                      BETA
                    </span>
                    <span className="text-[9px] text-gray-400">Pink</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <WarningCircle size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleLaunch()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black font-['Orbitron'] text-sm font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition"
                >
                  <RocketLaunch size={18} weight="bold" />
                  <span>{t('joinFlightBtn')}</span>
                  <ArrowRight size={16} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="w-full py-3 px-4 rounded-2xl border border-white/20 bg-white/5 text-gray-200 font-['Orbitron'] text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition"
                >
                  <Camera size={18} className="text-[#00F0FF]" />
                  <span>{t('scanQrCameraBtn')}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer switch to PC Host Screen */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 font-['Space_Grotesk'] transition"
          >
            <Desktop size={14} />
            <span>Open PC Game Arena (Host)</span>
          </button>
        </div>
      </main>

      <footer className="relative z-10 text-center py-2 text-[11px] text-gray-600 font-mono">
        AstroTether Mobile Gateway • WebRTC P2P
      </footer>
    </div>
  )
}

export default MobileEntryView
