import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkTicketEmailReplies } from "@/lib/email/ticket-email-receiver"
import { db } from "@/lib/db"

/**
 * Manual email check for a specific ticket
 * POST /api/email/check-ticket
 * Body: { ticketId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await request.json()

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 })
    }

    console.log(`📧 Manual email check for ticket: ${ticketId}`)

    // Get ticket info
    const ticket = await db.conversation.findFirst({
      where: {
        id: ticketId,
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        customerEmail: true,
        subject: true,
        status: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (!ticket.customerEmail) {
      return NextResponse.json({ 
        error: "No customer email on ticket",
        ticket: {
          id: ticket.id,
          customerEmail: null,
          subject: ticket.subject
        }
      }, { status: 400 })
    }

    console.log(`✅ Ticket found:`)
    console.log(`   - Customer: ${ticket.customerEmail}`)
    console.log(`   - Subject: ${ticket.subject}`)
    console.log(`   - Status: ${ticket.status}`)

    // Get email integration
    const integration = await db.channelIntegration.findFirst({
      where: {
        organizationId: session.user.organizationId,
        channel: "EMAIL",
        isEnabled: true,
      },
    })

    if (!integration || !integration.credentials) {
      return NextResponse.json({ 
        error: "Email integration not configured" 
      }, { status: 400 })
    }

    const creds = JSON.parse(integration.credentials)

    const config = {
      username: creds.username || creds.user,
      password: creds.password,
      imapHost: creds.imapHost || "imap.gmail.com",
      imapPort: creds.imapPort || 993,
      imapSecure: creds.imapSecure !== false,
    }

    console.log(`📧 Checking emails for: ${ticket.customerEmail}`)

    // Check emails for this organization
    const count = await checkTicketEmailReplies(
      session.user.organizationId,
      config
    )

    return NextResponse.json({
      success: true,
      ticketId,
      customerEmail: ticket.customerEmail,
      subject: ticket.subject,
      emailsProcessed: count,
      message: count > 0 
        ? `Processed ${count} email reply(s)` 
        : "No new emails found",
    })

  } catch (error: any) {
    console.error("❌ Manual email check failed:", error)
    return NextResponse.json(
      { 
        error: "Failed to check emails",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
