/**
 * Trademark/IP status-stage tracker (US-24, feature spec 2.5). Fixed
 * sequence per research/india-market-entry-regulatory-landscape.md §7:
 * search -> filing -> examination -> publication -> opposition -> registration.
 */
export const TRADEMARK_STAGES = [
  'search',
  'filing',
  'examination',
  'publication',
  'opposition_window',
  'registered',
] as const

export type TrademarkStage = (typeof TRADEMARK_STAGES)[number]

export function nextStage(current: TrademarkStage): TrademarkStage | null {
  const idx = TRADEMARK_STAGES.indexOf(current)
  return idx >= 0 && idx < TRADEMARK_STAGES.length - 1 ? TRADEMARK_STAGES[idx + 1] : null
}

export const TRADEMARK_STAGE_NOTES: Record<TrademarkStage, string> = {
  search: 'Prior trademark search to check for conflicting marks before filing.',
  filing: 'Application filed with the CGPDTM, with goods/services class and any priority claim.',
  examination: 'CGPDTM examines the application for distinctiveness and conflicts.',
  publication: 'Mark published in the Trademark Journal.',
  opposition_window: 'A 4-month window during which third parties may oppose the registration.',
  registered: 'Trademark registered — protection is now in force.',
}
