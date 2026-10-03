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
  X,
  Image as ImageIcon
} from '@phosphor-icons/react'
import jsQR from 'jsqr'
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parseRoomCodeFromQr = (rawValue: string): string | null => {
    if (!rawValue) return null
    try {
      const url = new URL(rawValue)
      const roomParam = url.searchParams.get('room')
      if (roomParam) return roomParam.toUpperCase()
    } catch {}
    const match = rawValue.match(/room=([A-Z0-9]+)/i)
    if (match && match[1]) return match[1].toUpperCase()
    const cleaned = rawValue.trim().toUpperCase()
    if (cleaned.length >= 3 && cleaned.length <= 6) return cleaned
    return null
  }

  const handleLaunch = (codeToUse?: string) => {
    const code = (codeToUse || roomCode).trim().toUpperCase()
    if (!code || code.length < 3) {
      setErrorMessage(t('invalidRoomCode'))
      return
    }

    const slotQuery = preferredSlot > 0 ? `&slot=${preferredSlot}` : ''
    navigate(`/controller?room=${code}${slotQuery}`)
  }

  // File snapshot / image upload fallback (works 100% on HTTP LAN and all devices)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMessage(null)

    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, img.width, img.height)
        const imgData = ctx.getImageData(0, 0, img.width, img.height)
        const qrResult = jsQR(imgData.data, imgData.width, imgData.height)
        if (qrResult?.data) {
          const room = parseRoomCodeFromQr(qrResult.data)
          if (room) {
            setRoomCode(room)
            handleLaunch(room)
            return
          }
        }
        setErrorMessage('QR Code tidak terdeteksi pada foto. Pastikan barcode terlihat jelas atau ketik kode manual.')
      } catch (err) {
        console.warn('QR decode error:', err)
        setErrorMessage('Gagal memproses foto. Silakan ketik kode room secara manual.')
      }
    }
    img.onerror = () => {
      setErrorMessage('Gagal memuat gambar.')
    }
    img.src = URL.createObjectURL(file)
  }

  // Camera QR Code Scanner with native browser permission request and jsQR processing
  const startCameraScanner = async () => {
    setErrorMessage(null)

    // Check if browser environment supports mediaDevices (requires HTTPS or localhost on modern mobile browsers)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(t('httpCameraNote'))
      // Automatically trigger camera photo snapshot if live video stream isn't permitted over HTTP
      fileInputRef.current?.click()
      return
    }

    try {
      let stream: MediaStream
      try {
        // Attempt ideal environment (back) camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        })
      } catch {
        // Fallback for devices without back camera label or strict constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      streamRef.current = stream
      setIsScanning(true)

      // Short delay for video DOM element mount
      window.setTimeout(async () => {
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        try {
          await videoRef.current.play()
        } catch (e) {
          console.warn('Video play error:', e)
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        scanIntervalRef.current = window.setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2 || !ctx) return
          const v = videoRef.current
          if (v.videoWidth === 0 || v.videoHeight === 0) return

          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

          const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'dontInvert'
          })

          if (qrResult?.data) {
            const room = parseRoomCodeFromQr(qrResult.data)
            if (room) {
              stopCameraScanner()
              setRoomCode(room)
              handleLaunch(room)
            }
          }
        }, 200)
      }, 150)
    } catch (err: unknown) {
      console.warn('Camera error:', err)
      const errName = err instanceof Error ? err.name : ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorMessage(t('cameraPermissionDenied'))
      } else {
        setErrorMessage(`${t('cameraPermissionDenied')} (${errName || 'Notice'})`)
      }
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

              {/* Hidden File Input for Direct Camera Photo Snapshot (Works 100% on HTTP LAN & all browsers) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleLaunch()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#0099FF] text-black font-['Orbitron'] text-sm font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition"
                >
                  <RocketLaunch size={18} weight="bold" />
                  <span>{t('joinFlightBtn')}</span>
                  <ArrowRight size={16} weight="bold" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startCameraScanner}
                    className="py-2.5 px-3 rounded-2xl border border-white/20 bg-white/5 text-gray-200 font-['Orbitron'] text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition text-center"
                    title="Live Camera Stream Scan"
                  >
                    <Camera size={16} className="text-[#00F0FF] shrink-0" />
                    <span>{t('scanQrCameraBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-2xl border border-white/20 bg-white/5 text-gray-200 font-['Orbitron'] text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition text-center"
                    title="Snapshot Camera Photo / Upload Image"
                  >
                    <ImageIcon size={16} className="text-[#FFE600] shrink-0" />
                    <span>{t('uploadQrPhotoBtn')}</span>
                  </button>
                </div>
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
