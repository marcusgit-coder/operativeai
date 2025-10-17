import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { markAsRead, markAllAsRead } from "@/lib/notifications/notification-service"

// POST - Mark notification(s) as read
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, all } = body

    // Mark all as read
    if (all === true) {
      const result = await markAllAsRead(session.user.id)
      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      })
    }

    // Mark specific notifications as read
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      notificationIds.map((id) => markAsRead(id, session.user.id))
    )

    return NextResponse.json({
      success: true,
      message: `Marked ${results.length} notification(s) as read`,
      count: results.length,
    })
  } catch (error: any) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}
