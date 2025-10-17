"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Archive, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TimeAgo } from "@/components/ui/time-ago"

interface ArchivedTicket {
  id: string
  customerName: string | null
  customerEmail: string | null
  subject: string | null
  channel: string
  closedAt: Date | null
  updatedAt: Date
  messages: Array<{ id: string }>
}

interface ArchivedTicketsProps {
  tickets: ArchivedTicket[]
}

export default function ArchivedTickets({ tickets }: ArchivedTicketsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [showConfirmAll, setShowConfirmAll] = useState(false)

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to permanently delete this ticket? This action cannot be undone.")) {
      return
    }

    setDeleting(ticketId)
    try {
      const response = await fetch("/api/support/archive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      })

      const data = await response.json()

      if (response.ok) {
        router.refresh()
      } else {
        alert(data.error || "Failed to delete ticket")
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
      alert("Failed to delete ticket")
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    setDeletingAll(true)
    try {
      const response = await fetch("/api/support/archive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "All archived tickets deleted")
        setShowConfirmAll(false)
        router.refresh()
      } else {
        alert(data.error || "Failed to delete archived tickets")
      }
    } catch (error) {
      console.error("Error clearing archives:", error)
      alert("Failed to clear archives")
    } finally {
      setDeletingAll(false)
    }
  }

  if (tickets.length === 0) {
    return (
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-gray-100 flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Tickets
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No archived tickets</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="dark:text-gray-100 flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Tickets ({tickets.length})
          </CardTitle>
          {tickets.length > 0 && (
            <div className="flex gap-2">
              {!showConfirmAll ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirmAll(true)}
                  disabled={deletingAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Archives
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-500 dark:text-orange-400">
                    Delete all {tickets.length} archived tickets?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={deletingAll}
                  >
                    {deletingAll ? "Deleting..." : "Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmAll(false)}
                    disabled={deletingAll}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Link
                href={`/support/${ticket.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {ticket.channel}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-400 dark:bg-gray-600 text-white">
                        CLOSED
                      </span>
                    </div>
                    <h3 className="font-medium dark:text-gray-100 truncate">
                      {ticket.subject || "No subject"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {ticket.customerName || ticket.customerEmail || "Unknown customer"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
                      {ticket.closedAt && (
                        <span>
                          Closed <TimeAgo date={ticket.closedAt} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTicket(ticket.id)}
                disabled={deleting === ticket.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {deleting === ticket.id ? (
                  <span className="text-xs">Deleting...</span>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
