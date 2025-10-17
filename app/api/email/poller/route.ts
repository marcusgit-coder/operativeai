import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  startEmailPoller,
  stopEmailPoller,
  getPollerStatus,
} from "@/lib/email/email-poller"

// GET - Get poller status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const status = getPollerStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error getting poller status:", error)
    return NextResponse.json(
      { error: "Failed to get poller status" },
      { status: 500 }
    )
  }
}

// POST - Start/stop poller
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "start") {
      const poller = startEmailPoller()
      return NextResponse.json({
        success: true,
        message: "Email poller started",
        status: poller.getStatus(),
      })
    } else if (action === "stop") {
      stopEmailPoller()
      return NextResponse.json({
        success: true,
        message: "Email poller stopped",
        status: getPollerStatus(),
      })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error controlling poller:", error)
    return NextResponse.json(
      { error: "Failed to control poller" },
      { status: 500 }
    )
  }
}
