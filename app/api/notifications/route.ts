import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserNotifications } from "@/lib/notifications/notification-service"
import type { NotificationType } from "@/lib/notifications/notification-service"

// GET - Fetch user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const typesParam = searchParams.get("types")
    const includeArchived = searchParams.get("includeArchived") === "true"

    // Parse types if provided
    let types: NotificationType[] | undefined
    if (typesParam) {
      types = typesParam.split(",") as NotificationType[]
    }

    // Fetch notifications
    const notifications = await getUserNotifications(session.user.id, {
      unreadOnly,
      limit,
      offset,
      types,
      includeArchived,
    })

    return NextResponse.json({
      notifications,
      total: notifications.length,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
