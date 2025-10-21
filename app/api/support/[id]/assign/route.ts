import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * PATCH /api/support/[id]/assign
 * Update ticket assignment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignedUserId } = await request.json()

    // Verify ticket exists and belongs to organization
    const ticket = await db.conversation.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // If assigning to a user, verify they belong to the organization
    if (assignedUserId) {
      const user = await db.user.findFirst({
        where: {
          id: assignedUserId,
          organizationId: session.user.organizationId,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found in organization' },
          { status: 404 }
        )
      }
    }

    // Update assignment
    const updatedTicket = await db.conversation.update({
      where: {
        id: params.id,
      },
      data: {
        assignedUserId: assignedUserId || null,
        assignedToHuman: !!assignedUserId,
        updatedAt: new Date(),
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        action: assignedUserId ? 'TICKET_ASSIGNED' : 'TICKET_UNASSIGNED',
        resourceType: 'TICKET',
        resourceId: params.id,
        metadata: JSON.stringify({
          assignedTo: assignedUserId,
          assignedBy: session.user.id,
          ticketSubject: ticket.subject,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: assignedUserId
        ? `Ticket assigned to ${updatedTicket.assignedUser?.name || updatedTicket.assignedUser?.email}`
        : 'Ticket unassigned',
    })
  } catch (error: any) {
    console.error('Assign ticket error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
