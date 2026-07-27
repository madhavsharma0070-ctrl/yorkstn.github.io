/**
 * Expansion Readiness Score (US-16, AC US-16) — deterministic, pure
 * function, no I/O, never AI-generated (DECISIONS.md D-04). Same inputs
 * always produce the same score, which is exactly what the acceptance
 * criteria test.
 */

export const READINESS_SCORE_ENGINE_VERSION = 'readiness-score-v1'

export interface ReadinessScoreInputs {
  complianceCompletionPct: number // 0-100, from real ComplianceWorkflowItem data
  hasMarketAnalysis: boolean
  hasCityRecommendation: boolean
  hasPricingIntelligence: boolean
  hasSecuredBudget: boolean
  hasDefinedTimeline: boolean
}

export interface ReadinessScoreDriver {
  driverName: string
  pointsEarned: number
  pointsPossible: number
}

export interface ReadinessScoreResult {
  totalScore: number
  drivers: ReadinessScoreDriver[]
  ruleEngineVersion: string
}

const COMPLIANCE_POINTS_POSSIBLE = 40
const MARKET_CLARITY_POINTS_POSSIBLE = 30
const CAPITAL_POINTS_POSSIBLE = 30

export function calculateReadinessScore(inputs: ReadinessScoreInputs): ReadinessScoreResult {
  const compliancePoints = Math.round((inputs.complianceCompletionPct / 100) * COMPLIANCE_POINTS_POSSIBLE)

  const marketClaritySignals = [inputs.hasMarketAnalysis, inputs.hasCityRecommendation, inputs.hasPricingIntelligence]
  const marketClarityPoints = marketClaritySignals.filter(Boolean).length * (MARKET_CLARITY_POINTS_POSSIBLE / 3)

  const capitalSignals = [inputs.hasSecuredBudget, inputs.hasDefinedTimeline]
  const capitalPoints = capitalSignals.filter(Boolean).length * (CAPITAL_POINTS_POSSIBLE / 2)

  const drivers: ReadinessScoreDriver[] = [
    { driverName: 'compliance', pointsEarned: compliancePoints, pointsPossible: COMPLIANCE_POINTS_POSSIBLE },
    { driverName: 'market_clarity', pointsEarned: marketClarityPoints, pointsPossible: MARKET_CLARITY_POINTS_POSSIBLE },
    { driverName: 'capital_readiness', pointsEarned: capitalPoints, pointsPossible: CAPITAL_POINTS_POSSIBLE },
  ]

  const totalScore = Math.round(drivers.reduce((sum, d) => sum + d.pointsEarned, 0))

  return { totalScore, drivers, ruleEngineVersion: READINESS_SCORE_ENGINE_VERSION }
}
