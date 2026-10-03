import { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import {
  type ConnectionState,
  type PlayerSlot,
  type ControllerInputPayload,
  type HostFeedbackEvent,
  type ClientCommandPayload,
  generateRoomId,
  toHostPeerId,
  fromHostPeerId,
  RTC_CONFIG
} from '../types/network'

export interface HostPeerState {
  roomId: string
  connectionState: ConnectionState
  player1Connected: boolean
  player2Connected: boolean
  latestInputs: {
    1: ControllerInputPayload | null
    2: ControllerInputPayload | null
  }
  errorMessage: string | null
}

export interface UseHostPeerReturn extends HostPeerState {
  broadcastFeedback: (event: HostFeedbackEvent) => void
  sendFeedbackToPlayer: (slot: PlayerSlot, event: HostFeedbackEvent) => void
  getLatestInputs: () => { 1: ControllerInputPayload | null; 2: ControllerInputPayload | null }
  regenerateRoom: () => void
}

export function useHostPeer(initialRoomId?: string): UseHostPeerReturn {
  const [roomId, setRoomId] = useState<string>(() => initialRoomId?.toUpperCase() || generateRoomId())
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING')
  const [player1Connected, setPlayer1Connected] = useState<boolean>(false)
  const [player2Connected, setPlayer2Connected] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Ref to hold the latest controller input payloads without triggering excessive React re-renders
  const latestInputsRef = useRef<{
    1: ControllerInputPayload | null
    2: ControllerInputPayload | null
  }>({
    1: null,
    2: null
  })

  // State representation for components that want reactive input updates
  const [latestInputs, setLatestInputs] = useState(latestInputsRef.current)

  // References to active peer and player DataConnections
  const peerRef = useRef<Peer | null>(null)
  const connP1Ref = useRef<DataConnection | null>(null)
  const connP2Ref = useRef<DataConnection | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const isCleaningUpRef = useRef<boolean>(false)

  // Send feedback event to a specific player
  const sendFeedbackToPlayer = useCallback((slot: PlayerSlot, event: HostFeedbackEvent) => {
    const conn = slot === 1 ? connP1Ref.current : connP2Ref.current
    if (conn && conn.open) {
      try {
        conn.send({ ...event, target: slot })
      } catch (err) {
        console.error(`[HostPeer] Failed to send feedback to P${slot}:`, err)
      }
    }
  }, [])

  // Broadcast feedback event to both connected players
  const broadcastFeedback = useCallback((event: HostFeedbackEvent) => {
    const payload = { ...event, target: event.target ?? 0 }
    if (connP1Ref.current && connP1Ref.current.open) {
      try {
        connP1Ref.current.send(payload)
      } catch (err) {
        console.error('[HostPeer] Failed to broadcast to P1:', err)
      }
    }
    if (connP2Ref.current && connP2Ref.current.open) {
      try {
        connP2Ref.current.send(payload)
      } catch (err) {
        console.error('[HostPeer] Failed to broadcast to P2:', err)
      }
    }
  }, [])

  // 1-second Heartbeat tick to keep controllers synced and detect host liveness
  useEffect(() => {
    const heartbeatTimer = window.setInterval(() => {
      broadcastFeedback({
        e: 'HEARTBEAT',
        roomId,
        timestamp: Date.now()
      })
    }, 1000)

    const handleBeforeUnload = () => {
      broadcastFeedback({
        e: 'ROOM_EXPIRED',
        message: 'Host window was closed or refreshed'
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.clearInterval(heartbeatTimer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [roomId, broadcastFeedback])

  // Fast getter for 60 FPS animation/physics loops
  const getLatestInputs = useCallback(() => {
    return latestInputsRef.current
  }, [])

  // Regenerate a fresh room ID with instant client notification & clean teardown
  const regenerateRoom = useCallback(() => {
    broadcastFeedback({
      e: 'ROOM_EXPIRED',
      message: 'Host generated a new room code'
    })
    try { connP1Ref.current?.close() } catch {}
    try { connP2Ref.current?.close() } catch {}
    connP1Ref.current = null
    connP2Ref.current = null
    setPlayer1Connected(false)
    setPlayer2Connected(false)
    setRoomId(generateRoomId())
  }, [broadcastFeedback])

  useEffect(() => {
    let isMounted = true
    isCleaningUpRef.current = false
    setConnectionState('CONNECTING')
    setErrorMessage(null)

    const hostPeerId = toHostPeerId(roomId)

    // Schedule delayed reconnect for signaling drops
    const scheduleReconnect = (delayMs = 2000) => {
      if (!isMounted || isCleaningUpRef.current) return
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted || isCleaningUpRef.current) return
        const peer = peerRef.current
        if (peer && !peer.destroyed && peer.disconnected) {
          console.log('[HostPeer] Attempting to reconnect to PeerJS broker...')
          try {
            peer.reconnect()
          } catch (err) {
            console.warn('[HostPeer] Reconnect attempt failed:', err)
          }
        }
      }, delayMs)
    }

    // Debounce Peer initialization by 150ms to cancel transient StrictMode mount/unmount cycle cleanly
    const initTimer = window.setTimeout(() => {
      if (!isMounted || isCleaningUpRef.current) return

      const peer = new Peer(hostPeerId, {
        debug: 1,
        pingInterval: 5000, // Keep-alive heartbeat every 5s
        config: RTC_CONFIG
      })

      peerRef.current = peer

      peer.on('open', (id) => {
        if (!isMounted || isCleaningUpRef.current) return
        console.log(`[HostPeer] Room online with ID: ${fromHostPeerId(id)} (${id})`)
        setConnectionState('CONNECTED')
        setErrorMessage(null)
      })

      peer.on('connection', (conn: DataConnection) => {
        console.log(`[HostPeer] Incoming connection attempt from ${conn.peer}`)

        conn.on('open', () => {
          if (!isMounted || isCleaningUpRef.current) return

          let assignedSlot: PlayerSlot | null = null

          // Reconnect handling: if the incoming peer is already known in Slot 1
          if (connP1Ref.current && connP1Ref.current.peer === conn.peer) {
            assignedSlot = 1
            connP1Ref.current = conn
            setPlayer1Connected(true)
            console.log(`[HostPeer] Player 1 (Cyan) reconnected from ${conn.peer}`)
          }
          // Reconnect handling: if the incoming peer is already known in Slot 2
          else if (connP2Ref.current && connP2Ref.current.peer === conn.peer) {
            assignedSlot = 2
            connP2Ref.current = conn
            setPlayer2Connected(true)
            console.log(`[HostPeer] Player 2 (Pink) reconnected from ${conn.peer}`)
          }
          // Slot 1 allocation
          else if (!connP1Ref.current || !connP1Ref.current.open) {
            assignedSlot = 1
            connP1Ref.current = conn
            setPlayer1Connected(true)
            console.log(`[HostPeer] Player 1 (Cyan) assigned to ${conn.peer}`)
          }
          // Slot 2 allocation
          else if (!connP2Ref.current || !connP2Ref.current.open) {
            assignedSlot = 2
            connP2Ref.current = conn
            setPlayer2Connected(true)
            console.log(`[HostPeer] Player 2 (Pink) assigned to ${conn.peer}`)
          }
          // Room full rejection: 2 active players already occupying both slots
          else {
            console.warn(`[HostPeer] Room ${roomId} full. Rejecting incoming peer ${conn.peer}`)
            try {
              conn.send({
                e: 'ROOM_FULL',
                message: 'AstroTether room is currently full (2 players active).'
              } as HostFeedbackEvent)
            } catch {
              // connection might already be closing
            }
            window.setTimeout(() => {
              try {
                conn.close()
              } catch {}
            }, 300)
            return
          }

          // Notify client of their allocated player slot
          try {
            conn.send({
              e: 'SLOT_ASSIGNED',
              slot: assignedSlot,
              message: `Joined as Player ${assignedSlot}`
            } as HostFeedbackEvent)
          } catch (err) {
            console.warn('[HostPeer] Failed to send SLOT_ASSIGNED:', err)
          }

          // Incoming high-frequency input packets (@ 40Hz) and control commands
          conn.on('data', (raw: unknown) => {
            if (!isMounted || isCleaningUpRef.current) return
            try {
              const data = (typeof raw === 'string' ? JSON.parse(raw) : raw) as
                | ControllerInputPayload
                | ClientCommandPayload

              if (!data || typeof data !== 'object') return

              // Control commands (Slot swap / role preference)
              if ('type' in data) {
                if (data.type === 'REQUEST_SLOT_SWAP') {
                  const isP1 = conn === connP1Ref.current
                  const isP2 = conn === connP2Ref.current

                  if (isP1) {
                    if (!connP2Ref.current || !connP2Ref.current.open) {
                      // Slot 2 is vacant -> Move P1 to P2
                      connP2Ref.current = connP1Ref.current
                      connP1Ref.current = null
                      setPlayer1Connected(false)
                      setPlayer2Connected(true)
                      latestInputsRef.current[2] = latestInputsRef.current[1]
                      latestInputsRef.current[1] = null
                      connP2Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 2,
                        message: 'Swapped to Beta Pod (Pink)'
                      } as HostFeedbackEvent)
                    } else {
                      // Both slots occupied -> Swap both players
                      const temp = connP1Ref.current
                      connP1Ref.current = connP2Ref.current
                      connP2Ref.current = temp
                      connP1Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 1,
                        message: 'Swapped to Alpha Pod (Cyan)'
                      } as HostFeedbackEvent)
                      connP2Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 2,
                        message: 'Swapped to Beta Pod (Pink)'
                      } as HostFeedbackEvent)
                    }
                  } else if (isP2) {
                    if (!connP1Ref.current || !connP1Ref.current.open) {
                      // Slot 1 is vacant -> Move P2 to P1
                      connP1Ref.current = connP2Ref.current
                      connP2Ref.current = null
                      setPlayer2Connected(false)
                      setPlayer1Connected(true)
                      latestInputsRef.current[1] = latestInputsRef.current[2]
                      latestInputsRef.current[2] = null
                      connP1Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 1,
                        message: 'Swapped to Alpha Pod (Cyan)'
                      } as HostFeedbackEvent)
                    } else {
                      // Both slots occupied -> Swap both players
                      const temp = connP1Ref.current
                      connP1Ref.current = connP2Ref.current
                      connP2Ref.current = temp
                      connP1Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 1,
                        message: 'Swapped to Alpha Pod (Cyan)'
                      } as HostFeedbackEvent)
                      connP2Ref.current?.send({
                        e: 'SLOT_ASSIGNED',
                        slot: 2,
                        message: 'Swapped to Beta Pod (Pink)'
                      } as HostFeedbackEvent)
                    }
                  }
                  return
                }

                if (data.type === 'PREFER_SLOT' && data.slot === 2) {
                  // If client preferred slot 2 and slot 2 is currently empty
                  if (conn === connP1Ref.current && (!connP2Ref.current || !connP2Ref.current.open)) {
                    connP2Ref.current = connP1Ref.current
                    connP1Ref.current = null
                    setPlayer1Connected(false)
                    setPlayer2Connected(true)
                    latestInputsRef.current[2] = latestInputsRef.current[1]
                    latestInputsRef.current[1] = null
                    connP2Ref.current?.send({
                      e: 'SLOT_ASSIGNED',
                      slot: 2,
                      message: 'Assigned to Beta Pod (Pink)'
                    } as HostFeedbackEvent)
                  }
                  return
                }
              }

              // Standard Controller Input Packet
              if ('p' in data) {
                // Security: strictly enforce slot based on the verified WebRTC connection reference
                const verifiedSlot: PlayerSlot | null =
                  conn === connP2Ref.current ? 2 : conn === connP1Ref.current ? 1 : null
                if (!verifiedSlot) return

                // Input sanitization & mathematical bounds clamping
                const rawSteer = Number(data.st)
                const clampedSteer = Number.isFinite(rawSteer)
                  ? Math.max(-1.0, Math.min(1.0, rawSteer))
                  : 0

                const rawThrust = Number(data.th)
                const clampedThrust = Number.isFinite(rawThrust)
                  ? Math.max(0.0, Math.min(1.0, rawThrust))
                  : 0

                const sanitizedPayload: ControllerInputPayload = {
                  p: verifiedSlot,
                  st: clampedSteer,
                  th: clampedThrust,
                  re: Boolean(data.re),
                  bo: Boolean(data.bo),
                  t: typeof data.t === 'number' ? data.t : Date.now(),
                  sh: data.sh
                }

                latestInputsRef.current[verifiedSlot] = sanitizedPayload
                setLatestInputs((prev) => ({
                  ...prev,
                  [verifiedSlot]: sanitizedPayload
                }))
              }
            } catch (err) {
              console.warn('[HostPeer] Malformed input payload received:', err)
            }
          })

          // Handle disconnects
          conn.on('close', () => {
            if (!isMounted || isCleaningUpRef.current) return
            if (connP1Ref.current === conn) {
              console.log('[HostPeer] Player 1 disconnected')
              connP1Ref.current = null
              setPlayer1Connected(false)
              latestInputsRef.current[1] = null
            } else if (connP2Ref.current === conn) {
              console.log('[HostPeer] Player 2 disconnected')
              connP2Ref.current = null
              setPlayer2Connected(false)
              latestInputsRef.current[2] = null
            }
          })

          conn.on('error', (err) => {
            console.error(`[HostPeer] Connection error on ${conn.peer}:`, err)
          })
        })
      })

      peer.on('error', (err: { type?: string; message?: string }) => {
        if (!isMounted || isCleaningUpRef.current) return
        const errType = err.type || ''
        const errMsg = err.message || ''

        if (errType === 'unavailable-id') {
          console.warn(`[HostPeer] Room ID ${roomId} already in use. Generating a new room...`)
          setRoomId(generateRoomId())
          return
        }

        // Handle transient websocket disconnect gracefully
        if (errType === 'network' || errMsg.includes('Lost connection') || errMsg.includes('socket')) {
          console.warn('[HostPeer] Signaling websocket connection drop detected. Scheduling reconnect...')
          scheduleReconnect(2000)
          return
        }

        console.error('[HostPeer] Peer server error:', err)
        setErrorMessage(errMsg || 'WebRTC signaling error occurred.')
      })

      peer.on('disconnected', () => {
        if (!isMounted || isCleaningUpRef.current) return
        console.warn('[HostPeer] Disconnected from signaling server. P2P DataChannels remain active. Scheduling reconnect...')
        scheduleReconnect(1500)
      })

      peer.on('close', () => {
        if (!isMounted || isCleaningUpRef.current) return
        setConnectionState('DISCONNECTED')
      })
    }, 150)

    // Strict-mode safe unmount cleanup
    return () => {
      isMounted = false
      isCleaningUpRef.current = true
      window.clearTimeout(initTimer)

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (connP1Ref.current) {
        try {
          connP1Ref.current.close()
        } catch {}
        connP1Ref.current = null
      }
      if (connP2Ref.current) {
        try {
          connP2Ref.current.close()
        } catch {}
        connP2Ref.current = null
      }
      if (peerRef.current) {
        try {
          if (!peerRef.current.destroyed) {
            peerRef.current.destroy()
          }
        } catch {}
        peerRef.current = null
      }
    }
  }, [roomId])

  return {
    roomId,
    connectionState,
    player1Connected,
    player2Connected,
    latestInputs,
    errorMessage,
    broadcastFeedback,
    sendFeedbackToPlayer,
    getLatestInputs,
    regenerateRoom
  }
}

export default useHostPeer
