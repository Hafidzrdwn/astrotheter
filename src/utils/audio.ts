/**
 * Zero-Asset Web Audio Synthesizer Engine based on /docs/PRD.md Section 7
 * Generates all real-time sound cues without external audio files.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Plays a simple synthetic tone with envelope
 */
export function playTone(freq: number, type: OscillatorType = 'sine', duration = 0.15, gainVal = 0.15) {
  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)

  gain.gain.setValueAtTime(gainVal, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + duration)
}

/**
 * Chime when a player connects to the room
 */
export function playPlayerJoinSound(slot: 1 | 2) {
  const ctx = getAudioContext()
  if (!ctx) return

  const root = slot === 1 ? 523.25 : 659.25 // C5 or E5
  playTone(root, 'sine', 0.12, 0.15)
  setTimeout(() => playTone(root * 1.5, 'sine', 0.25, 0.18), 120) // Fifth harmonic
}

/**
 * Beep during the 3-2-1 countdown
 */
export function playCountdownTick(isLaunch = false) {
  if (isLaunch) {
    // High-energy launch burst
    playTone(1046.5, 'triangle', 0.4, 0.25) // C6
    setTimeout(() => playTone(1318.5, 'sine', 0.4, 0.2), 100) // E6
  } else {
    // 3.. 2.. 1.. tick
    playTone(659.25, 'sine', 0.12, 0.18) // E5
  }
}

/**
 * Resonant ping when players are holding the sync button
 */
export function playSyncHoldSound(progressPercent: number) {
  // Pitch rises from 300Hz to 600Hz as progress builds
  const freq = 300 + (progressPercent / 100) * 300
  playTone(freq, 'triangle', 0.08, 0.08)
}

/**
 * Pentatonic major warp sequence on game launch (PRD Section 7)
 */
export function playWarpLaunchSequence() {
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.5] // C5, E5, G5, B5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'sine', 0.25, 0.18)
    }, idx * 70)
  })
}
