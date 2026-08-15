import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling, ApiError } from '@/lib/http/errors'
import { loadOwnedWorkflowItem } from '@/lib/modules/compliance/workflow-items.service'
import { uploadNewDocument, listDocumentsFor, UnsupportedFileError } from '@/lib/modules/compliance/documents/versioning.service'
import { writeAuditLog } from '@/lib/audit'
import { documentTypeSchema } from '@/lib/validation/enums'

// POST /api/v1/compliance/workflow-items/:id/documents — US-25.
export const POST = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'compliance:edit')

    const item = await loadOwnedWorkflowItem(ctx.organizationId, params.id)

    const formData = await req.formData()
    const file = formData.get('file')
    const documentType = documentTypeSchema.parse(formData.get('documentType') ?? 'other')
    const title = String(formData.get('title') ?? (file instanceof File ? file.name : 'Untitled document'))

    if (!(file instanceof File)) {
      throw new ApiError('VALIDATION_ERROR', 422, 'A file is required.')
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let document
    try {
      document = await uploadNewDocument({
        organizationId: ctx.organizationId,
        attachedToType: 'compliance_workflow_item',
        attachedToId: item.id,
        documentType,
        title,
        createdByUserId: ctx.userId,
        file: { buffer, fileName: file.name, mimeType: file.type || 'application/octet-stream' },
      })
    } catch (err) {
      if (err instanceof UnsupportedFileError) {
        throw new ApiError('VALIDATION_ERROR', 422, err.message)
      }
      throw err
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'document.uploaded',
      entityType: 'document',
      entityId: document.id,
      after: { title: document.title, attachedToId: item.id },
    })

    return NextResponse.json({ data: document }, { status: 201 })
  },
)

// GET /api/v1/compliance/workflow-items/:id/documents
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'compliance:view')

    const item = await loadOwnedWorkflowItem(ctx.organizationId, params.id)
    const documents = await listDocumentsFor('compliance_workflow_item', item.id)

    return NextResponse.json({ data: documents })
  },
)
