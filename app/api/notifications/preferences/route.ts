import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/notifications/notification-service"

// GET - Get user's notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await getUserPreferences(session.user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// PATCH - Update user's notification preferences
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate boolean fields
    const validFields = [
      "emailEnabled",
      "pushEnabled",
      "inAppEnabled",
      "newTicket",
      "ticketReply",
      "ticketStatus",
      "invoiceUpdates",
      "systemAlerts",
    ]

    const updates: any = {}

    validFields.forEach((field) => {
      if (field in body && typeof body[field] === "boolean") {
        updates[field] = body[field]
      }
    })

    // Validate quiet hours
    if ("quietHoursStart" in body) {
      const start = body.quietHoursStart
      if (start === null || (typeof start === "number" && start >= 0 && start < 24)) {
        updates.quietHoursStart = start
      }
    }

    if ("quietHoursEnd" in body) {
      const end = body.quietHoursEnd
      if (end === null || (typeof end === "number" && end >= 0 && end < 24)) {
        updates.quietHoursEnd = end
      }
    }

    const preferences = await updateUserPreferences(session.user.id, updates)

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
