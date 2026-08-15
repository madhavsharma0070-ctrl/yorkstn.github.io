import type { RetrievalHit } from '../ai-provider/types'

/**
 * Curated retrieval corpus for the `mock` AI provider (docs/phase2/
 * AI_ARCHITECTURE.md §1: RAG grounded in "the Phase 1 research corpus and
 * seeded category/city content"). This is a small, hand-picked set of
 * facts actually established in Phase 1 research, each with its real
 * source file — NOT a general-purpose knowledge base, and NOT a substitute
 * for the real `research/*.md` files it summarizes. Every entry here must
 * trace to a specific, checkable claim in those files; when the mock
 * provider can't find a relevant entry for a query, it must say so
 * (`confidence: 'insufficient_data'`) rather than invent one.
 *
 * `tags` drive retrieval matching in `corpus-index.ts`: brand categories
 * (fashion/lifestyle/kids/beauty_personal_care/home_living/specialty),
 * topics (distribution, pricing, demand, competitors, cities), and
 * general India market-entry context.
 */

const RESEARCH_BASE =
  'https://github.com/madhavsharma0070-ctrl/yorkstn.github.io/blob/main/research'

export const CORPUS: RetrievalHit[] = [
  {
    title: 'India retail distribution: General Trade still dominant',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'General Trade (traditional kirana/independent retail) is reported to still account for 70-75% of FMCG sales in India and remains dominant in rural/semi-urban markets, running through a Manufacturer -> C&F Agent -> Superstockist -> Distributor -> Retailer chain. Modern Trade and quick commerce are fast-growing but distinct channels.',
    tags: ['distribution', 'general', 'fashion', 'lifestyle', 'kids', 'beauty_personal_care', 'home_living', 'specialty'],
  },
  {
    title: 'Quick commerce growth in India',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'Quick commerce (Blinkit, Zepto, Swiggy Instamart, plus newer entrants) is reported to be valued at roughly INR 640 billion (~USD 7.28 billion) in FY2025, with projections to potentially triple by 2028 — a distinct, dark-store-based distribution model relevant to consumer brands entry planning.',
    tags: ['distribution', 'demand', 'general'],
  },
  {
    title: 'GST 2.0 rate restructuring (Sept 2025)',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'Effective 22 September 2025, India simplified GST into primarily 0%, 5%, 18%, and 40% slabs. Everyday consumer items are often at 5%, most consumer electronics/general goods at 18%, and luxury/"sin" goods at 40% — directly relevant to India price-point planning.',
    tags: ['pricing', 'general'],
  },
  {
    title: 'Retail FDI: Single-Brand vs. Multi-Brand',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'Single-Brand Retail Trading permits 100% FDI under the automatic route (with a 30% local-sourcing condition above 51% FDI). Multi-Brand Retail Trading is capped at 51% FDI, requires government approval, a minimum USD 100 million investment, and is barred from e-commerce sales.',
    tags: ['general', 'fashion', 'lifestyle', 'home_living'],
  },
  {
    title: 'Consumer/regional diversity: "many markets within one"',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'India is frequently characterized in market-entry literature as "many markets within one" — consumer behavior differs meaningfully by geography, language, income level, and culture. Localization (tone, packaging, regional pricing/marketing) is described as a prerequisite, not optional, for brand relevance.',
    tags: ['consumer', 'general', 'fashion', 'lifestyle', 'kids', 'beauty_personal_care', 'home_living', 'specialty'],
  },
  {
    title: 'Competitor landscape gap: no single integrated platform',
    url: `${RESEARCH_BASE}/global-retail-market-entry-platforms.md`,
    excerpt:
      'No single platform surveyed integrates market intelligence, India-specific compliance workflow, and retail/distributor partner discovery. Existing demand-forecasting and site-selection tools (Placer.ai, Esri, Blue Yonder, RELEX) generally assume an existing operating history, leaving the "cold start" problem for new-market entrants structurally unaddressed by incumbent tooling.',
    tags: ['competitors', 'demand', 'general'],
  },
  {
    title: 'Pricing/consumer-intelligence tools miss unorganized trade',
    url: `${RESEARCH_BASE}/global-retail-market-entry-platforms.md`,
    excerpt:
      'Pricing-intelligence platforms reviewed (Profitero, DataWeave, Numerator/Wiser, Competera) are built around organized e-commerce/web-scraping data models, with no evidenced coverage of India\'s large unorganized/general-trade retail footprint (kirana stores, independent pharmacies).',
    tags: ['pricing', 'competitors', 'general'],
  },
  {
    title: 'Cosmetics contract manufacturing market',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'Contract/third-party manufacturing is a well-established route for consumer brands entering India without owned factories, spanning cosmetics/personal care, food & beverage, and apparel/textiles. The Indian cosmetics contract-manufacturing market alone was reported to have crossed INR 12,000 crore in 2023, driven by D2C and private-label growth.',
    tags: ['beauty_personal_care', 'manufacturing', 'general'],
  },
  {
    title: 'Franchising has no dedicated Indian statute',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'India has no dedicated franchise law; franchising operates under a patchwork of the Indian Contract Act, Consumer Protection Act, FEMA/FDI regulations, and IP law, with no mandatory disclosure regime (unlike the US FTC Franchise Rule) — making contract quality unusually consequential.',
    tags: ['general', 'lifestyle', 'specialty'],
  },
  {
    title: 'Mall lease economics: Minimum Guarantee + revenue share',
    url: `${RESEARCH_BASE}/india-market-entry-regulatory-landscape.md`,
    excerpt:
      'Retail leases in Indian malls commonly combine a fixed Minimum Guarantee (MG) rent with a percentage/revenue-share component above a turnover threshold, with Common Area Maintenance (CAM) charges typically adding roughly 15-25% on top of monthly rent.',
    tags: ['pricing', 'general', 'fashion', 'lifestyle', 'home_living'],
  },
]
