import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, formatEmailHtml } from "@/lib/channels/email-service"

export const runtime = 'nodejs'

// POST - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
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

    // Create message with PENDING status initially
    const message = await db.message.create({
      data: {
        conversationId: params.id,
        content,
        sender: session.user.name || session.user.email || "Support Agent",
        senderEmail: session.user.email,
        direction: "OUTBOUND",
        channel: ticket.channel,
        status: "PENDING",
        isAiGenerated: false,
      },
    })

    // Update conversation metadata
    await db.conversation.update({
      where: { id: params.id },
      data: { 
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        unreadCount: 0, // Admin replied, reset unread
      },
    })

    // Send email if channel is EMAIL
    if (ticket.channel === "EMAIL" && ticket.customerEmail) {
      try {
        // Format email content
        const htmlBody = formatEmailHtml(content)
        
        // Get previous messages for threading
        const previousMessages = await db.message.findMany({
          where: {
            conversationId: ticket.id,
            externalId: { not: null },
          },
          orderBy: { sentAt: "desc" },
          take: 1,
        })

        const inReplyTo = previousMessages[0]?.externalId || undefined
        const references = inReplyTo ? [inReplyTo] : undefined

        // Send email
        const externalId = await sendEmail(session.user.organizationId, {
          to: ticket.customerEmail,
          subject: `Re: ${ticket.subject || "Support Request"}`,
          htmlBody,
          inReplyTo,
          references,
        })

        // Update message with external ID and status
        await db.message.update({
          where: { id: message.id },
          data: {
            status: "SENT",
            externalId,
            deliveredAt: new Date(),
          },
        })

        return NextResponse.json({ 
          success: true, 
          message: {
            ...message,
            status: "SENT",
            externalId,
          }
        }, { status: 201 })

      } catch (emailError) {
        console.error("Failed to send email:", emailError)
        
        // Update message status to failed
        await db.message.update({
          where: { id: message.id },
          data: {
            status: "FAILED",
            failedReason: emailError instanceof Error ? emailError.message : "Unknown error",
          },
        })

        return NextResponse.json({ 
          success: false,
          message: "Message saved but email delivery failed",
          error: emailError instanceof Error ? emailError.message : "Unknown error"
        }, { status: 500 })
      }
    }

    // For non-email channels or if no customer email
    await db.message.update({
      where: { id: message.id },
      data: { status: "SENT" },
    })

    return NextResponse.json({ success: true, message }, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    )
  }
}
