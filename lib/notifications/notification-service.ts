import { db } from "@/lib/db"

// Notification Types
export type NotificationType =
  | "NEW_TICKET"
  | "TICKET_REPLY"
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_CHANGED"
  | "TICKET_ESCALATED"
  | "NEW_INVOICE"
  | "INVOICE_PROCESSED"
  | "INVOICE_FAILED"
  | "PAYMENT_RECEIVED"
  | "SYSTEM_ALERT"
  | "ACCOUNT_UPDATE"
  | "TEAM_MENTION"

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

export interface CreateNotificationParams {
  userId: string
  organizationId: string
  type: NotificationType
  title: string
  message: string
  relatedType?: string
  relatedId?: string
  relatedUrl?: string
  priority?: NotificationPriority
  category?: string
  data?: any
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  console.log("🔔 Creating notification:", params.type)

  // Check if user has notification preferences
  const preferences = await db.notificationPreference.findUnique({
    where: { userId: params.userId },
  })

  // If user has disabled in-app notifications, skip
  if (preferences && !preferences.inAppEnabled) {
    console.log("⏭️ User has disabled in-app notifications")
    return null
  }

  // Check if notification type is enabled
  const typeEnabled = isNotificationTypeEnabled(params.type, preferences)
  if (!typeEnabled) {
    console.log("⏭️ Notification type disabled for user:", params.type)
    return null
  }

  // Check quiet hours
  if (preferences && isInQuietHours(preferences)) {
    console.log("🌙 User is in quiet hours, skipping notification")
    return null
  }

  // Create the notification
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      organizationId: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      relatedUrl: params.relatedUrl,
      priority: params.priority || "NORMAL",
      category: params.category,
      data: params.data ? JSON.stringify(params.data) : null,
    },
  })

  console.log("✅ Notification created:", notification.id)

  // TODO: Send push notification if enabled
  // TODO: Send email notification if enabled

  return notification
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  console.log("🔔 Creating bulk notifications for", userIds.length, "users")

  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        ...params,
        userId,
      })
    )
  )

  return notifications.filter((n) => n !== null)
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  })

  if (!notification) {
    throw new Error("Notification not found")
  }

  if (notification.isRead) {
    return notification // Already read
  }

  return await db.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  const result = await db.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  console.log("✅ Marked", result.count, "notifications as read")
  return result
}

/**
 * Delete (archive) a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  })

  if (!notification) {
    throw new Error("Notification not found")
  }

  // Archive instead of delete
  return await db.notification.update({
    where: { id: notificationId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  })
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
    types?: NotificationType[]
    includeArchived?: boolean
  }
) {
  const where: any = {
    userId,
  }

  if (options?.unreadOnly) {
    where.isRead = false
  }

  if (options?.types && options.types.length > 0) {
    where.type = { in: options.types }
  }

  if (!options?.includeArchived) {
    where.isArchived = false
  }

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  })

  return notifications
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  const count = await db.notification.count({
    where: {
      userId,
      isRead: false,
      isArchived: false,
    },
  })

  return count
}

/**
 * Get or create user notification preferences
 */
export async function getUserPreferences(userId: string) {
  let preferences = await db.notificationPreference.findUnique({
    where: { userId },
  })

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await db.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        newTicket: true,
        ticketReply: true,
        ticketStatus: true,
        invoiceUpdates: true,
        systemAlerts: true,
      },
    })
  }

  return preferences
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<{
    emailEnabled: boolean
    pushEnabled: boolean
    inAppEnabled: boolean
    newTicket: boolean
    ticketReply: boolean
    ticketStatus: boolean
    invoiceUpdates: boolean
    systemAlerts: boolean
    quietHoursStart: number | null
    quietHoursEnd: number | null
  }>
) {
  return await db.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...updates,
    },
  })
}

// Helper Functions

/**
 * Check if a notification type is enabled for a user
 */
function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: any
): boolean {
  if (!preferences) return true

  switch (type) {
    case "NEW_TICKET":
    case "TICKET_ASSIGNED":
    case "TICKET_ESCALATED":
      return preferences.newTicket
    case "TICKET_REPLY":
      return preferences.ticketReply
    case "TICKET_STATUS_CHANGED":
      return preferences.ticketStatus
    case "NEW_INVOICE":
    case "INVOICE_PROCESSED":
    case "INVOICE_FAILED":
    case "PAYMENT_RECEIVED":
      return preferences.invoiceUpdates
    case "SYSTEM_ALERT":
    case "ACCOUNT_UPDATE":
      return preferences.systemAlerts
    default:
      return true
  }
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(preferences: any): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false
  }

  const now = new Date()
  const currentHour = now.getHours()

  const start = preferences.quietHoursStart
  const end = preferences.quietHoursEnd

  // Handle case where quiet hours span midnight
  if (start > end) {
    return currentHour >= start || currentHour < end
  }

  return currentHour >= start && currentHour < end
}
