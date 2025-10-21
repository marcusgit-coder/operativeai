import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, User, Calendar, MessageCircle } from "lucide-react"
import Link from "next/link"
import { TimeAgo } from "@/components/ui/time-ago"
import TicketMessages from "@/components/support/ticket-messages"
import TicketActions from "@/components/support/ticket-actions"
import ManualEmailCheck from "@/components/support/manual-email-check"
import TicketAssignmentClient from "@/components/support/ticket-assignment-client"

async function getTicket(ticketId: string, organizationId: string) {
  const conversation = await db.conversation.findFirst({
    where: {
      id: ticketId,
      organizationId,
    },
    include: {
      messages: {
        orderBy: { sentAt: "asc" },
      },
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return conversation
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const ticket = await getTicket(params.id, session.user.organizationId)

  if (!ticket) {
    notFound()
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/support">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold dark:text-gray-100">
              {ticket.subject || "No Subject"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Ticket ID: {ticket.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ticket.channel === "EMAIL" && <ManualEmailCheck ticketId={ticket.id} />}
          <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </div>

      {/* Ticket Info Card */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  ticket.status
                )}`}
              >
                {ticket.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Priority</p>
              <span className="text-sm font-medium dark:text-gray-100">
                {ticket.priority}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer</p>
              <p className="text-sm font-medium dark:text-gray-100 flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.customerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-sm font-medium dark:text-gray-100 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {ticket.customerEmail}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Channel</p>
              <p className="text-sm font-medium dark:text-gray-100 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {ticket.channel}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
              <p className="text-sm font-medium dark:text-gray-100 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <TimeAgo date={ticket.createdAt} />
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Updated</p>
              <p className="text-sm font-medium dark:text-gray-100">
                <TimeAgo date={ticket.updatedAt} />
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Messages</p>
              <p className="text-sm font-medium dark:text-gray-100">
                {ticket.messages.length}
              </p>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="mt-6 pt-6 border-t dark:border-gray-800">
            <TicketAssignmentClient
              ticketId={ticket.id}
              currentAssignee={ticket.assignedUserId}
              assignedUser={ticket.assignedUser}
              organizationId={session.user.organizationId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <TicketMessages messages={ticket.messages} ticketId={ticket.id} />
    </div>
  )
}
