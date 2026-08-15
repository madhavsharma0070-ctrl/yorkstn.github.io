import { CORPUS } from './corpus'
import type { RetrievalHit } from '../ai-provider/types'

/**
 * Tag-overlap retrieval (docs/phase2/AI_ARCHITECTURE.md §1's RAG design,
 * scoped down for MVP — see DECISIONS.md D-25). No vector embeddings/
 * pgvector: those are Postgres-only and there is no embedding-API
 * credential in this environment, so retrieval is deterministic keyword/
 * tag matching against the curated corpus rather than semantic search.
 * This is a documented MVP scope decision, not a placeholder pretending to
 * be full RAG.
 */
export function retrieve(tags: string[], limit = 5): RetrievalHit[] {
  const lowerTags = tags.map((t) => t.toLowerCase())

  const scored = CORPUS.map((hit) => {
    const overlap = hit.tags.filter((t) => lowerTags.includes(t.toLowerCase())).length
    return { hit, overlap }
  }).filter((s) => s.overlap > 0)

  scored.sort((a, b) => b.overlap - a.overlap)

  return scored.slice(0, limit).map((s) => s.hit)
}
