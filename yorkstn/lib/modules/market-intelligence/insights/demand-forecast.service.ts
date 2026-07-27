import { prisma } from '@/lib/db'
import { generateAndSaveInsight } from '../insight-generation.service'

export const DEMAND_FORECAST_METHODOLOGY_NOTE = 'proxy-based (no first-party sales history)'

// Feature spec 1.5 — US-14. Addresses the Phase 1-identified "cold start"
// gap: forecasts for a brand with zero India sales history, built from
// category/city/comparable-brand proxy signals, never the org's own sales
// data (which doesn't exist yet for a first-time entrant).
export async function generateDemandForecast(organizationId: string, requestedByUserId?: string) {
  const brandProfile = await prisma.brandProfile.findUnique({ where: { organizationId } })
  const tags = ['demand', 'general', brandProfile?.category ?? 'general']

  return generateAndSaveInsight({
    organizationId,
    category: 'demand_forecast',
    inputParams: { category: brandProfile?.category, priceTier: brandProfile?.priceTier },
    tags,
    requestedByUserId,
    methodologyNote: DEMAND_FORECAST_METHODOLOGY_NOTE,
  })
}
