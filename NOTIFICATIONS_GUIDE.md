# Notifications System Guide

## Overview
The notification system provides real-time in-app notifications for important events across the platform. It includes a database-backed notification service, API endpoints, and UI components.

## Components

### 1. Database Models

**Notification** (`prisma/schema.prisma`)
- Stores all notification records
- Fields: type, title, message, priority, relatedType, relatedId, relatedUrl, isRead, isArchived
- Indexed by userId, organizationId, and type for fast queries

**NotificationPreference** (`prisma/schema.prisma`)
- User-specific notification settings
- Channel preferences: email, push, in-app
- Type preferences: newTicket, ticketReply, ticketStatus, invoiceUpdates, systemAlerts
- Quiet hours: configurable start/end times

### 2. Service Layer

**Notification Service** (`lib/notifications/notification-service.ts`)
Functions:
- `createNotification()` - Create single notification with preference checks
- `createBulkNotifications()` - Notify multiple users at once
- `markAsRead()` / `markAllAsRead()` - Mark notifications as read
- `deleteNotification()` - Archive notifications
- `getUserNotifications()` - Fetch with filters (unread, types, archived)
- `getUnreadCount()` - Get badge count
- `getUserPreferences()` / `updateUserPreferences()` - Manage settings

**Notification Triggers** (`lib/notifications/triggers.ts`)
Pre-built triggers for common events:
- `notifyNewTicket()` - When a new support ticket is created
- `notifyTicketReply()` - When someone replies to a ticket (INBOUND only)
- `notifyTicketStatusChange()` - When ticket status changes
- `notifyTicketEscalated()` - When ticket priority increases
- `notifyInvoiceProcessed()` - When invoice is successfully processed
- `notifyInvoiceFailed()` - When invoice processing fails
- `notifySystemAlert()` - For system-wide alerts

### 3. API Routes

All routes require authentication via NextAuth session.

**GET /api/notifications**
- Query params: `unreadOnly`, `limit`, `offset`, `types`, `includeArchived`
- Returns paginated notification list

**POST /api/notifications/mark-read**
- Body: `{ notificationIds: string[] }` or `{ all: true }`
- Marks notifications as read

**GET /api/notifications/unread-count**
- Returns: `{ count: number }`
- Used for badge display

**DELETE /api/notifications/[id]**
- Archives a notification (soft delete)

**GET /api/notifications/preferences**
- Returns user's notification preferences

**PATCH /api/notifications/preferences**
- Updates user's notification preferences
- Body: Partial preferences object

### 4. UI Components

**NotificationBell** (`components/notifications/notification-bell.tsx`)
- Bell icon with unread count badge
- Polls for updates every 30 seconds
- Toggles notification panel on click
- Shows badge (1-9 or 9+) when unread notifications exist

**NotificationPanel** (`components/notifications/notification-panel.tsx`)
- Dropdown card showing recent notifications
- Features:
  - Displays 10 most recent notifications
  - Color-coded priority borders (URGENT=red, HIGH=orange, NORMAL=blue, LOW=gray)
  - Different icons per notification type
  - Blue dot + background for unread notifications
  - Click notification to navigate and mark as read
  - "Mark all as read" button
  - "View all" link to full notifications page (to be created)
  - Empty state for no notifications

### 5. Integration Points

**Support Ticket System** - Notifications are triggered at:
- `app/api/support/route.ts` - New ticket creation
- `app/api/support/[id]/messages/route.ts` - Agent replies to ticket
- `app/api/support/[id]/route.ts` - Ticket status changes

**Invoice Processing** (Ready to integrate)
- Use `notifyInvoiceProcessed()` when invoice AI processing succeeds
- Use `notifyInvoiceFailed()` when invoice AI processing fails

## Notification Types

