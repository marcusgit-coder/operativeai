import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteNotification } from "@/lib/notifications/notification-service"

// DELETE - Delete (archive) a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id

    await deleteNotification(notificationId, session.user.id)

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    })
  } catch (error: any) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    )
  }
}
