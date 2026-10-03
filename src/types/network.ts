/**
 * Network Protocol Types & Wire Contracts based on /docs/PRD.md Section 4
 */

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ROOM_FULL'

export type PlayerSlot = 1 | 2

export type HapticIntensity = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'PULSE'

export type ShipShape = 'dart' | 'manta' | 'ring' | 'saucer' | 'scarab' | 'jelly'

/**
 * High-frequency client to host input payload emitted @ 40Hz
 */
export interface ControllerInputPayload {
  t: number // Timestamp (epoch ms)
  p: PlayerSlot // Player ID: 1 or 2
  st: number // Steer (-1.0 left to +1.0 right)
  th: number // Thrust (0.0 idle to 1.0 full)
  re: boolean // Reel / Pull tether active
  bo: boolean // Sync boost trigger
  sh?: ShipShape // Selected spacecraft customization shape
}

/**
 * Low-frequency host to client feedback event payload
 */
export interface HostFeedbackEvent {
  e:
    | 'SLOT_ASSIGNED'
    | 'COLLISION'
    | 'TETHER_SNAP'
    | 'OVERSTRETCH'
    | 'SLINGSHOT'
    | 'SUCCESS'
    | 'ROOM_FULL'
    | 'PING'
  intensity?: HapticIntensity
  target?: 1 | 2 | 0 // 0 = both players
  score?: number
  slot?: PlayerSlot
  message?: string
}

/**
 * Player connection slot state in Host
 */
export interface PlayerConnection {
  slot: PlayerSlot
  peerId: string
  connectedAt: number
  lastPing: number
}

/**
 * PeerJS namespace prefix to isolate public room IDs
 */
export const PEER_PREFIX = 'astrotether-v1-'

/**
 * Production-ready WebRTC ICE configuration using Google Public STUN
 */
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

/**
 * Generates a clean, unambiguous 4-character room ID (uppercase)
 */
export function generateRoomId(): string {
  // Exclude easily confused characters like 0, O, 1, I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Converts a 4-char Room ID to fully-qualified PeerJS ID
 */
export function toHostPeerId(roomId: string): string {
  return `${PEER_PREFIX}${roomId.trim().toUpperCase()}`
}

/**
 * Converts fully-qualified PeerJS ID back to 4-char Room ID
 */
export function fromHostPeerId(peerId: string): string {
  if (peerId.startsWith(PEER_PREFIX)) {
    return peerId.slice(PEER_PREFIX.length)
  }
  return peerId
}
