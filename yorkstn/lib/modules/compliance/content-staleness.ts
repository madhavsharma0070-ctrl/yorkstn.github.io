/**
 * "Last verified" staleness convention (AC US-27): every Compliance rule/
 * checklist item displays a last-verified date and source link, and renders
 * a visible staleness indicator once that date is older than the
 * configured threshold — never silently treated as current.
 */

export const STALENESS_THRESHOLD_DAYS = 180

export function isContentStale(lastVerifiedAt: Date | null | undefined): boolean {
  if (!lastVerifiedAt) return true // never-verified content is treated as stale, not "fine by default"
  const ageMs = Date.now() - lastVerifiedAt.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return ageDays > STALENESS_THRESHOLD_DAYS
}
