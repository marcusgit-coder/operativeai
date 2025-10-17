"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/ui/time-ago"
import {
  Bell,
  CheckCheck,
  Ticket,
  FileText,
  AlertCircle,
  MessageSquare,
  Loader2,
} from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  relatedUrl?: string | null
  priority: string
  isRead: boolean
  createdAt: string
}

interface NotificationPanelProps {
  onClose: () => void
  onNotificationRead: () => void
}

export default function NotificationPanel({
  onClose,
  onNotificationRead,
}: NotificationPanelProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        })
        onNotificationRead()
      } catch (error) {
        console.error("Failed to mark as read:", error)
      }
    }

    // Navigate if there's a URL
    if (notification.relatedUrl) {
      router.push(notification.relatedUrl)
      onClose()
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true)
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotifications(
        notifications.map((n) => ({ ...n, isRead: true }))
      )
      onNotificationRead()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_TICKET":
      case "TICKET_ASSIGNED":
        return <Ticket className="h-4 w-4 text-blue-500" />
      case "TICKET_REPLY":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "TICKET_STATUS_CHANGED":
        return <CheckCheck className="h-4 w-4 text-purple-500" />
      case "TICKET_ESCALATED":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "NEW_INVOICE":
      case "INVOICE_PROCESSED":
      case "INVOICE_FAILED":
        return <FileText className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-4 border-l-red-500"
      case "HIGH":
        return "border-l-4 border-l-orange-500"
      case "NORMAL":
        return "border-l-4 border-l-blue-500"
      case "LOW":
        return "border-l-4 border-l-gray-500"
      default:
        return "border-l-4 border-l-gray-300"
    }
  }

  return (
    <Card className="absolute right-0 top-12 w-96 max-h-[600px] overflow-hidden shadow-lg z-50 dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg dark:text-gray-100">Notifications</CardTitle>
          <div className="flex gap-2">
            {notifications.some((n) => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="text-xs"
              >
                {markingAllRead ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Mark all read"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""}
                    ${getPriorityColor(notification.priority)}
                  `}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <TimeAgo date={notification.createdAt} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 border-t dark:border-gray-800">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                router.push("/notifications")
                onClose()
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
