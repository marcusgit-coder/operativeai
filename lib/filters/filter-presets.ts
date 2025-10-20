/**
 * Filter Presets
 * Pre-defined filter combinations for quick access
 */

import { FilterPreset, TicketFilters } from '@/types/filters'

/**
 * Quick filter presets that users can apply with one click
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'my-tickets',
    name: 'My Tickets',
    description: 'Tickets assigned to me',
    icon: '👤',
    filters: {
      assignedTo: ['current-user'], // Will be replaced with actual user ID
      status: ['ACTIVE'],
      sortBy: 'lastMessageAt',
      sortOrder: 'desc'
    }
  },
  {
    id: 'my-urgent',
    name: 'My Urgent',
    description: 'My high priority tickets',
    icon: '🔴',
    filters: {
      assignedTo: ['current-user'],
      priority: ['HIGH', 'URGENT'],
      status: ['ACTIVE'],
      sortBy: 'priority',
      sortOrder: 'desc'
    }
  },
  {
    id: 'unread-messages',
    name: 'Unread Messages',
    description: 'Tickets with unread customer messages',
    icon: '📬',
    filters: {
      hasUnreadMessages: true,
      status: ['ACTIVE'],
      sortBy: 'lastMessageAt',
      sortOrder: 'desc'
    }
  },
  {
    id: 'needs-response',
    name: 'Needs Response',
    description: 'Active tickets waiting for reply',
    icon: '⏰',
    filters: {
      status: ['ACTIVE'],
      lastMessageBefore: new Date(
        Date.now() - 4 * 60 * 60 * 1000
      ).toISOString(), // 4 hours ago
      sortBy: 'lastMessageAt',
      sortOrder: 'asc'
    }
  },
  {
    id: 'new-today',
    name: 'New Today',
    description: 'Tickets created today',
    icon: '🆕',
    filters: {
      createdAfter: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      status: ['ACTIVE'],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  },
  {
    id: 'unassigned',
    name: 'Unassigned',
    description: 'Tickets without an assignee',
    icon: '📥',
    filters: {
      unassigned: true,
      status: ['ACTIVE'],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  },
  {
    id: 'email-tickets',
    name: 'Email Tickets',
    description: 'All email support tickets',
    icon: '📧',
    filters: {
      channel: ['EMAIL'],
      status: ['ACTIVE'],
      sortBy: 'lastMessageAt',
      sortOrder: 'desc'
    }
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    description: 'High and urgent priority tickets',
    icon: '⚠️',
    filters: {
      priority: ['HIGH', 'URGENT'],
      status: ['ACTIVE'],
      sortBy: 'priority',
      sortOrder: 'desc'
    }
  },
  {
    id: 'resolved-recently',
    name: 'Recently Resolved',
    description: 'Tickets resolved in last 7 days',
    icon: '✅',
    filters: {
      status: ['RESOLVED'],
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      sortBy: 'lastMessageAt',
      sortOrder: 'desc'
    }
  }
]

/**
 * Get a preset by ID with user ID replacement
 */
export function getPreset(
  presetId: string,
  userId?: string
): TicketFilters | null {
  const preset = FILTER_PRESETS.find((p) => p.id === presetId)
  if (!preset) return null

  const filters = { ...preset.filters }

  // Replace 'current-user' placeholder with actual user ID
  if (userId && filters.assignedTo?.includes('current-user')) {
    filters.assignedTo = [userId]
  }

  return filters
}

/**
 * Get all presets for display
 */
export function getAllPresets(): FilterPreset[] {
  return FILTER_PRESETS
}

/**
 * Quick filter options for status
 */
export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-blue-500' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-500' }
] as const

/**
 * Quick filter options for priority
 */
export const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-600', icon: '🔴' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500', icon: '🟠' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500', icon: '🟡' },
  { value: 'LOW', label: 'Low', color: 'bg-gray-400', icon: '⚪' }
] as const

/**
 * Quick filter options for channel
 */
export const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: 'Email', icon: '📧' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'PHONE', label: 'Phone', icon: '📞' },
  { value: 'CHAT', label: 'Chat', icon: '💬' }
] as const

/**
 * Date range quick options
 */
export const DATE_RANGE_OPTIONS = [
  {
    value: 'today',
    label: 'Today',
    getRange: () => ({
      from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      to: new Date().toISOString()
    })
  },
  {
    value: 'yesterday',
    label: 'Yesterday',
    getRange: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        from: new Date(yesterday.setHours(0, 0, 0, 0)).toISOString(),
        to: new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
      }
    }
  },
  {
    value: 'last-7-days',
    label: 'Last 7 days',
    getRange: () => ({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    })
  },
  {
    value: 'last-30-days',
    label: 'Last 30 days',
    getRange: () => ({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString()
    })
  },
  {
    value: 'this-month',
    label: 'This month',
    getRange: () => ({
      from: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString(),
      to: new Date().toISOString()
    })
  },
  {
    value: 'last-month',
    label: 'Last month',
    getRange: () => {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return {
        from: new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1
        ).toISOString(),
        to: new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0
        ).toISOString()
      }
    }
  }
]
