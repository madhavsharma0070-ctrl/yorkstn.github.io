import type { AiGenerateRequest, AiOutput, AiProvider } from './types'

export const MOCK_PROVIDER_VERSION = 'mock-v1'

/**
 * Deterministic MVP default (DECISIONS.md D-11): produces AI-Output-
 * Standard-shaped responses from whatever the caller's retrieval step
 * found in the curated corpus — never fabricates a fact the corpus doesn't
 * contain. Same input always produces the same output (no randomness),
 * which matters for demo repeatability and for testing downstream code
 * without network flakiness.
 */
export class MockAiProvider implements AiProvider {
  async generate(request: AiGenerateRequest): Promise<AiOutput> {
    const generatedAt = new Date().toISOString()

    if (request.retrievalContext.length === 0) {
      return {
        summary: `No curated data was found for this ${request.category.replace(/_/g, ' ')} query. This is a known MVP limitation of the seed corpus, not a hidden null result.`,
        confidence: 'insufficient_data',
        sources: [],
        assumptions: [
          'The mock AI provider only draws on a small curated seed corpus (lib/modules/market-intelligence/retrieval/corpus.ts), not a live licensed data feed — see docs/phase2/AI_ARCHITECTURE.md Category (a)/(d) split.',
        ],
        structuredOutput: {},
        generatedAt,
        modelVersion: MOCK_PROVIDER_VERSION,
      }
    }

    const summary = request.retrievalContext.map((hit) => hit.excerpt).join(' ')

    return {
      summary,
      confidence: 'medium', // never 'high' from the mock provider — this is curated seed data, not a verified production feed
      sources: request.retrievalContext.map((hit) => ({
        title: hit.title,
        url: hit.url,
        retrievedDate: generatedAt.slice(0, 10),
      })),
      assumptions: [
        'This summary is synthesized from a small curated seed corpus (not a live licensed data feed) — see docs/phase2/AI_ARCHITECTURE.md Category (a)/(d) split. Re-verify any figure against the cited source before treating it as current.',
      ],
      structuredOutput: {
        matchedTopics: request.retrievalContext.map((hit) => hit.title),
        inputParams: request.inputParams,
      },
      generatedAt,
      modelVersion: MOCK_PROVIDER_VERSION,
    }
  }
}
