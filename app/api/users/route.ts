import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/users
 * Fetch organization users with optional workload statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || session.user.organizationId
    const includeStats = searchParams.get('includeStats') === 'true'
    const role = searchParams.get('role') // Optional: filter by role

    // Verify user has access to this organization
    if (organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      organizationId,
    }

    if (role) {
      where.role = role
    }

    // Fetch users
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        // Include related data if stats are requested
        ...(includeStats && {
          conversations: {
            where: {
              status: {
                in: ['ACTIVE', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
              },
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
              lastMessageAt: true,
            },
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate statistics if requested
    const usersWithStats = includeStats
      ? await Promise.all(
          users.map(async user => {
            const activeTickets = user.conversations?.length || 0

            // Calculate average response time (simplified - in production, track actual response times)
            let avgResponseTime = 0
            if (user.conversations && user.conversations.length > 0) {
              const responseTimes = user.conversations.map(conv => {
                const created = new Date(conv.createdAt).getTime()
                const lastMessage = new Date(conv.lastMessageAt).getTime()
                return Math.max(0, lastMessage - created)
              })
              avgResponseTime =
                responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000 // Convert to seconds
            }

            // Determine if user is "online" (has activity in last 5 minutes)
            // In production, you'd track this with a separate activity table or WebSocket
            const isOnline = Math.random() > 0.5 // Placeholder

            // Extract team from email domain or set manually
            // In production, you'd have a proper team/department field
            const team = extractTeam(user.email)

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.image,
              activeTickets,
              avgResponseTime: Math.round(avgResponseTime),
              isOnline,
              team,
              createdAt: user.createdAt,
            }
          })
        )
      : users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.image,
          createdAt: user.createdAt,
        }))

    return NextResponse.json({
      users: usersWithStats,
      total: usersWithStats.length,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to extract team from email or other logic
 * In production, you'd have a proper team/department field
 */
function extractTeam(email: string): string {
  // Simple logic: extract department from email if present
  // e.g., support@company.com -> Support
  // e.g., sales@company.com -> Sales
  const match = email.match(/^([^@]+)@/)
  if (match) {
    const localPart = match[1]
    if (localPart.includes('support')) return 'Support'
    if (localPart.includes('sales')) return 'Sales'
    if (localPart.includes('billing')) return 'Billing'
    if (localPart.includes('tech')) return 'Technical'
  }
  return 'General'
}

/**
 * GET /api/users/stats
 * Get aggregated statistics for all users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId = session.user.organizationId } = body

    // Verify access
    if (organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get ticket distribution across users
    const ticketDistribution = await db.conversation.groupBy({
      by: ['assignedToUserId'],
      where: {
        organizationId,
        status: {
          in: ['ACTIVE', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
        },
      },
      _count: {
        id: true,
      },
    })

    // Get total tickets by status
    const statusDistribution = await db.conversation.groupBy({
      by: ['status'],
      where: {
        organizationId,
      },
      _count: {
        id: true,
      },
    })

    // Get unassigned tickets count
    const unassignedCount = await db.conversation.count({
      where: {
        organizationId,
        assignedToUserId: null,
        status: {
          in: ['ACTIVE', 'IN_PROGRESS', 'WAITING_CUSTOMER'],
        },
      },
    })

    // Calculate workload balance (standard deviation)
    const ticketCounts = ticketDistribution.map(d => d._count.id)
    const avgTickets =
      ticketCounts.length > 0
        ? ticketCounts.reduce((a, b) => a + b, 0) / ticketCounts.length
        : 0
    const variance =
      ticketCounts.length > 0
        ? ticketCounts.reduce((sum, count) => sum + Math.pow(count - avgTickets, 2), 0) /
          ticketCounts.length
        : 0
    const workloadBalance = Math.sqrt(variance)

    return NextResponse.json({
      ticketDistribution: ticketDistribution.map(d => ({
        userId: d.assignedToUserId,
        count: d._count.id,
      })),
      statusDistribution: statusDistribution.map(d => ({
        status: d.status,
        count: d._count.id,
      })),
      unassignedCount,
      avgTicketsPerUser: Math.round(avgTickets * 10) / 10,
      workloadBalance: Math.round(workloadBalance * 10) / 10,
      totalActiveTickets: ticketCounts.reduce((a, b) => a + b, 0),
    })
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}
