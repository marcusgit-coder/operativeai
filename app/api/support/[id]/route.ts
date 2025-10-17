import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyTicketStatusChange } from "@/lib/notifications/triggers"

// PATCH - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Verify ticket belongs to organization
    const ticket = await db.conversation.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Store old status for notification
    const oldStatus = ticket.status

    // Update ticket
    const updatedTicket = await db.conversation.update({
      where: { id: params.id },
      data: {
        status: status.toUpperCase(),
        closedAt: status.toUpperCase() === "CLOSED" ? new Date() : null,
      },
    })

    // Trigger notification for status change
    await notifyTicketStatusChange(updatedTicket, oldStatus)

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    )
  }
}
