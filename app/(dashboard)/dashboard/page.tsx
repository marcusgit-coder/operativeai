import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import StatsCards from "@/components/dashboard/stats-cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import QuickActions from "@/components/dashboard/quick-actions"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    return null
  }

  const [
    totalInvoices,
    pendingInvoices,
    activeConversations,
    todayActivity
  ] = await Promise.all([
    db.invoice.count({
      where: { organizationId: session.user.organizationId },
    }),
    db.invoice.count({
      where: {
        organizationId: session.user.organizationId,
        status: "NEEDS_REVIEW",
      },
    }),
    db.conversation.count({
      where: {
        organizationId: session.user.organizationId,
        status: "ACTIVE",
      },
    }),
    db.activityLog.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  const stats = {
    totalInvoices,
    pendingInvoices,
    activeConversations,
    todayActivity,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, {session.user.name}</p>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity organizationId={session.user.organizationId} />
      </div>
    </div>
  )
}
