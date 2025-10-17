import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { saveEmailConfig } from "@/lib/channels/email-service"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({ error: "Configuration is required" }, { status: 400 })
    }

    // Save email configuration
    await saveEmailConfig(session.user.organizationId, config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save email config error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save configuration" },
      { status: 500 }
    )
  }
}
