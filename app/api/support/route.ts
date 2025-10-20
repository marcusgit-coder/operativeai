import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyNewTicket } from "@/lib/notifications/triggers"
import { filterTickets, getFilterStats } from "@/lib/filters/ticket-filter-service"
import { TicketFilters, DEFAULT_PAGINATION } from "@/types/filters"

// GET - List all tickets for organization with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const filtersParam = searchParams.get('filters')
    let filters: TicketFilters = {}
    
    if (filtersParam) {
      try {
        filters = JSON.parse(decodeURIComponent(filtersParam))
      } catch (e) {
        console.error('Error parsing filters:', e)
      }
    }
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    
    // Get filter stats if requested
    const includeStats = searchParams.get('includeStats') === 'true'
    
    // Use filter service
    const result = await filterTickets(
      session.user.organizationId,
      filters,
      { page, limit }
    )
    
    // Get filter statistics for UI
    let stats = null
    if (includeStats) {
      stats = await getFilterStats(session.user.organizationId)
    }

    return NextResponse.json({
      conversations: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      },
      appliedFilters: result.appliedFilters,
      stats
    })
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
