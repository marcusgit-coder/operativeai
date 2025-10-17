import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface RecentActivityProps {
  organizationId: string
}

export default async function RecentActivity({ organizationId }: RecentActivityProps) {
  const activities = await db.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const getActivityIcon = (action: string) => {
    if (action.includes("INVOICE")) return "📄"
    if (action.includes("CONVERSATION")) return "💬"
    if (action.includes("KNOWLEDGE")) return "📚"
    return "🔔"
  }

  const getActivityMessage = (activity: any) => {
    // Parse metadata if it's a string
    let metadata = activity.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = null;
      }
    }

    switch (activity.action) {
      case "INVOICE_PROCESSED":
        return `Invoice "${metadata?.fileName || 'Unknown'}" processed`
      case "INVOICE_UPLOADED":
        return `Invoice "${metadata?.fileName || 'Unknown'}" uploaded`
      case "CONVERSATION_CREATED":
        return `New conversation from ${metadata?.customerEmail || 'customer'}`
      case "CONVERSATION_ESCALATED":
        return `Conversation escalated to human`
      case "USER_LOGIN":
        return `User logged in`
      default:
        return activity.action.replace(/_/g, " ").toLowerCase()
    }
  }

  const getActivityLink = (activity: any) => {
    // Link to invoice detail page for invoice activities
    if (
      (activity.action === "INVOICE_PROCESSED" || activity.action === "INVOICE_UPLOADED") &&
      activity.resourceType === "INVOICE" &&
      activity.resourceId
    ) {
      return `/invoices/${activity.resourceId}`
    }

    // Link to conversation for support activities
    if (
      activity.resourceType === "CONVERSATION" &&
      activity.resourceId
    ) {
      return `/support/${activity.resourceId}`
    }

    return null
  }

  return (
    <Card className="h-[400px] flex flex-col dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="dark:text-gray-100">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-6 pt-0">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No activity yet. Start by uploading an invoice!
          </p>
        ) : (
          <div className="h-full overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {activities.map((activity) => {
              const activityLink = getActivityLink(activity)
              const activityContent = (
                <>
                  <span className="text-2xl flex-shrink-0">{getActivityIcon(activity.action)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </>
              )

              // If there's a link, wrap in Link component with hover effects
              if (activityLink) {
                return (
                  <Link
                    key={activity.id}
                    href={activityLink}
                    className="flex items-start space-x-3 text-sm p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    {activityContent}
                  </Link>
                )
              }

              // Otherwise just display without link
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 text-sm p-3"
                >
                  {activityContent}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
