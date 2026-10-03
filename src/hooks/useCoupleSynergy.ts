import { useState, useRef, useCallback } from 'react'

export interface CoupleSynergyResult {
  score: number // 0 to 100%
  title: string
  quote: string
  runTimeSeconds: number
  runTimeFormatted: string
  collisionCount: number
  breakWarnings: number
  tensionConsistencyPercent: number
  simultaneousDecisionPercent: number
}

/**
 * Calculates Couple Synergy Metrics based on /docs/PRD.md Section 8
 */
export function useCoupleSynergy() {
  const startTimeRef = useRef<number>(Date.now())
  const totalTicksRef = useRef<number>(0)
  const optimalTensionTicksRef = useRef<number>(0)
  const collisionsCountRef = useRef<number>(0)
  const breakWarningsRef = useRef<number>(0)

  // Simultaneous decision tracking (< 300ms window)
  const p1LastActionTimeRef = useRef<number>(0)
  const p2LastActionTimeRef = useRef<number>(0)
  const totalDecisionsRef = useRef<number>(0)
  const synchronizedDecisionsRef = useRef<number>(0)

  const [currentScore, setCurrentScore] = useState<number>(85)

  /**
   * Resets telemetry metrics at the start of a stage
   */
  const resetMetrics = useCallback(() => {
    startTimeRef.current = Date.now()
    totalTicksRef.current = 0
    optimalTensionTicksRef.current = 0
    collisionsCountRef.current = 0
    breakWarningsRef.current = 0
    totalDecisionsRef.current = 0
    synchronizedDecisionsRef.current = 0
    setCurrentScore(85)
  }, [])

  /**
   * Called every tick to evaluate live distance and inputs
   */
  const recordTick = useCallback((
    tetherDistance: number,
    p1Active: boolean,
    p2Active: boolean
  ) => {
    totalTicksRef.current++
    const now = Date.now()

    // 1. Tension Consistency: 120px to 220px is optimal (PRD Section 8)
    if (tetherDistance >= 120 && tetherDistance <= 220) {
      optimalTensionTicksRef.current++
    }

    if (tetherDistance > 380) {
      breakWarningsRef.current++
    }

    // 2. Synchronized decision tracking (< 300ms)
    if (p1Active) {
      p1LastActionTimeRef.current = now
      totalDecisionsRef.current++
      if (now - p2LastActionTimeRef.current < 300) {
        synchronizedDecisionsRef.current++
      }
    }

    if (p2Active) {
      p2LastActionTimeRef.current = now
      totalDecisionsRef.current++
      if (now - p1LastActionTimeRef.current < 300) {
        synchronizedDecisionsRef.current++
      }
    }

    // Throttled live score estimation
    if (totalTicksRef.current % 30 === 0) {
      const tensionRatio = totalTicksRef.current > 0
        ? optimalTensionTicksRef.current / totalTicksRef.current
        : 0.8
      const syncRatio = totalDecisionsRef.current > 0
        ? synchronizedDecisionsRef.current / totalDecisionsRef.current
        : 0.7
      const penalty = Math.min(25, collisionsCountRef.current * 4)

      const live = Math.round(
        Math.max(20, Math.min(100, tensionRatio * 40 + syncRatio * 35 + 25 - penalty))
      )
      setCurrentScore(live)
    }
  }, [])

  /**
   * Records a collision impact
   */
  const recordCollision = useCallback(() => {
    collisionsCountRef.current++
  }, [])

  /**
   * Final evaluation for the post-game synergy card (PRD Section 8)
   */
  const evaluateFinalSynergy = useCallback((): CoupleSynergyResult => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    const mins = Math.floor(elapsedSeconds / 60)
    const secs = elapsedSeconds % 60
    const runTimeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} min`

    const tensionRatio = totalTicksRef.current > 0
      ? optimalTensionTicksRef.current / totalTicksRef.current
      : 0.75
    const syncRatio = totalDecisionsRef.current > 0
      ? synchronizedDecisionsRef.current / totalDecisionsRef.current
      : 0.7

    const tensionConsistencyPercent = Math.round(tensionRatio * 100)
    const simultaneousDecisionPercent = Math.round(syncRatio * 100)

    // Formula: 40% Tension Consistency + 35% Sync Decisions + 25% Baseline - Penalties
    const collisionPenalty = Math.min(25, collisionsCountRef.current * 5)
    const score = Math.round(
      Math.max(25, Math.min(99, tensionRatio * 40 + syncRatio * 35 + 25 - collisionPenalty))
    )

    let title = 'Harmonic Duo'
    let quote = 'You move like two stars in perfect orbit!'

    if (score >= 90) {
      title = 'Harmonic Duo'
      quote = 'You move like two stars in perfect orbit!'
    } else if (score >= 75) {
      title = 'Tether Lovers'
      quote = 'Strong emotional bond with playful orbital turbulence!'
    } else if (score >= 60) {
      title = 'Tug-of-War Pair'
      quote = 'A little cosmic friction only makes your connection stronger!'
    } else {
      title = 'Chaos Couple'
      quote = 'Cosmic explosion of chaotic romance and wild asteroid bounces!'
    }

    return {
      score,
      title,
      quote,
      runTimeSeconds: elapsedSeconds,
      runTimeFormatted,
      collisionCount: collisionsCountRef.current,
      breakWarnings: Math.min(12, Math.round(breakWarningsRef.current / 60)),
      tensionConsistencyPercent,
      simultaneousDecisionPercent
    }
  }, [])

  return {
    currentScore,
    resetMetrics,
    recordTick,
    recordCollision,
    evaluateFinalSynergy
  }
}
