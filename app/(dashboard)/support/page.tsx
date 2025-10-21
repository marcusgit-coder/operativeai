import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, CheckCircle, Clock, AlertCircle, Archive } from "lucide-react"
import Link from "next/link"
import { SupportTicketsClient } from "@/components/support/support-tickets-client"
import { filterTickets, getFilterStats } from "@/lib/filters/ticket-filter-service"
import { DEFAULT_FILTERS } from "@/types/filters"

async function getSupportTickets(organizationId: string) {
  const conversations = await db.conversation.findMany({
    where: {
      organizationId,
    },
    include: {
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return conversations
}

async function getTicketStats(organizationId: string) {
  const conversations = await db.conversation.findMany({
    where: { organizationId },
    select: { status: true, assignedToHuman: true },
  })

  const stats = {
    total: conversations.length,
    active: conversations.filter((c: any) => c.status === "ACTIVE").length,
    resolved: conversations.filter((c: any) => c.status === "RESOLVED").length,
    archived: conversations.filter((c: any) => c.status === "CLOSED").length,
    needsAttention: conversations.filter((c: any) => c.assignedToHuman && c.status === "ACTIVE").length,
  }

  return stats
}

async function getArchivedTickets(organizationId: string) {
  const conversations = await db.conversation.findMany({
    where: {
      organizationId,
      status: "CLOSED",
    },
    include: {
      messages: {
        select: { id: true },
      },
    },
    orderBy: {
      closedAt: "desc",
    },
  })

  return conversations
}

export default async function SupportPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  // Fetch initial tickets with default filters
  const initialData = await filterTickets(
    session.user.organizationId,
    DEFAULT_FILTERS,
    { page: 1, limit: 20 }
  )
  
  const stats = await getTicketStats(session.user.organizationId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Support Tickets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage customer conversations and support requests
          </p>
        </div>
        <Link href="/support/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Total Tickets
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">{stats.total}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All conversations
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Active
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.active}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Open conversations
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Needs Attention
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.needsAttention}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Escalated to human
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Resolved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.resolved}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed tickets
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Archived
            </CardTitle>
            <Archive className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.archived}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Closed tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket List with Filters */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          <SupportTicketsClient
            initialTickets={initialData.items}
            initialTotal={initialData.total}
            organizationId={session.user.organizationId}
            showAssignment={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
