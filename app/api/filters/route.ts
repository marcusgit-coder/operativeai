import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/filters
 * Get all saved filters for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeShared = searchParams.get('includeShared') === 'true'

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
      OR: [
        { userId: session.user.id }, // User's own filters
      ]
    }

    // Include shared filters if requested
    if (includeShared) {
      where.OR.push({ isShared: true })
    }

    const filters = await db.savedFilter.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ filters })
  } catch (error) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved filters' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/filters
 * Create a new saved filter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, filters, isDefault, isShared, isPinned } = body

    if (!name || !filters) {
      return NextResponse.json(
        { error: 'Name and filters are required' },
        { status: 400 }
      )
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // If setting as default, unset other default filters for this user
    if (isDefault) {
      await db.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          organizationId: user.organizationId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Create the saved filter
    const savedFilter = await db.savedFilter.create({
      data: {
        userId: session.user.id,
        organizationId: user.organizationId,
        name,
        description,
        filters: JSON.stringify(filters),
        isDefault: isDefault || false,
        isShared: isShared || false,
        isPinned: isPinned || false,
        usageCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ filter: savedFilter }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to create saved filter' },
      { status: 500 }
    )
  }
}
