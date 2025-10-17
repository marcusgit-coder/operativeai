"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, Archive } from "lucide-react"
import TicketList from "@/components/support/ticket-list"
import ArchivedTickets from "@/components/support/archived-tickets"

interface Ticket {
  id: string
  customerName: string | null
  customerEmail: string | null
  subject: string | null
  status: string
  channel: string
  closedAt: Date | null
  updatedAt: Date
  messages: Array<{ id: string }>
}

interface TicketTabsProps {
  allTickets: any[]
  archivedTickets: any[]
}

export default function TicketTabs({ allTickets, archivedTickets }: TicketTabsProps) {
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "archived">("active")

  const activeTickets = allTickets.filter(t => t.status === "ACTIVE")
  const resolvedTickets = allTickets.filter(t => t.status === "RESOLVED")

  const tabs = [
    {
      id: "active" as const,
      label: "Active",
      count: activeTickets.length,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-600 dark:border-blue-400",
    },
    {
      id: "resolved" as const,
      label: "Resolved",
      count: resolvedTickets.length,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-600 dark:border-green-400",
    },
    {
      id: "archived" as const,
      label: "Archived",
      count: archivedTickets.length,
      icon: Archive,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-800",
      borderColor: "border-gray-600 dark:border-gray-400",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-all
                border-b-2 -mb-px
                ${
                  isActive
                    ? `${tab.color} ${tab.borderColor}`
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${
                    isActive
                      ? `${tab.bgColor} ${tab.color}`
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "active" && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Active Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketList tickets={activeTickets} />
            </CardContent>
          </Card>
        )}

        {activeTab === "resolved" && (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Resolved Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketList tickets={resolvedTickets} />
            </CardContent>
          </Card>
        )}

        {activeTab === "archived" && (
          <ArchivedTickets tickets={archivedTickets} />
        )}
      </div>
    </div>
  )
}
