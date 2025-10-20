/**
 * Ticket Filter System Types
 * Comprehensive type definitions for filtering support tickets
 */

export type ConversationStatus = 'ACTIVE' | 'RESOLVED' | 'CLOSED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type Channel = 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'CHAT'
export type SortField = 'createdAt' | 'lastMessageAt' | 'priority' | 'status' | 'subject'
export type SortOrder = 'asc' | 'desc'

/**
 * Main filter interface for support tickets
 */
export interface TicketFilters {
  // Search
  search?: string // Search in subject, customer name, email, ticket ID
  
  // Status & Priority
  status?: ConversationStatus[]
  priority?: Priority[]
  
  // Channel & Assignment
  channel?: Channel[]
  assignedTo?: string[] // User IDs
  unassigned?: boolean // Show only unassigned tickets
  
  // Customer Info
  customerEmail?: string
  customerName?: string
  
  // Time-based
  dateRange?: {
    from?: string // ISO date string
    to?: string // ISO date string
  }
  createdAfter?: string // ISO date string
  createdBefore?: string // ISO date string
  lastMessageAfter?: string // ISO date string
  lastMessageBefore?: string // ISO date string
  
  // Response Metrics
  hasUnreadMessages?: boolean // Show tickets with unread customer messages
  
  // Sorting
  sortBy?: SortField
  sortOrder?: SortOrder
}

/**
 * Filter result with pagination
 */
export interface FilterResult<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  appliedFilters: TicketFilters
}

/**
 * Saved filter for quick access
 */
export interface SavedFilter {
  id: string
  userId: string
  organizationId: string
  name: string
  description?: string
  filters: TicketFilters
  isDefault: boolean
  isShared: boolean
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Filter preset definition
 */
export interface FilterPreset {
  id: string
  name: string
  description: string
  icon?: string
  filters: TicketFilters
}

/**
 * Active filter chip for display
 */
export interface ActiveFilterChip {
  key: string
  label: string
  value: string
  onRemove: () => void
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 20
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: TicketFilters = {
  status: ['ACTIVE'],
  sortBy: 'lastMessageAt',
  sortOrder: 'desc'
}
