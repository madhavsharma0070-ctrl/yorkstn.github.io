-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "homeCountry" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'starter',
    "billingStatus" TEXT NOT NULL DEFAULT 'trialing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "partnerId" TEXT,
    "emailVerifiedAt" DATETIME,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "users_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedByUserId" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invitations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_org_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_org_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "staff_org_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "priceTier" TEXT NOT NULL,
    "homeMarketPriceRange" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "brand_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsnCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cityId" TEXT,
    "inputParams" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "structuredOutput" JSONB NOT NULL,
    "assumptions" JSONB,
    "methodologyNote" TEXT,
    "generatedAt" DATETIME NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_insights_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_insights_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_insights_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_insight_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aiInsightId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "retrievedDate" DATETIME NOT NULL,
    CONSTRAINT "ai_insight_sources_aiInsightId_fkey" FOREIGN KEY ("aiInsightId") REFERENCES "ai_insights" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expansion_readiness_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "inputsSnapshot" JSONB NOT NULL,
    "ruleEngineVersion" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expansion_readiness_scores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "readiness_score_drivers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "readinessScoreId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "pointsEarned" REAL NOT NULL,
    "pointsPossible" REAL NOT NULL,
    CONSTRAINT "readiness_score_drivers_readinessScoreId_fkey" FOREIGN KEY ("readinessScoreId") REFERENCES "expansion_readiness_scores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compliance_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compliance_cases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compliance_workflow_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complianceCaseId" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" DATETIME,
    "payload" JSONB,
    "recommendedEntityType" TEXT,
    "entityRationale" TEXT,
    "ruleEngineVersion" TEXT,
    "contentSourceUrl" TEXT,
    "contentLastVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "compliance_workflow_items_complianceCaseId_fkey" FOREIGN KEY ("complianceCaseId") REFERENCES "compliance_cases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "attachedToType" TEXT NOT NULL,
    "attachedToId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentGroupId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "capacityAttributes" JSONB,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "contactChannel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "partner_cities" (
    "partnerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    PRIMARY KEY ("partnerId", "cityId"),
    CONSTRAINT "partner_cities_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partner_cities_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partner_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "referenceName" TEXT NOT NULL,
    "referenceContact" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_references_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partner_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    CONSTRAINT "partner_verifications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partner_verifications_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "introduction_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "introduction_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "introduction_requests_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "introduction_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "tier" TEXT,
    "population" INTEGER,
    "demographics" JSONB,
    "realEstateCostBenchmark" JSONB,
    "distributionMaturity" JSONB,
    "lastVerifiedAt" DATETIME,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "malls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantMix" JSONB,
    "leaseBenchmark" JSONB,
    "footfallProxyIndicator" TEXT,
    "lastVerifiedAt" DATETIME,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "malls_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "mallId" TEXT,
    "crePartnerId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "attributes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "computedScore" REAL,
    "scoreBreakdown" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sites_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sites_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sites_crePartnerId_fkey" FOREIGN KEY ("crePartnerId") REFERENCES "partners" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "site_scoring_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "site_scoring_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expansion_roadmaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expansion_roadmaps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roadmap_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expansionRoadmapId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "dependsOnMilestoneId" TEXT,
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "roadmap_milestones_expansionRoadmapId_fkey" FOREIGN KEY ("expansionRoadmapId") REFERENCES "expansion_roadmaps" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_projections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "cityId" TEXT,
    "horizonMonths" INTEGER NOT NULL,
    "userAssumptions" JSONB NOT NULL,
    "platformBenchmarks" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "financial_projections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_projection_line_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financialProjectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "sourceType" TEXT NOT NULL,
    CONSTRAINT "financial_projection_line_items_financialProjectionId_fkey" FOREIGN KEY ("financialProjectionId") REFERENCES "financial_projections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "launch_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "roadmapMilestoneId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "dueAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "launch_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "launch_tasks_roadmapMilestoneId_fkey" FOREIGN KEY ("roadmapMilestoneId") REFERENCES "roadmap_milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "managed_service_engagements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "linkedComplianceItemId" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "assignedStaffId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "managed_service_engagements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "managed_service_engagements_linkedComplianceItemId_fkey" FOREIGN KEY ("linkedComplianceItemId") REFERENCES "compliance_workflow_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_partnerId_key" ON "users"("partnerId");

-- CreateIndex
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_organizationId_email_idx" ON "invitations"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_org_assignments_userId_organizationId_key" ON "staff_org_assignments"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_organizationId_key" ON "brand_profiles"("organizationId");

-- CreateIndex
CREATE INDEX "products_organizationId_idx" ON "products"("organizationId");

-- CreateIndex
CREATE INDEX "products_hsnCode_idx" ON "products"("hsnCode");

-- CreateIndex
CREATE INDEX "ai_insights_organizationId_category_generatedAt_idx" ON "ai_insights"("organizationId", "category", "generatedAt");

-- CreateIndex
CREATE INDEX "ai_insight_sources_aiInsightId_idx" ON "ai_insight_sources"("aiInsightId");

-- CreateIndex
CREATE INDEX "expansion_readiness_scores_organizationId_calculatedAt_idx" ON "expansion_readiness_scores"("organizationId", "calculatedAt");

-- CreateIndex
CREATE INDEX "readiness_score_drivers_readinessScoreId_idx" ON "readiness_score_drivers"("readinessScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_cases_organizationId_key" ON "compliance_cases"("organizationId");

-- CreateIndex
CREATE INDEX "compliance_workflow_items_complianceCaseId_status_dueAt_idx" ON "compliance_workflow_items"("complianceCaseId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "documents_attachedToType_attachedToId_documentGroupId_idx" ON "documents"("attachedToType", "attachedToId", "documentGroupId");

-- CreateIndex
CREATE INDEX "document_versions_documentId_versionNumber_idx" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "partners_category_verificationStatus_idx" ON "partners"("category", "verificationStatus");

-- CreateIndex
CREATE INDEX "partner_cities_cityId_idx" ON "partner_cities"("cityId");

-- CreateIndex
CREATE INDEX "partner_references_partnerId_idx" ON "partner_references"("partnerId");

-- CreateIndex
CREATE INDEX "partner_verifications_partnerId_idx" ON "partner_verifications"("partnerId");

-- CreateIndex
CREATE INDEX "partner_verifications_status_idx" ON "partner_verifications"("status");

-- CreateIndex
CREATE INDEX "introduction_requests_organizationId_status_idx" ON "introduction_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "introduction_requests_partnerId_status_idx" ON "introduction_requests"("partnerId", "status");

-- CreateIndex
CREATE INDEX "cities_state_idx" ON "cities"("state");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_state_key" ON "cities"("name", "state");

-- CreateIndex
CREATE INDEX "malls_cityId_idx" ON "malls"("cityId");

-- CreateIndex
CREATE INDEX "sites_organizationId_status_idx" ON "sites"("organizationId", "status");

-- CreateIndex
CREATE INDEX "sites_cityId_idx" ON "sites"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "site_scoring_configs_organizationId_key" ON "site_scoring_configs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "expansion_roadmaps_organizationId_key" ON "expansion_roadmaps"("organizationId");

-- CreateIndex
CREATE INDEX "roadmap_milestones_expansionRoadmapId_idx" ON "roadmap_milestones"("expansionRoadmapId");

-- CreateIndex
CREATE INDEX "financial_projection_line_items_financialProjectionId_idx" ON "financial_projection_line_items"("financialProjectionId");

-- CreateIndex
CREATE INDEX "launch_tasks_organizationId_idx" ON "launch_tasks"("organizationId");

-- CreateIndex
CREATE INDEX "managed_service_engagements_organizationId_idx" ON "managed_service_engagements"("organizationId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");
