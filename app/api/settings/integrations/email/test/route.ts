import { NextRequest, NextResponse } from "next/server"
import { testEmailConnection } from "@/lib/channels/email-service"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const config = body

    if (!config.smtpHost || !config.username || !config.password) {
      return NextResponse.json(
        { error: "Missing required configuration fields" },
        { status: 400 }
      )
    }

    // Test connection
    const isValid = await testEmailConnection(config)

    if (isValid) {
      return NextResponse.json({ success: true, message: "Connection successful" })
    } else {
      return NextResponse.json(
        { error: "Connection failed. Please check your credentials." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Test email connection error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection test failed" },
      { status: 500 }
    )
  }
}
