import type { AiGenerateRequest, AiOutput, AiProvider, AiConfidence } from './types'

const CLAUDE_MODEL = 'claude-sonnet-5'

/**
 * Real generative provider, documented drop-in per DECISIONS.md D-11.
 *
 * NOT EXERCISED IN THIS ENVIRONMENT — no ANTHROPIC_API_KEY is configured
 * here (docs/phase2/DEPLOYMENT_ARCHITECTURE.md §8's credential checklist),
 * so this class has not been run against a live API and must be verified
 * once a real key is provisioned, before relying on it in production. It
 * is written directly against the Messages API via `fetch` (no SDK
 * dependency) so it's easy to audit; switch to `@anthropic-ai/sdk` later
 * if richer features (streaming, tool use) are needed.
 *
 * Grounding: the prompt instructs the model to answer ONLY from the
 * supplied retrieval context and to say so explicitly (confidence:
 * insufficient_data) rather than use outside knowledge — this mirrors the
 * mock provider's behavior and the project's "cite or label as assumption,
 * never fabricate" rule (BLUEPRINT.md, VALIDATION_PLAN.md).
 */
export class ClaudeAiProvider implements AiProvider {
  async generate(request: AiGenerateRequest): Promise<AiOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        'AI_PROVIDER=anthropic is configured but ANTHROPIC_API_KEY is not set. See docs/phase2/DEPLOYMENT_ARCHITECTURE.md §8.',
      )
    }

    const contextBlock = request.retrievalContext
      .map((hit, i) => `[${i + 1}] ${hit.title}\n${hit.excerpt}\nSource: ${hit.url ?? 'internal curated data'}`)
      .join('\n\n')

    const systemPrompt = `You are Yorkstn's market-intelligence assistant. Answer ONLY using the numbered context sources below — never use outside knowledge or invent facts. If the context doesn't contain enough information to answer confidently, say so explicitly and set confidence to "insufficient_data". Respond with ONLY a JSON object matching this TypeScript type, no other text:
{ "summary": string, "confidence": "high"|"medium"|"low"|"insufficient_data", "assumptions": string[], "structuredOutput": object }
Cite which numbered source(s) each claim in "summary" draws from, inline as [1], [2], etc.

Context:
${contextBlock || '(no relevant context found)'}`

    const userPrompt = `Category: ${request.category}\nInput parameters: ${JSON.stringify(request.inputParams)}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API request failed: ${response.status} ${await response.text()}`)
    }

    const body = (await response.json()) as { content: { type: string; text?: string }[] }
    const text = body.content.find((block) => block.type === 'text')?.text ?? '{}'

    let parsed: { summary: string; confidence: AiConfidence; assumptions: string[]; structuredOutput: Record<string, unknown> }
    try {
      parsed = JSON.parse(text)
    } catch {
      // The model didn't return valid JSON — surface this honestly rather
      // than silently returning a broken/empty insight.
      parsed = {
        summary: 'The AI provider returned an unparseable response.',
        confidence: 'insufficient_data',
        assumptions: ['Claude response was not valid JSON — see raw response in server logs.'],
        structuredOutput: {},
      }
      // eslint-disable-next-line no-console
      console.error('[claude-provider] unparseable response:', text)
    }

    return {
      summary: parsed.summary,
      confidence: parsed.confidence,
      assumptions: parsed.assumptions,
      structuredOutput: parsed.structuredOutput,
      sources: request.retrievalContext.map((hit) => ({
        title: hit.title,
        url: hit.url,
        retrievedDate: new Date().toISOString().slice(0, 10),
      })),
      generatedAt: new Date().toISOString(),
      modelVersion: CLAUDE_MODEL,
    }
  }
}
