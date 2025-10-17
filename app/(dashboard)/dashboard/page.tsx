import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import StatsCards from "@/components/dashboard/stats-cards"
import RecentActivity from "@/components/dashboard/recent-activity"
import QuickActions from "@/components/dashboard/quick-actions"
import InvoiceMetrics from "@/components/dashboard/invoice-metrics"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    return null
  }

  const [
    totalInvoices,
    pendingInvoices,
    activeConversations,
    todayActivity,
    invoices
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
    // Fetch invoices for metrics (last 6 months)
    db.invoice.findMany({
      where: { 
        organizationId: session.user.organizationId,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
        }
      },
      select: {
        id: true,
        totalAmount: true,
        confidenceScore: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    }),
  ])

  const stats = {
    totalInvoices,
    pendingInvoices,
    activeConversations,
    todayActivity,
  }

  // Process data for metrics charts
  const metricsData = processInvoiceMetrics(invoices)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, {session.user.name}</p>
      </div>

      <StatsCards stats={stats} />

      <InvoiceMetrics data={metricsData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity organizationId={session.user.organizationId} />
      </div>
    </div>
  )
}

// Helper function to process invoice data into chart-friendly format
function processInvoiceMetrics(invoices: any[]) {
  // Get last 6 months
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
  }

  // Initialize data structures
  const monthlyData: { [key: string]: { count: number; totalAmount: number; confidenceSum: number; timeSum: number } } = {}
  months.forEach(month => {
    monthlyData[month] = { count: 0, totalAmount: 0, confidenceSum: 0, timeSum: 0 }
  })

  // Process invoices
  invoices.forEach(invoice => {
    const month = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (monthlyData[month]) {
      monthlyData[month].count++
      monthlyData[month].totalAmount += invoice.totalAmount || 0
      monthlyData[month].confidenceSum += (invoice.confidenceScore || 0) * 100
      // Simulate processing time (in real app, you'd track this)
      monthlyData[month].timeSum += Math.random() * 5 + 3 // Random 3-8 seconds
    }
  })

  // Format data for charts
  return {
    monthlyVolume: months.map(month => ({
      month,
      count: monthlyData[month].count
    })),
    monthlyRevenue: months.map(month => ({
      month,
      amount: monthlyData[month].totalAmount
    })),
    processingTime: months.map(month => ({
      month,
      avgTime: monthlyData[month].count > 0 
        ? monthlyData[month].timeSum / monthlyData[month].count 
        : 0
    })),
    confidenceScore: months.map(month => ({
      month,
      avgScore: monthlyData[month].count > 0 
        ? monthlyData[month].confidenceSum / monthlyData[month].count 
        : 0
    }))
  }
}
