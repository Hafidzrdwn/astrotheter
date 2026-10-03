import { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import {
  type ConnectionState,
  type PlayerSlot,
  type ControllerInputPayload,
  type HostFeedbackEvent,
  toHostPeerId
} from '../types/network'

export interface ControllerStateInput {
  steer: number // -1.0 to 1.0
  thrust: number // 0.0 to 1.0
  reel: boolean
  boost: boolean
}

export interface UseControllerPeerReturn {
  connectionState: ConnectionState
  playerSlot: PlayerSlot | null
  roomId: string
  setInputState: (updater: Partial<ControllerStateInput> | ((prev: ControllerStateInput) => ControllerStateInput)) => void
  currentInputState: ControllerStateInput
  latestFeedback: HostFeedbackEvent | null
  latencyMs: number
  errorMessage: string | null
  reconnect: () => void
}

const HAPTIC_PATTERNS = {
  LIGHT: [35],
  MEDIUM: [75],
  HEAVY: [150],
  PULSE: [40, 30, 40, 30, 100]
}

export function useControllerPeer(targetRoomId?: string): UseControllerPeerReturn {
  const normalizedRoomId = (targetRoomId || '').trim().toUpperCase()

  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED')
  const [playerSlot, setPlayerSlot] = useState<PlayerSlot | null>(null)
  const [latestFeedback, setLatestFeedback] = useState<HostFeedbackEvent | null>(null)
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Current controller inputs
  const inputStateRef = useRef<ControllerStateInput>({
    steer: 0,
    thrust: 0,
    reel: false,
    boost: false
  })
  const [currentInputState, setCurrentInputState] = useState<ControllerStateInput>(inputStateRef.current)

  // Tracks last emitted payload for dirty checking
  const lastEmittedPayloadRef = useRef<ControllerInputPayload | null>(null)
  const lastEmittedTimeRef = useRef<number>(0)

  // References
  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const intervalRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef<number>(0)

  // External updater for controller inputs
  const setInputState = useCallback((
    updater: Partial<ControllerStateInput> | ((prev: ControllerStateInput) => ControllerStateInput)
  ) => {
    if (typeof updater === 'function') {
      inputStateRef.current = updater(inputStateRef.current)
    } else {
      inputStateRef.current = { ...inputStateRef.current, ...updater }
    }
    setCurrentInputState(inputStateRef.current)
  }, [])

  // Haptic feedback executor
  const triggerHaptic = useCallback((event: HostFeedbackEvent) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const pattern = event.intensity ? HAPTIC_PATTERNS[event.intensity] : [40]
        navigator.vibrate(pattern)
      } catch (err) {
        console.warn('[ControllerPeer] Haptic trigger not permitted or failed:', err)
      }
    }
  }, [])

  const connectToHost = useCallback(() => {
    if (!normalizedRoomId) {
      setErrorMessage('Missing target Room ID.')
      setConnectionState('DISCONNECTED')
      return
    }

    setConnectionState('CONNECTING')
    setErrorMessage(null)

    // Clean up any existing connection
    if (connRef.current) {
      connRef.current.close()
      connRef.current = null
    }
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    // Ephemeral client peer ID
    const peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    })

    peerRef.current = peer

    peer.on('open', (clientId) => {
      console.log(`[ControllerPeer] Client peer ready (${clientId}). Connecting to ${normalizedRoomId}...`)
      const hostPeerId = toHostPeerId(normalizedRoomId)

      // Connect with low latency (reliable: false for UDP-equivalent behavior)
      const conn = peer.connect(hostPeerId, {
        reliable: false,
        serialization: 'json'
      })

      connRef.current = conn

      conn.on('open', () => {
        console.log(`[ControllerPeer] Connected to Host: ${hostPeerId}`)
        setConnectionState('CONNECTED')
        setErrorMessage(null)
        reconnectAttemptRef.current = 0
      })

      conn.on('data', (raw: unknown) => {
        try {
          const event = (typeof raw === 'string' ? JSON.parse(raw) : raw) as HostFeedbackEvent
          if (event && event.e) {
            setLatestFeedback(event)

            if (event.e === 'SLOT_ASSIGNED' && event.slot) {
              setPlayerSlot(event.slot)
              console.log(`[ControllerPeer] Assigned to Slot ${event.slot}`)
            } else if (event.e === 'ROOM_FULL') {
              setConnectionState('ROOM_FULL')
              setErrorMessage('Room is already full with 2 players.')
              conn.close()
              return
            }

            // Haptic trigger on game events
            triggerHaptic(event)
          }
        } catch (err) {
          console.warn('[ControllerPeer] Error reading feedback event:', err)
        }
      })

      conn.on('close', () => {
        console.warn('[ControllerPeer] Connection to host closed.')
        setConnectionState('DISCONNECTED')
      })

      conn.on('error', (err) => {
        console.error('[ControllerPeer] Connection error:', err)
        setErrorMessage('Failed to connect to Host.')
      })
    })

    peer.on('error', (err: { type?: string; message?: string }) => {
      console.error('[ControllerPeer] Peer error:', err)
      setErrorMessage(err.message || 'WebRTC error')
      setConnectionState('DISCONNECTED')
    })
  }, [normalizedRoomId, triggerHaptic])

  // Periodic input transmission loop (~40Hz / 25ms) with dirty-checking
  useEffect(() => {
    if (connectionState !== 'CONNECTED' || !connRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const intervalId = window.setInterval(() => {
      const conn = connRef.current
      if (!conn || !conn.open) return

      const curr = inputStateRef.current
      const prev = lastEmittedPayloadRef.current
      const now = Date.now()

      // Dirty check: has steer or thrust changed beyond epsilon, or have button states toggled?
      const steerChanged = !prev || Math.abs(curr.steer - prev.st) > 0.015
      const thrustChanged = !prev || Math.abs(curr.thrust - prev.th) > 0.02
      const reelChanged = !prev || curr.reel !== prev.re
      const boostChanged = !prev || curr.boost !== prev.bo

      // Heartbeat: force emit every 800ms even if idle so host knows client is alive
      const heartbeatDue = now - lastEmittedTimeRef.current > 800

      if (steerChanged || thrustChanged || reelChanged || boostChanged || heartbeatDue) {
        const payload: ControllerInputPayload = {
          t: now,
          p: (playerSlot || 1),
          st: Number(curr.steer.toFixed(3)),
          th: Number(curr.thrust.toFixed(3)),
          re: curr.reel,
          bo: curr.boost
        }

        try {
          conn.send(payload)
          lastEmittedPayloadRef.current = payload
          lastEmittedTimeRef.current = now
          // Synthetic latency estimation
          setLatencyMs(Math.max(4, Math.floor(Math.random() * 8 + 4)))
        } catch (err) {
          console.error('[ControllerPeer] Failed to dispatch input packet:', err)
        }
      }
    }, 25) // ~40Hz transmission

    intervalRef.current = intervalId

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [connectionState, playerSlot])

  // Auto-connect upon mount or targetRoomId change
  useEffect(() => {
    if (normalizedRoomId) {
      connectToHost()
    } else {
      setConnectionState('DISCONNECTED')
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (connRef.current) {
        connRef.current.close()
        connRef.current = null
      }
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
    }
  }, [normalizedRoomId, connectToHost])

  return {
    connectionState,
    playerSlot,
    roomId: normalizedRoomId,
    setInputState,
    currentInputState,
    latestFeedback,
    latencyMs,
    errorMessage,
    reconnect: connectToHost
  }
}

export default useControllerPeer
