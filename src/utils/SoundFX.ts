/**
 * Procedural Audio Synthesizer (SoundFX) using Web Audio API
 * Zero external audio assets, instant loading, procedural synthesis per /docs/PRD.md Section 7
 */

class SoundFXSynthesizer {
  private ctx: AudioContext | null = null

  // Engine hum state
  private isHumming = false
  private humOsc1: OscillatorNode | null = null
  private humOsc2: OscillatorNode | null = null
  private humFilter: BiquadFilterNode | null = null
  private humGain: GainNode | null = null

  // Tether strain state
  private lastStrainPingTime = 0

  constructor() {
    // Lazy AudioContext initialization
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Initializes and starts the continuous dual-oscillator engine hum
   */
  public startEngineHum(): void {
    if (this.isHumming) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      // Dual sawtooth oscillators slightly detuned for chorus richness
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc1.type = 'sawtooth'
      osc2.type = 'sawtooth'

      // Base idle frequencies (sub-rumble)
      osc1.frequency.setValueAtTime(55, ctx.currentTime) // A1
      osc2.frequency.setValueAtTime(56.8, ctx.currentTime) // Detuned for organic phase pulsing

      // Lowpass filter to muffle harsh sawtooth harmonics when idle
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(140, ctx.currentTime)
      filter.Q.setValueAtTime(3, ctx.currentTime)

      // Start at very low idle gain
      gain.gain.setValueAtTime(0.015, ctx.currentTime)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc1.start()
      osc2.start()

      this.humOsc1 = osc1
      this.humOsc2 = osc2
      this.humFilter = filter
      this.humGain = gain
      this.isHumming = true
    } catch (e) {
      console.warn('Engine hum init deferred:', e)
    }
  }

  /**
   * Modulates the engine hum pitch, filter cutoff, and gain tied to live ship thrust
   * @param p1Thrust 0.0 to 1.0
   * @param p2Thrust 0.0 to 1.0
   */
  public updateEngineHum(p1Thrust: number, p2Thrust: number): void {
    if (!this.isHumming) {
      this.startEngineHum()
    }
    const ctx = this.getContext()
    if (!ctx || !this.humOsc1 || !this.humOsc2 || !this.humFilter || !this.humGain) return

    const combinedThrust = Math.min(1.0, Math.max(0, p1Thrust + p2Thrust))
    const now = ctx.currentTime

    // Modulate pitch: 55Hz (idle) -> 125Hz (full dual thrust)
    const targetFreq1 = 55 + combinedThrust * 70
    const targetFreq2 = 56.8 + combinedThrust * 72
    this.humOsc1.frequency.setTargetAtTime(targetFreq1, now, 0.08)
    this.humOsc2.frequency.setTargetAtTime(targetFreq2, now, 0.08)

    // Modulate filter cutoff: opens up higher harmonics on acceleration (140Hz -> 850Hz)
    const targetCutoff = 140 + combinedThrust * 710
    this.humFilter.frequency.setTargetAtTime(targetCutoff, now, 0.06)

    // Modulate gain volume: idle 0.015 -> active 0.12
    const targetGain = 0.015 + combinedThrust * 0.105
    this.humGain.gain.setTargetAtTime(targetGain, now, 0.08)
  }

  /**
   * Stops the engine hum
   */
  public stopEngineHum(): void {
    if (!this.isHumming) return
    try {
      this.humOsc1?.stop()
      this.humOsc2?.stop()
      this.humOsc1?.disconnect()
      this.humOsc2?.disconnect()
      this.humFilter?.disconnect()
      this.humGain?.disconnect()
    } catch {}
    this.humOsc1 = null
    this.humOsc2 = null
    this.humFilter = null
    this.humGain = null
    this.isHumming = false
  }

