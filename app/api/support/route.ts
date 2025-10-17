import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyNewTicket } from "@/lib/notifications/triggers"

// GET - List all tickets for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await db.conversation.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}

// POST - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerName, customerEmail, subject, message, channel } = body

    // Validate required fields
    if (!customerEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create conversation
    const conversation = await db.conversation.create({
      data: {
        organizationId: session.user.organizationId,
        channel: channel || "EMAIL",
        customerEmail,
        customerName,
        subject,
        status: "ACTIVE",
        assignedToHuman: false,
        messages: {
          create: {
            content: message,
            sender: customerEmail,
            isAiGenerated: false,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    // Send notification to admins
    await notifyNewTicket({
      id: conversation.id,
      organizationId: conversation.organizationId,
      customerName: conversation.customerName,
      customerEmail: conversation.customerEmail,
      subject: conversation.subject,
      priority: "NORMAL", // Default priority
      channel: conversation.channel,
    })

    return NextResponse.json(
      {
        success: true,
        conversationId: conversation.id,
        conversation,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    )
  }
}
