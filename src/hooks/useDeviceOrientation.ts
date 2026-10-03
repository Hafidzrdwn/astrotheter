import { useState, useEffect, useCallback, useRef } from 'react'

export type DeviceOrientationPermission = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface UseDeviceOrientationReturn {
  permissionState: DeviceOrientationPermission
  isAvailable: boolean
  steer: number // Normalized -1.0 (left) to +1.0 (right)
  rawGamma: number | null // Tilt angle in degrees (-90 to +90)
  requestPermission: () => Promise<boolean>
  calibrate: () => void
}

interface DeviceOrientationEventIOS {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const [permissionState, setPermissionState] = useState<DeviceOrientationPermission>('prompt')
  const [isAvailable, setIsAvailable] = useState<boolean>(false)
  const [rawGamma, setRawGamma] = useState<number | null>(null)
  const [steer, setSteer] = useState<number>(0)

  // Calibration offset (zero center point)
  const gammaOffsetRef = useRef<number>(0)

  // Calibrate current orientation as the new 0 center
  const calibrate = useCallback(() => {
    if (rawGamma !== null) {
      gammaOffsetRef.current = rawGamma
    }
  }, [rawGamma])

  // Check initial support and permission requirement
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      setPermissionState('unsupported')
      setIsAvailable(false)
      return
    }

    // Only activate device orientation listener on actual mobile/tablet devices
    const isMobileDevice = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobileDevice) {
      setPermissionState('unsupported')
      setIsAvailable(false)
      return
    }

    const OrientationEvent = window.DeviceOrientationEvent as unknown as DeviceOrientationEventIOS

    // iOS 13+ requires explicit user gesture to requestPermission
    if (typeof OrientationEvent.requestPermission === 'function') {
      setPermissionState('prompt')
    } else {
      // Standard Android mobile browser
      setPermissionState('granted')
    }
  }, [])

  // Interactive permission requester for iOS Safari
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const OrientationEvent = window.DeviceOrientationEvent as unknown as DeviceOrientationEventIOS

    if (typeof OrientationEvent?.requestPermission === 'function') {
      try {
        const response = await OrientationEvent.requestPermission()
        if (response === 'granted') {
          setPermissionState('granted')
          return true
        } else {
          setPermissionState('denied')
          return false
        }
      } catch (err) {
        console.warn('[useDeviceOrientation] Permission request rejected:', err)
        setPermissionState('denied')
        return false
      }
    } else if (window.DeviceOrientationEvent) {
      setPermissionState('granted')
      return true
    }

    setPermissionState('unsupported')
    return false
  }, [])

  // Device orientation event listener
  useEffect(() => {
    if (permissionState !== 'granted') return

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // gamma represents left-to-right tilt in degrees (-90 to +90)
      const gamma = event.gamma
      if (gamma === null || typeof gamma === 'undefined') return

      setIsAvailable(true)
      setRawGamma(gamma)

      // Apply calibration offset
      const calibratedGamma = gamma - gammaOffsetRef.current

      // Deadzone of 2 degrees to avoid jitter
      if (Math.abs(calibratedGamma) < 2) {
        setSteer(0)
        return
      }

      // Convert -30° to +30° into normalized -1.0 to +1.0
      const MAX_TILT = 30
      const clamped = Math.max(-MAX_TILT, Math.min(MAX_TILT, calibratedGamma))
      const normalized = Number((clamped / MAX_TILT).toFixed(3))

      setSteer(normalized)
    }

    window.addEventListener('deviceorientation', handleOrientation, true)

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [permissionState])

  return {
    permissionState,
    isAvailable,
    steer,
    rawGamma,
    requestPermission,
    calibrate
  }
}

export default useDeviceOrientation
