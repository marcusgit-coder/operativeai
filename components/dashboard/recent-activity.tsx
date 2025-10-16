import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

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
    switch (activity.action) {
      case "INVOICE_PROCESSED":
        return `Invoice "${activity.metadata?.fileName}" processed`
      case "CONVERSATION_CREATED":
        return `New conversation from ${activity.metadata?.customerEmail}`
      case "CONVERSATION_ESCALATED":
        return `Conversation escalated to human`
      default:
        return activity.action.replace(/_/g, " ").toLowerCase()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No activity yet. Start by uploading an invoice!
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 text-sm"
              >
                <span className="text-2xl">{getActivityIcon(activity.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium">
                    {getActivityMessage(activity)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
