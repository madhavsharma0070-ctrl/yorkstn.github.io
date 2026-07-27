import type { EntityTypeRec } from '@/lib/validation/enums'

export interface ChecklistTemplateItem {
  title: string
  contentSourceUrl: string
  /** Days from creation to suggest as a default due date; null = no default. */
  suggestedDueInDays: number | null
}

/**
 * Per-entity-type task checklists (US-20). Content sourced from
 * research/india-market-entry-regulatory-landscape.md §2. Each item's
 * `contentSourceUrl` is what powers the "last verified" / staleness
 * convention (AC US-27) — content-staleness.ts reads
 * CHECKLIST_CONTENT_LAST_VERIFIED_AT alongside these.
 */
export const CHECKLIST_CONTENT_LAST_VERIFIED_AT = new Date('2026-07-23T00:00:00Z')
const SOURCE = 'https://github.com/madhavsharma0070-ctrl/yorkstn.github.io/blob/main/research/india-market-entry-regulatory-landscape.md'

export const ENTITY_FORMATION_CHECKLISTS: Record<EntityTypeRec, ChecklistTemplateItem[]> = {
  wos: [
    { title: 'File SPICe+ Part A (name reservation)', contentSourceUrl: SOURCE, suggestedDueInDays: 7 },
    { title: 'File SPICe+ Part B (incorporation) with eMoA/eAoA', contentSourceUrl: SOURCE, suggestedDueInDays: 21 },
    { title: 'Apply for PAN and TAN', contentSourceUrl: SOURCE, suggestedDueInDays: 21 },
    { title: 'Open an Indian bank account for the new entity', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'File FC-GPR (report the foreign investment to RBI)', contentSourceUrl: SOURCE, suggestedDueInDays: 60 },
    { title: 'Register for GST in the entity’s home state', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
  ],
  jv: [
    { title: 'File SPICe+ Part A (name reservation)', contentSourceUrl: SOURCE, suggestedDueInDays: 7 },
    { title: 'Negotiate and execute the Joint Venture Agreement', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'File SPICe+ Part B (incorporation) with eMoA/eAoA', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
    { title: 'Apply for PAN and TAN', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
    { title: 'File FC-GPR (report the foreign investment to RBI)', contentSourceUrl: SOURCE, suggestedDueInDays: 75 },
    { title: 'Register for GST in the entity’s home state', contentSourceUrl: SOURCE, suggestedDueInDays: 60 },
  ],
  llp: [
    { title: 'Reserve LLP name (RUN-LLP)', contentSourceUrl: SOURCE, suggestedDueInDays: 7 },
    { title: 'File incorporation (FiLLiP) with a resident designated partner', contentSourceUrl: SOURCE, suggestedDueInDays: 21 },
    { title: 'File the LLP Agreement', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'Apply for PAN and TAN', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'Register for GST in the entity’s home state', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
  ],
  branch: [
    { title: 'Obtain RBI/AD-Category-I-bank approval (FEMA)', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
    { title: 'File eForm FC-1 with the Registrar of Companies within 30 days of establishing a place of business', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'Apply for PAN and TAN', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
  ],
  liaison: [
    { title: 'Obtain RBI/AD-Category-I-bank approval (FEMA)', contentSourceUrl: SOURCE, suggestedDueInDays: 45 },
    { title: 'File eForm FC-1 with the Registrar of Companies within 30 days of establishing a place of business', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'Set up inward-remittance funding arrangement from the foreign parent (no local commercial activity permitted)', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
  ],
  project_office: [
    { title: 'Confirm the secured contract meets RBI’s Project Office eligibility conditions', contentSourceUrl: SOURCE, suggestedDueInDays: 14 },
    { title: 'Obtain RBI/AD-Category-I-bank approval (FEMA)', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
    { title: 'File eForm FC-1 with the Registrar of Companies within 30 days of establishing a place of business', contentSourceUrl: SOURCE, suggestedDueInDays: 30 },
  ],
}