  /**
   * Evaluates tether distance and plays an accelerating high-frequency strain ping
   * as the rope stretches towards its critical limit (240px to 380px)
   */
  public updateTetherStrain(distance: number, maxElongation = 380): void {
    const minStrainDistance = 240
    if (distance < minStrainDistance) return

    const ctx = this.getContext()
    if (!ctx) return

    // Calculate strain factor: 0.0 at 240px -> 1.0 at 380px
    const strain = Math.min(1.0, (distance - minStrainDistance) / (maxElongation - minStrainDistance))

    // Acceleration of pings: 750ms interval at low strain down to 110ms at critical threshold
    const intervalMs = 750 - strain * 640
    const nowMs = performance.now()

    if (nowMs - this.lastStrainPingTime >= intervalMs) {
      this.lastStrainPingTime = nowMs

      // High frequency ping rising from 1800Hz to 3200Hz
      const pingFreq = 1800 + strain * 1400
      this.playStrainPing(pingFreq, strain)
    }
  }

  private playStrainPing(frequency: number, strain: number): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    // Quick micro pitch slide up for tense acoustic ping
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.08, ctx.currentTime + 0.04)

    const volume = 0.05 + strain * 0.15
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  }

  /**
   * Boost / Slingshot Maneuver Sound:
   * White noise frequency sweep + low punch tone
   */
  public playBoostSlingshot(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 1. Low sub-bass punch (85Hz exponential drop to 32Hz)
    const punchOsc = ctx.createOscillator()
    const punchGain = ctx.createGain()

    punchOsc.type = 'sine'
    punchOsc.frequency.setValueAtTime(85, now)
    punchOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35)

    punchGain.gain.setValueAtTime(0.35, now)
    punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    punchOsc.connect(punchGain)
    punchGain.connect(ctx.destination)

    punchOsc.start()
    punchOsc.stop(now + 0.35)

    // 2. Procedural white noise whoosh / sweep
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.4) // 400ms buffer
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(1400, now)
      bandpass.frequency.exponentialRampToValueAtTime(300, now + 0.35)
      bandpass.Q.setValueAtTime(2.5, now)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.25, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)

      whiteNoise.connect(bandpass)
      bandpass.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      whiteNoise.start(now)
      whiteNoise.stop(now + 0.4)
    } catch (e) {
      console.warn('Noise sweep fallback:', e)
    }
  }

  /**
   * Success / Star Collect Chime:
   * Pleasant major chord arpeggio chime with resonant decay
   */
  public playSuccessArpeggio(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Radiant C Major / Lydian ascending arpeggio notes
    // C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), B5 (987.77Hz), C6 (1046.5Hz), E6 (1318.51Hz)
    const chordFrequencies = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]

    chordFrequencies.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.075

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Alternating sine and triangle for sparkling harmonics
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      // Bell-like chime envelope
      gain.gain.setValueAtTime(0.18, startTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.6)
    })
  }

  /**
   * Tether snap rupture sound (harsh discordant shockwave)
   */
  public playTetherSnap(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Discordant twin saw frequencies
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sawtooth'
    osc2.type = 'sawtooth'

    osc1.frequency.setValueAtTime(440, now)
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.3)

    osc2.frequency.setValueAtTime(475, now) // Minor second dissonance
    osc2.frequency.exponentialRampToValueAtTime(65, now + 0.3)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.35)
    osc2.stop(now + 0.35)
  }

  /**
   * Collision impact sound
   */
  public playCollisionHit(isHeavy = true): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(isHeavy ? 130 : 200, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + (isHeavy ? 0.22 : 0.12))

    gain.gain.setValueAtTime(isHeavy ? 0.3 : 0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isHeavy ? 0.22 : 0.12))

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + (isHeavy ? 0.22 : 0.12))
  }

  /**
   * Starlight Crystal / Collectible chime
   */
  public playStarCollect(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [587.33, 739.99, 880.0, 1174.66] // D5, F#5, A5, D6 sparkling chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const noteTime = now + idx * 0.04

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, noteTime)
      gain.gain.setValueAtTime(0.12, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteTime)
      osc.stop(noteTime + 0.25)
    })
  }
}

export const SoundFX = new SoundFXSynthesizer()
