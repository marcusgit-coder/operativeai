"use client"

import { useEffect, useState } from "react"
import { useTicketFilters } from "@/hooks/use-ticket-filters"
import { TicketFiltersBar } from "@/components/support/ticket-filters"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Conversation {
  id: string
  subject: string
  status: string
  priority: string
  customerEmail: string
  customerName: string
  createdAt: string
  updatedAt: string
  unreadCount: number
  messages: any[]
}

interface TicketStats {
  total: number
  urgent: number
  overdue: number
  unassigned: number
  myTickets: number
}

export function SupportTicketsClient() {
  const { queryString } = useTicketFilters()
  const [tickets, setTickets] = useState<Conversation[]>([])
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    urgent: 0,
    overdue: 0,
    unassigned: 0,
    myTickets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Fetch tickets whenever filters change
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/support?${queryString}`)
        const data = await response.json()
        
        if (data.conversations) {
          setTickets(data.conversations)
          setStats(data.stats || stats)
          
          // Extract unique tags from all tickets
          const tags = new Set<string>()
          data.conversations.forEach((ticket: Conversation & { tags?: string }) => {
            if (ticket.tags) {
              ticket.tags.split(',').forEach((tag: string) => tags.add(tag.trim()))
            }
          })
          setAvailableTags(Array.from(tags))
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [queryString])

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <TicketFiltersBar
        ticketCounts={stats}
        availableTags={availableTags}
        availableUsers={[]} // TODO: Fetch from API
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>
          Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{tickets.length}</span> tickets
        </p>
        {loading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No tickets found matching your filters.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Try adjusting your filters or create a new ticket.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-900 dark:border-gray-800"
              onClick={() => window.location.href = `/support/${ticket.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {ticket.subject || "No Subject"}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                      ticket.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      ticket.status === "RESOLVED" ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.priority === "CRITICAL" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                      ticket.priority === "URGENT" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                      ticket.priority === "HIGH" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                      ticket.priority === "MEDIUM" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ticket.customerName || ticket.customerEmail}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                </div>
                {ticket.unreadCount > 0 && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                    <span className="text-xs font-medium">{ticket.unreadCount} new</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
