"use client"

import { Conversation, Message } from "@prisma/client"
import { TimeAgo } from "@/components/ui/time-ago"
import Link from "next/link"
import { Mail, User, Calendar, MessageCircle, AlertCircle } from "lucide-react"
import { UserAssignmentDropdown } from "./user-assignment-dropdown"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface TicketCardProps {
  ticket: Conversation & {
    _count?: {
      messages: number
    }
    messages?: Message[]
    assignedUser?: {
      id: string
      name: string | null
      email: string
    } | null
  }
  organizationId: string
  showAssignment?: boolean
}

export default function TicketCard({ ticket, organizationId, showAssignment = false }: TicketCardProps) {
  const messageCount = ticket._count?.messages ?? ticket.messages?.length ?? 0
  const router = useRouter()
  const [assigning, setAssigning] = useState(false)

  const handleAssign = async (userId: string | null, e?: React.MouseEvent) => {
    // Prevent navigation when clicking assignment dropdown
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setAssigning(true)

    try {
      const response = await fetch(`/api/support/${ticket.id}/assign`, {
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

      // Refresh the data
      router.refresh()
    } catch (error: any) {
      console.error('Assignment error:', error)
      if (typeof window !== 'undefined' && (window as any).toast) {
        ;(window as any).toast.error(error.message || 'Failed to update assignment')
      }
    } finally {
      setAssigning(false)
    }
  }

  // Status badge styling
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  // Channel badge styling
  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case "EMAIL":
        return <Mail className="h-3 w-3" />
      case "CHAT":
        return <MessageCircle className="h-3 w-3" />
      default:
        return <MessageCircle className="h-3 w-3" />
    }
  }

  return (
    <Link href={`/support/${ticket.id}`}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {ticket.subject || "No Subject"}
              </h3>
              {ticket.assignedToHuman && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  Escalated
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.customerName || ticket.customerEmail}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {ticket.customerEmail}
              </span>
              <span className="flex items-center gap-1">
                {getChannelIcon(ticket.channel)}
                {ticket.channel}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                ticket.status
              )}`}
            >
              {ticket.status}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {messageCount} {messageCount === 1 ? "message" : "messages"}
            </span>
          </div>
        </div>

        {/* Last message preview - would require including messages in query */}
        {/* TODO: Add last message preview if needed */}

        {/* Assignment dropdown */}
        {showAssignment && (
          <div 
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            onClick={(e) => e.preventDefault()}
          >
            <UserAssignmentDropdown
              currentAssignee={ticket.assignedUserId}
              onAssign={(userId) => handleAssign(userId)}
              organizationId={organizationId}
              ticketId={ticket.id}
              variant="compact"
            />
          </div>
        )}
      </div>
    </Link>
  )
}
