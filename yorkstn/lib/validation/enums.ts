import { z } from 'zod'

// Application-layer enforcement of every closed value-set DATABASE_SCHEMA.md
// models as a native Postgres ENUM. See DECISIONS.md D-18 for why these are
// Zod schemas over `String` Prisma columns rather than native Prisma enums.
// Every API route that writes one of these fields MUST parse the incoming
// value through the corresponding schema before it reaches Prisma.

export const userTypeSchema = z.enum(['org_user', 'yorkstn_staff', 'partner'])
export type UserType = z.infer<typeof userTypeSchema>

export const membershipRoleSchema = z.enum([
  'owner',
  'admin',
  'compliance_manager',
  'analyst_editor',
  'viewer',
])
export type MembershipRole = z.infer<typeof membershipRoleSchema>

export const membershipStatusSchema = z.enum(['active', 'suspended'])

export const invitationStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked'])

export const subscriptionTierSchema = z.enum(['starter', 'growth', 'scale'])

export const billingStatusSchema = z.enum(['trialing', 'active', 'past_due', 'canceled'])

export const priceTierSchema = z.enum(['mass', 'mid', 'premium', 'luxury'])

export const brandCategorySchema = z.enum([
  'fashion',
  'lifestyle',
  'kids',
  'beauty_personal_care',
  'home_living',
  'specialty',
])
export type BrandCategory = z.infer<typeof brandCategorySchema>

export const operatingModelSchema = z.enum(['retail', 'wholesale', 'ecommerce', 'manufacturing'])
export type OperatingModel = z.infer<typeof operatingModelSchema>

export const aiInsightCategorySchema = z.enum([
  'market_analysis',
  'consumer_insights',
  'competitor_intelligence',
  'pricing_intelligence',
  'demand_forecast',
  'city_recommendation',
])
export type AiInsightCategory = z.infer<typeof aiInsightCategorySchema>

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low', 'insufficient_data'])
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>

export const workflowTypeSchema = z.enum([
  'entity_formation',
  'import_compliance',
  'gst',
  'bis',
  'trademark_ip',
])
export type WorkflowType = z.infer<typeof workflowTypeSchema>

export const workflowItemStatusSchema = z.enum([
  'pending',
  'in_progress',
  'blocked',
  'completed',
  'not_applicable',
])
export type WorkflowItemStatus = z.infer<typeof workflowItemStatusSchema>

export const entityTypeRecSchema = z.enum([
  'wos',
  'jv',
  'llp',
  'branch',
  'liaison',
  'project_office',
])
export type EntityTypeRec = z.infer<typeof entityTypeRecSchema>

export const documentTypeSchema = z.enum([
  'certificate',
  'filing',
  'poa',
  'correspondence',
  'verification_document',
  'other',
])

export const attachedToTypeSchema = z.enum(['compliance_workflow_item', 'partner_verification'])

export const partnerCategorySchema = z.enum([
  'manufacturer',
  'franchise',
  'retail_distributor',
  'mall_operator',
  'cre',
  'logistics',
  'warehousing',
  'marketing_agency',
  'legal',
])
export type PartnerCategory = z.infer<typeof partnerCategorySchema>

export const partnerVerifStatusSchema = z.enum(['unverified', 'pending', 'verified'])
export type PartnerVerifStatus = z.infer<typeof partnerVerifStatusSchema>

export const verifReviewStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const introductionStatusSchema = z.enum(['sent', 'partner_viewed', 'accepted', 'declined'])

export const siteStatusSchema = z.enum(['candidate', 'shortlisted', 'rejected', 'selected'])

export const milestonePhaseSchema = z.enum([
  'entity_formation',
  'compliance',
  'partner_selection',
  'site_selection',
  'launch',
])

export const milestoneStatusSchema = z.enum(['not_started', 'in_progress', 'completed', 'blocked'])

export const lineItemSourceTypeSchema = z.enum(['user_input', 'platform_benchmark'])

export const launchTaskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'blocked'])

export const engagementStatusSchema = z.enum([
  'requested',
  'scoping',
  'in_progress',
  'delivered',
  'cancelled',
])

export const notificationTypeSchema = z.enum([
  'compliance_deadline',
  'partner_recommendation',
  'managed_service_update',
  'introduction_status_change',
  'staleness_alert',
  'invitation',
  'system',
])

export const cityTierSchema = z.enum(['tier1', 'tier2', 'tier3'])
