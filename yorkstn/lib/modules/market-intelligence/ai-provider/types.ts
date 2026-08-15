/**
 * The AI Output Standard (docs/phase2/FEATURE_SPECIFICATIONS.md — "AI
 * Output Standard" header, DECISIONS.md D-05). Every generative feature in
 * the product returns exactly this shape, whichever provider produced it.
 */
export interface AiSource {
  title: string
  url: string | null
  retrievedDate: string // ISO date
}

export type AiConfidence = 'high' | 'medium' | 'low' | 'insufficient_data'

export interface AiOutput {
  summary: string
  confidence: AiConfidence
  sources: AiSource[]
  assumptions: string[]
  structuredOutput: Record<string, unknown>
  methodologyNote?: string
  generatedAt: string // ISO datetime
  modelVersion: string
}

export interface RetrievalHit {
  title: string
  url: string | null
  excerpt: string
  tags: string[]
}

export type AiInsightCategory =
  | 'market_analysis'
  | 'consumer_insights'
  | 'competitor_intelligence'
  | 'pricing_intelligence'
  | 'demand_forecast'
  | 'city_recommendation'
  | 'partner_recommendation'

export interface AiGenerateRequest {
  category: AiInsightCategory
  inputParams: Record<string, unknown>
  retrievalContext: RetrievalHit[]
}

/**
 * Provider-agnostic interface (docs/phase2/AI_ARCHITECTURE.md, DECISIONS.md
 * D-11). The `mock` provider is the MVP default and is fully functional
 * without any external credentials; `claude` is a documented drop-in,
 * selected via the AI_PROVIDER env var.
 */
export interface AiProvider {
  generate(request: AiGenerateRequest): Promise<AiOutput>
}
