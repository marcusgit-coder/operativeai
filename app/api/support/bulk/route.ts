import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Bulk Actions API
 * Perform bulk operations on filtered tickets
 */

interface BulkActionRequest {
  action: 'status' | 'priority' | 'assign' | 'tag' | 'archive' | 'delete'
  ticketIds?: string[] // Specific ticket IDs
  filters?: any // Filter criteria to select tickets
  value: any // Action-specific value
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkActionRequest = await request.json()
    const { action, ticketIds, filters, value } = body

    // Validate request
    if (!action || (!ticketIds && !filters)) {
      return NextResponse.json(
        { error: 'Missing required fields: action and either ticketIds or filters' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (ticketIds && ticketIds.length > 0) {
      where.id = { in: ticketIds }
    } else if (filters) {
      // Apply filters to select tickets
      Object.assign(where, filters)
    }

    // Create bulk action log
    const bulkLog = await db.bulkActionLog.create({
      data: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        action,
        affectedCount: 0, // Will update after operation
        criteria: JSON.stringify(filters || { ticketIds }),
        status: 'pending',
      },
    })

    let updateData: any = {}
    let affectedCount = 0

    try {
      // Perform bulk action based on type
      switch (action) {
        case 'status':
          if (!value || !['ACTIVE', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'].includes(value)) {
            throw new Error('Invalid status value')
          }
          const statusResult = await db.conversation.updateMany({
            where,
            data: {
              status: value,
              updatedAt: new Date(),
              ...(value === 'RESOLVED' && { resolvedAt: new Date() }),
            },
          })
          affectedCount = statusResult.count
          break

        case 'priority':
          if (!value || !['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(value)) {
            throw new Error('Invalid priority value')
          }
          const priorityResult = await db.conversation.updateMany({
            where,
            data: {
              priority: value,
              updatedAt: new Date(),
            },
          })
          affectedCount = priorityResult.count
          break

        case 'assign':
          // Value can be userId or null for unassign
          const assignResult = await db.conversation.updateMany({
            where,
            data: {
              assignedToUserId: value || null,
              updatedAt: new Date(),
            },
          })
          affectedCount = assignResult.count
          break

        case 'tag':
          // Value should be { add: string[], remove: string[] }
          if (!value || (!value.add && !value.remove)) {
            throw new Error('Invalid tag value')
          }

          // For SQLite, we need to handle tags one by one
          const conversations = await db.conversation.findMany({
            where,
            select: { id: true, tags: true },
          })

          for (const conv of conversations) {
            let currentTags = conv.tags ? conv.tags.split(',').filter(Boolean) : []

            if (value.remove && value.remove.length > 0) {
              currentTags = currentTags.filter((tag: string) => !value.remove.includes(tag))
            }

            if (value.add && value.add.length > 0) {
              value.add.forEach((tag: string) => {
                if (!currentTags.includes(tag)) {
                  currentTags.push(tag)
                }
              })
            }

            await db.conversation.update({
              where: { id: conv.id },
              data: {
                tags: currentTags.join(','),
                updatedAt: new Date(),
              },
            })
          }

          affectedCount = conversations.length
          break

        case 'archive':
          const archiveResult = await db.conversation.updateMany({
            where,
            data: {
              isArchived: value === true,
              updatedAt: new Date(),
            },
          })
          affectedCount = archiveResult.count
          break

        case 'delete':
          // Soft delete by archiving
          const deleteResult = await db.conversation.updateMany({
            where,
            data: {
              isArchived: true,
              updatedAt: new Date(),
            },
          })
          affectedCount = deleteResult.count
          break

        default:
          throw new Error(`Unknown action: ${action}`)
      }

      // Update bulk log with success
      await db.bulkActionLog.update({
        where: { id: bulkLog.id },
        data: {
          affectedCount,
          status: 'completed',
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        affectedCount,
        logId: bulkLog.id,
        message: `Successfully ${action === 'status' ? 'updated status of' : action === 'priority' ? 'updated priority of' : action === 'assign' ? 'assigned' : action === 'tag' ? 'tagged' : action === 'archive' ? 'archived' : 'deleted'} ${affectedCount} ticket${affectedCount !== 1 ? 's' : ''}`,
      })
    } catch (error: any) {
      // Update bulk log with error
      await db.bulkActionLog.update({
        where: { id: bulkLog.id },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

// GET - Retrieve bulk action history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // pending, completed, failed

    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) {
      where.status = status
    }

    const logs = await db.bulkActionLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Get bulk logs error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve bulk action logs' },
      { status: 500 }
    )
  }
}