| Type | Trigger | Recipients | Priority |
|------|---------|-----------|----------|
| NEW_TICKET | New support ticket created | Organization admins | NORMAL |
| TICKET_REPLY | Customer replies to ticket | Organization admins | HIGH |
| TICKET_STATUS_CHANGED | Ticket status updated | Organization admins | LOW |
| TICKET_ESCALATED | Ticket priority increased | Organization admins | HIGH |
| INVOICE_PROCESSED | Invoice successfully processed | Organization admins | NORMAL |
| INVOICE_FAILED | Invoice processing failed | Organization admins | HIGH |
| SYSTEM_ALERT | System-wide alerts | All users | URGENT |

## Usage Examples

### Creating a Notification
```typescript
import { createNotification } from "@/lib/notifications/notification-service"

await createNotification({
  userId: "user_123",
  organizationId: "org_456",
  type: "NEW_TICKET",
  title: "New Support Ticket",
  message: "John Doe created a new ticket",
  relatedType: "ticket",
  relatedId: "ticket_789",
  relatedUrl: "/support/ticket_789",
  priority: "NORMAL",
  category: "support",
})
```

### Using a Trigger
```typescript
import { notifyNewTicket } from "@/lib/notifications/triggers"

await notifyNewTicket({
  id: conversation.id,
  organizationId: conversation.organizationId,
  customerName: conversation.customerName,
  customerEmail: conversation.customerEmail,
  subject: conversation.subject,
  priority: "NORMAL",
  channel: conversation.channel,
})
```

### Fetching Notifications (Client Side)
```typescript
const response = await fetch("/api/notifications?unreadOnly=true&limit=10")
const { notifications } = await response.json()
```

### Marking as Read
```typescript
await fetch("/api/notifications/mark-read", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ notificationIds: ["notif_1", "notif_2"] }),
})
```

## Next Steps

### Phase 6: Notification Preferences Page
Create `/settings/notifications` page with form to update:
- Channel toggles (Email, Push, In-App)
- Notification type toggles
- Quiet hours settings

### Phase 7: Enhancements
- **Real-time updates**: Integrate Pusher or WebSockets for instant notifications
- **Email notifications**: Use nodemailer to send email alerts based on preferences
- **Browser push**: Add Web Push API support for desktop notifications
- **Notification history**: Create `/notifications` page to view all notifications
- **Search and filter**: Advanced filtering by type, date, priority, etc.
- **Notification templates**: Customizable message templates per organization

## Testing

### Manual Testing Checklist
1. ✅ Create a new support ticket → Check bell badge increments
2. ✅ Click bell → Verify notification appears in panel
3. ✅ Click notification → Verify navigation to ticket page and marked as read
4. ✅ Reply to ticket as agent → Verify other admins get notification
5. ✅ Change ticket status → Verify status change notification appears
6. ✅ Mark all as read → Verify badge clears and all show as read
7. ⏳ Test quiet hours functionality
8. ⏳ Test notification preferences toggle
9. ⏳ Test with multiple users in organization

### Database Verification
```sql
-- View recent notifications
SELECT * FROM Notification ORDER BY createdAt DESC LIMIT 10;

-- Check unread count for user
SELECT COUNT(*) FROM Notification WHERE userId = 'user_id' AND isRead = 0;

-- View user preferences
SELECT * FROM NotificationPreference WHERE userId = 'user_id';
```

## Troubleshooting

### Badge not updating
- Check browser console for fetch errors
- Verify API route returns correct count
- Check polling interval (default: 30 seconds)

### Notifications not being created
- Verify trigger functions are being called
- Check server logs for errors
- Ensure user preferences allow the notification type
- Verify not in quiet hours

### Type errors with Prisma
- Run `npm run db:generate` to regenerate client
- Restart TypeScript server in VS Code
- Clear node_modules and reinstall if needed

## Performance Considerations

- Notifications are indexed by userId and organizationId for fast queries
- Polling is client-side only (every 30 seconds)
- Archive old read notifications periodically to keep table size manageable
- Consider pagination for users with many notifications
- Use `includeArchived: false` by default to reduce query load

## Security

- All API routes require authentication via NextAuth
- Users can only access their own notifications
- Organization-scoped queries prevent cross-org data leaks
- Mark-read and delete operations verify ownership before execution
