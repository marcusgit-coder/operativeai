'use client'

/**
 * Ticket Assignment Client Component
 * Wraps UserAssignmentDropdown with client-side logic for ticket updates
 */

import { useState } from 'react'
import { UserAssignmentDropdown } from './user-assignment-dropdown'
import { useRouter } from 'next/navigation'

interface TicketAssignmentClientProps {
  ticketId: string
  currentAssignee: string | null
  assignedUser?: {
    id: string
    name: string | null
    email: string
  } | null
  organizationId: string
}

export default function TicketAssignmentClient({
  ticketId,
  currentAssignee,
  assignedUser,
  organizationId,
}: TicketAssignmentClientProps) {
  const router = useRouter()
  const [assigning, setAssigning] = useState(false)
  const [localAssignee, setLocalAssignee] = useState(currentAssignee)

  const handleAssign = async (userId: string | null) => {
    setAssigning(true)

    try {
      const response = await fetch(`/api/support/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedUserId: userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update assignment')
      }

      const data = await response.json()
      setLocalAssignee(userId)

      // Show success toast
      if (typeof window !== 'undefined' && (window as any).toast) {
        ;(window as any).toast.success(data.message || 'Assignment updated')
      }

      // Refresh the page data
      router.refresh()
    } catch (error: any) {
      console.error('Assignment error:', error)
      // Show error toast
      if (typeof window !== 'undefined' && (window as any).toast) {
        ;(window as any).toast.error(error.message || 'Failed to update assignment')
      }
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Assigned To
        </label>
        {assignedUser && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Currently: {assignedUser.name || assignedUser.email}
          </div>
        )}
      </div>
      <UserAssignmentDropdown
        currentAssignee={localAssignee}
        onAssign={handleAssign}
        organizationId={organizationId}
        ticketId={ticketId}
        variant="default"
      />
      {assigning && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Updating assignment...
        </p>
      )}
    </div>
  )
}
