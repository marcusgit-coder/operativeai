import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * PUT /api/filters/[id]
 * Update a saved filter
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, filters, isDefault, isShared, isPinned } = body

    // Check if filter exists and user has permission
    const existingFilter = await db.savedFilter.findUnique({
      where: { id: params.id }
    })

    if (!existingFilter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    if (existingFilter.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If setting as default, unset other default filters
    if (isDefault && !existingFilter.isDefault) {
      await db.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          organizationId: existingFilter.organizationId,
          isDefault: true,
          id: { not: params.id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // Update the filter
    const updatedFilter = await db.savedFilter.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters: JSON.stringify(filters) }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isShared !== undefined && { isShared }),
        ...(isPinned !== undefined && { isPinned }),
        updatedAt: new Date()
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

    return NextResponse.json({ filter: updatedFilter })
  } catch (error) {
    console.error('Error updating saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to update saved filter' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/filters/[id]
 * Delete a saved filter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if filter exists and user has permission
    const existingFilter = await db.savedFilter.findUnique({
      where: { id: params.id }
    })

    if (!existingFilter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    if (existingFilter.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the filter
    await db.savedFilter.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved filter' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/filters/[id]/use
 * Track filter usage
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update usage statistics
    const updatedFilter = await db.savedFilter.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1
        },
        lastUsedAt: new Date()
      }
    })

    return NextResponse.json({ filter: updatedFilter })
  } catch (error) {
    console.error('Error tracking filter usage:', error)
    return NextResponse.json(
      { error: 'Failed to track filter usage' },
      { status: 500 }
    )
  }
}
