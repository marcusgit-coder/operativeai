"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Ticket,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  FileText,
  Loader2,
  Filter,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import { TimeAgo } from "@/components/ui/time-ago"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  relatedType?: string | null
  relatedId?: string | null
  relatedUrl?: string | null
  priority: string
  category?: string | null
  isRead: boolean
  readAt?: Date | null
  createdAt: Date
}

const NOTIFICATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "NEW_TICKET", label: "New Tickets" },
  { value: "TICKET_REPLY", label: "Ticket Replies" },
  { value: "TICKET_STATUS_CHANGED", label: "Status Changes" },
  { value: "INVOICE_PROCESSED", label: "Invoice Updates" },
  { value: "SYSTEM_ALERT", label: "System Alerts" },
]

const PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    unreadOnly: false,
    type: "all",
    priority: "all",
  })

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.unreadOnly) params.append("unreadOnly", "true")
      if (filter.type !== "all") params.append("types", filter.type)
      params.append("limit", "50")

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        let filtered = data.notifications

        // Filter by priority on client side
        if (filter.priority !== "all") {
          filtered = filtered.filter((n: Notification) => n.priority === filter.priority)
        }

        setNotifications(filtered)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    if (notification.relatedUrl) {
      router.push(notification.relatedUrl)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_TICKET":
        return <Ticket className="h-5 w-5 text-blue-600" />
      case "TICKET_REPLY":
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case "TICKET_STATUS_CHANGED":
        return <CheckCheck className="h-5 w-5 text-purple-600" />
      case "INVOICE_PROCESSED":
      case "INVOICE_FAILED":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "SYSTEM_ALERT":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-4 border-red-500"
      case "HIGH":
        return "border-l-4 border-orange-500"
      case "NORMAL":
        return "border-l-4 border-blue-500"
      case "LOW":
        return "border-l-4 border-gray-400"
      default:
        return "border-l-4 border-gray-300"
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filter.unreadOnly ? "unread" : "all"}
                onChange={(e) =>
                  setFilter({ ...filter, unreadOnly: e.target.value === "unread" })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="unread">Unread Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark All as Read
              </Button>
            </div>
          )}
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No notifications found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {filter.unreadOnly
                ? "You have no unread notifications"
                : "Notifications will appear here when you receive them"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                  notification.priority
                )} ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            <TimeAgo date={notification.createdAt} />
                          </span>
                          {notification.category && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {notification.category}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded ${
                              notification.priority === "URGENT"
                                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                : notification.priority === "HIGH"
                                ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                                : notification.priority === "NORMAL"
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {notification.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
