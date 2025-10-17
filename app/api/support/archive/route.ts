import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * DELETE /api/support/archive
 * Delete archived (CLOSED) tickets
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ticketId, deleteAll } = body

    if (deleteAll) {
      // Delete all closed tickets for this organization
      const result = await db.conversation.deleteMany({
        where: {
          organizationId: session.user.organizationId,
          status: "CLOSED",
        },
      })

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.count} archived ticket(s)`,
        count: result.count,
      })
    } else if (ticketId) {
      // Delete a specific ticket
      // First verify it belongs to the organization and is closed
      const ticket = await db.conversation.findFirst({
        where: {
          id: ticketId,
          organizationId: session.user.organizationId,
          status: "CLOSED",
        },
      })

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket not found or not archived" },
          { status: 404 }
        )
      }

      await db.conversation.delete({
        where: { id: ticketId },
      })

      return NextResponse.json({
        success: true,
        message: "Ticket deleted successfully",
      })
    } else {
      return NextResponse.json(
        { error: "Must provide either ticketId or deleteAll" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting archived tickets:", error)
    return NextResponse.json(
      { error: "Failed to delete archived tickets" },
      { status: 500 }
    )
  }
}
