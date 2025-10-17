import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyNewTicket } from "@/lib/notifications/triggers"

// GET - List all tickets for organization with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const filters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.getAll("status"),
      priority: searchParams.getAll("priority"),
      tags: searchParams.getAll("tags"),
      categories: searchParams.getAll("categories"),
      assignedTo: searchParams.getAll("assignedTo"),
      unassigned: searchParams.get("unassigned") === "true",
      myTickets: searchParams.get("myTickets") === "true",
      customerEmail: searchParams.get("customerEmail") || undefined,
      source: searchParams.getAll("source"),
      isArchived: searchParams.get("isArchived") === "true",
      overdue: searchParams.get("overdue") === "true",
      hasUnread: searchParams.get("hasUnread") === "true",
      dateType: searchParams.get("dateType") as "created" | "updated" | "resolved" | "due" | null,
      dateFrom: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
      dateTo: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
    }

    // Build Prisma where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    // Search filter (searches in subject, customerName, customerEmail)
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
        { customerEmail: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    // Status filter
    if (filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    // Priority filter
    if (filters.priority.length > 0) {
      where.priority = { in: filters.priority }
    }

    // Tags filter (check if any of the filter tags exist in the comma-separated tags field)
    if (filters.tags.length > 0) {
      where.OR = where.OR || []
      filters.tags.forEach((tag) => {
        where.OR.push({
          tags: { contains: tag }
        })
      })
    }

    // Category filter
    if (filters.categories.length > 0) {
      where.category = { in: filters.categories }
    }

    // Assignment filters
    if (filters.myTickets) {
      where.assignedToUserId = session.user.id
    } else if (filters.unassigned) {
      where.assignedToUserId = null
    } else if (filters.assignedTo.length > 0) {
      where.assignedToUserId = { in: filters.assignedTo }
    }

    // Customer email filter
    if (filters.customerEmail) {
      where.customerEmail = { contains: filters.customerEmail, mode: "insensitive" }
    }

    // Source filter
    if (filters.source.length > 0) {
      where.source = { in: filters.source }
    }

    // Archived filter
    where.isArchived = filters.isArchived

    // Has unread filter
    if (filters.hasUnread) {
      where.unreadCount = { gt: 0 }
    }

    // Date range filters
    if (filters.dateFrom && filters.dateTo && filters.dateType) {
      const dateField = 
        filters.dateType === "created" ? "createdAt" :
        filters.dateType === "updated" ? "updatedAt" :
        filters.dateType === "resolved" ? "resolvedAt" :
        "dueDate"
      
      where[dateField] = {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      }
    }

    // Overdue filter (due date passed and not resolved/closed)
    if (filters.overdue) {
      where.dueDate = { lt: new Date() }
      where.status = { notIn: ["RESOLVED", "CLOSED"] }
    }

    // Fetch filtered conversations
    const conversations = await db.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { priority: "desc" }, // Urgent/Critical first
        { updatedAt: "desc" }, // Then by most recent
      ],
    })

    // Calculate stats for quick filters
    const allTickets = await db.conversation.findMany({
      where: {
        organizationId: session.user.organizationId,
        isArchived: false,
      },
      select: {
        id: true,
        priority: true,
        dueDate: true,
        status: true,
        assignedToUserId: true,
      },
    })

    const stats = {
      total: conversations.length,
      urgent: allTickets.filter(t => 
        t.priority === "URGENT" || t.priority === "CRITICAL"
      ).length,
      overdue: allTickets.filter(t => 
        t.dueDate && t.dueDate < new Date() && 
        !["RESOLVED", "CLOSED"].includes(t.status)
      ).length,
      unassigned: allTickets.filter(t => !t.assignedToUserId).length,
      myTickets: allTickets.filter(t => t.assignedToUserId === session.user.id).length,
    }

    return NextResponse.json({ 
      conversations,
      stats,
      filters: filters, // Return active filters for debugging
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
