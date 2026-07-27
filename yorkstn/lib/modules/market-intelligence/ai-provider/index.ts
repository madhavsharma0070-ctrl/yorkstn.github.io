import type { AiProvider } from './types'
import { MockAiProvider } from './mock-provider'
import { ClaudeAiProvider } from './claude-provider'

export type { AiProvider, AiOutput, AiGenerateRequest, AiInsightCategory, AiConfidence, RetrievalHit, AiSource } from './types'

/**
 * Provider selection (DECISIONS.md D-11). Defaults to `mock` — a fully
 * functional MVP requires no real LLM API key. Set AI_PROVIDER=anthropic
 * (+ ANTHROPIC_API_KEY) to switch to real generative output; no other code
 * needs to change since both providers satisfy the same AiProvider interface.
 */
export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? 'mock'
  if (provider === 'anthropic') return new ClaudeAiProvider()
  return new MockAiProvider()
}
