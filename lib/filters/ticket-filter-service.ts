/**
 * Ticket Filter Service
 * Core filtering logic using Prisma queries
 */

import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import {
  TicketFilters,
  FilterResult,
  PaginationParams,
  DEFAULT_PAGINATION
} from '@/types/filters'

/**
 * Build Prisma where clause from filters
 */
export function buildWhereClause(
  organizationId: string,
  filters: TicketFilters
): Prisma.ConversationWhereInput {
  const where: Prisma.ConversationWhereInput = {
    organizationId
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status }
  }

  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    where.priority = { in: filters.priority }
  }

  // Channel filter
  if (filters.channel && filters.channel.length > 0) {
    where.channel = { in: filters.channel }
  }

  // Assignment filter
  // TODO: Re-enable once Prisma types are regenerated
  // if (filters.assignedTo && filters.assignedTo.length > 0) {
  //   where.assignedUserId = { in: filters.assignedTo }
  // }

  // Unassigned filter
  // if (filters.unassigned === true) {
  //   where.assignedUserId = null
  // }

  // Search filter (full-text search across multiple fields)
  // Note: SQLite contains is case-sensitive by default
  if (filters.search) {
    const searchTerm = filters.search.trim()
    where.OR = [
      { subject: { contains: searchTerm } },
      { customerName: { contains: searchTerm } },
      { customerEmail: { contains: searchTerm } },
      { id: { contains: searchTerm } }
    ]
  }

  // Customer email filter
  if (filters.customerEmail) {
    where.customerEmail = {
      contains: filters.customerEmail
    }
  }

  // Customer name filter
  if (filters.customerName) {
    where.customerName = {
      contains: filters.customerName
    }
  }

  // Date range filters
  if (filters.dateRange?.from || filters.dateRange?.to) {
    where.createdAt = {}
    if (filters.dateRange.from) {
      where.createdAt.gte = new Date(filters.dateRange.from)
    }
    if (filters.dateRange.to) {
      where.createdAt.lte = new Date(filters.dateRange.to)
    }
  }

  // Created date filters
  if (filters.createdAfter || filters.createdBefore) {
    const dateFilter: any = {}
    if (!where.createdAt) where.createdAt = dateFilter
    if (filters.createdAfter) {
      dateFilter.gte = new Date(filters.createdAfter)
    }
    if (filters.createdBefore) {
      dateFilter.lte = new Date(filters.createdBefore)
    }
    where.createdAt = dateFilter
  }

  // Last message filters
  if (filters.lastMessageAfter || filters.lastMessageBefore) {
    where.lastMessageAt = {}
    if (filters.lastMessageAfter) {
      where.lastMessageAt.gte = new Date(filters.lastMessageAfter)
    }
    if (filters.lastMessageBefore) {
      where.lastMessageAt.lte = new Date(filters.lastMessageBefore)
    }
  }

  // Has unread messages
  if (filters.hasUnreadMessages === true) {
    where.unreadCount = { gt: 0 }
  }

  return where
}

/**
 * Build Prisma orderBy clause from filters
 */
export function buildOrderByClause(
  filters: TicketFilters
): Prisma.ConversationOrderByWithRelationInput {
  const sortBy = filters.sortBy || 'lastMessageAt'
  const sortOrder = filters.sortOrder || 'desc'

  return {
    [sortBy]: sortOrder
  }
}

/**
 * Filter tickets with pagination
 */
export async function filterTickets(
  organizationId: string,
  filters: TicketFilters,
  pagination: PaginationParams = DEFAULT_PAGINATION
): Promise<FilterResult> {
  const where = buildWhereClause(organizationId, filters)
  const orderBy = buildOrderByClause(filters)

  const skip = (pagination.page - 1) * pagination.limit
  const take = pagination.limit

  try {
    // Execute queries in parallel
    const [items, total] = await Promise.all([
      db.conversation.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          // assignedUser: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // },
          _count: {
            select: {
              messages: true
            }
          }
        }
      }),
      db.conversation.count({ where })
    ])

    const totalPages = Math.ceil(total / pagination.limit)

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      appliedFilters: filters
    }
  } catch (error) {
    console.error('Error filtering tickets:', error)
    throw new Error('Failed to filter tickets')
  }
}

/**
 * Get filter statistics (counts for each filter option)
 */
export async function getFilterStats(organizationId: string) {
  try {
    const [statusCounts, priorityCounts, channelCounts, unassignedCount] =
      await Promise.all([
        // Count by status
        db.conversation.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true
        }),
        // Count by priority
        db.conversation.groupBy({
          by: ['priority'],
          where: { organizationId },
          _count: true
        }),
        // Count by channel
        db.conversation.groupBy({
          by: ['channel'],
          where: { organizationId },
          _count: true
        }),
        // Count unassigned
        // TODO: Re-enable once Prisma types are regenerated
        db.conversation.count({
          where: {
            organizationId,
            // assignedUserId: null
          }
        })
      ])

    return {
      status: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count])
      ),
      priority: Object.fromEntries(
        priorityCounts.map((p) => [p.priority, p._count])
      ),
      channel: Object.fromEntries(
        channelCounts.map((c) => [c.channel, c._count])
      ),
      unassigned: unassignedCount
    }
  } catch (error) {
    console.error('Error getting filter stats:', error)
    throw new Error('Failed to get filter statistics')
  }
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: TicketFilters): number {
  let count = 0

  if (filters.search) count++
  if (filters.status && filters.status.length > 0) count++
  if (filters.priority && filters.priority.length > 0) count++
  if (filters.channel && filters.channel.length > 0) count++
  if (filters.assignedTo && filters.assignedTo.length > 0) count++
  if (filters.unassigned) count++
  if (filters.customerEmail) count++
  if (filters.customerName) count++
  if (filters.dateRange?.from || filters.dateRange?.to) count++
  if (filters.createdAfter) count++
  if (filters.createdBefore) count++
  if (filters.lastMessageAfter) count++
  if (filters.lastMessageBefore) count++
  if (filters.hasUnreadMessages) count++

  return count
}
