import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List all unique tags for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all tickets with tags
    const conversations = await db.conversation.findMany({
      where: {
        organizationId: session.user.organizationId,
        tags: { not: null },
      },
      select: {
        tags: true,
      },
    })

    // Extract and deduplicate tags
    const tagsSet = new Set<string>()
    conversations.forEach((conv) => {
      if (conv.tags) {
        conv.tags.split(',').forEach((tag) => {
          const trimmedTag = tag.trim()
          if (trimmedTag) {
            tagsSet.add(trimmedTag)
          }
        })
      }
    })

    const tags = Array.from(tagsSet).sort()

    return NextResponse.json({ tags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

// POST - Add tag to a ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId, tag } = await request.json()

    if (!ticketId || !tag) {
      return NextResponse.json(
        { error: "Ticket ID and tag are required" },
        { status: 400 }
      )
    }

    // Get current ticket
    const ticket = await db.conversation.findUnique({
      where: { id: ticketId },
      select: { tags: true, organizationId: true },
    })

    if (!ticket || ticket.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Parse existing tags
    const currentTags = ticket.tags
      ? ticket.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    // Add new tag if it doesn't exist
    if (!currentTags.includes(tag.trim())) {
      currentTags.push(tag.trim())
    }

    // Update ticket
    await db.conversation.update({
      where: { id: ticketId },
      data: {
        tags: currentTags.join(','),
      },
    })

    return NextResponse.json({ success: true, tags: currentTags })
  } catch (error) {
    console.error("Error adding tag:", error)
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    )
  }
}

// DELETE - Remove tag from a ticket
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")
    const tag = searchParams.get("tag")

    if (!ticketId || !tag) {
      return NextResponse.json(
        { error: "Ticket ID and tag are required" },
        { status: 400 }
      )
    }

    // Get current ticket
    const ticket = await db.conversation.findUnique({
      where: { id: ticketId },
      select: { tags: true, organizationId: true },
    })

    if (!ticket || ticket.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Parse existing tags and remove the specified one
    const currentTags = ticket.tags
      ? ticket.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const updatedTags = currentTags.filter((t) => t !== tag.trim())

    // Update ticket
    await db.conversation.update({
      where: { id: ticketId },
      data: {
        tags: updatedTags.length > 0 ? updatedTags.join(',') : null,
      },
    })

    return NextResponse.json({ success: true, tags: updatedTags })
  } catch (error) {
    console.error("Error removing tag:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}
