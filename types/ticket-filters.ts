/**
 * Ticket Filter Types
 * Comprehensive filtering system for support tickets
 */

export type TicketStatus = 
  | "ACTIVE" 
  | "IN_PROGRESS" 
  | "WAITING_CUSTOMER" 
  | "RESOLVED" 
  | "CLOSED"

export type TicketPriority = 
  | "LOW" 
  | "MEDIUM" 
  | "HIGH" 
  | "URGENT" 
  | "CRITICAL"

export type TicketSource = 
  | "EMAIL" 
  | "MANUAL" 
  | "CHAT" 
  | "API" 
  | "PHONE"

export type DateRangeType = 
  | "created" 
  | "updated" 
  | "resolved" 
  | "due"

export type DatePreset = 
  | "today" 
  | "yesterday" 
  | "last7days" 
  | "last30days" 
  | "thisMonth" 
  | "lastMonth" 
  | "custom"

export interface DateRange {
  type: DateRangeType
  from: Date | null
  to: Date | null
  preset?: DatePreset
}

export interface TicketFilters {
  // Search
  search: string
  
  // Status & Priority
  status: TicketStatus[]
  priority: TicketPriority[]
  
  // Date Ranges
  dateRange: DateRange
  
  // Tags & Categories
  tags: string[]
  categories: string[]
  
  // Assignment
  assignedTo: string[]
  unassigned: boolean
  myTickets: boolean  // Current user's assigned tickets
  
  // Customer
  customerEmail: string
  
  // Source
  source: TicketSource[]
  
  // Advanced
  isArchived: boolean
  overdue: boolean
  slaBreached: boolean
  hasUnread: boolean
}

export interface TicketFilterOption {
  label: string
  value: string
  count?: number
  icon?: string
}

export interface SavedFilter {
  id: string
  userId: string
  name: string
  filters: Partial<TicketFilters>
  isDefault: boolean
  createdAt: Date
}

export interface FilterStats {
  total: number
  urgent: number
  overdue: number
  unassigned: number
  myTickets: number
}

// Default empty filters
export const DEFAULT_FILTERS: TicketFilters = {
  search: "",
  status: [],
  priority: [],
  dateRange: {
    type: "created",
    from: null,
    to: null,
    preset: "custom"
  },
  tags: [],
  categories: [],
  assignedTo: [],
  unassigned: false,
  myTickets: false,
  customerEmail: "",
  source: [],
  isArchived: false,
  overdue: false,
  slaBreached: false,
  hasUnread: false,
}

// Status options
export const STATUS_OPTIONS: TicketFilterOption[] = [
  { label: "Active", value: "ACTIVE", icon: "🟢" },
  { label: "In Progress", value: "IN_PROGRESS", icon: "🔵" },
  { label: "Waiting Customer", value: "WAITING_CUSTOMER", icon: "⏳" },
  { label: "Resolved", value: "RESOLVED", icon: "✅" },
  { label: "Closed", value: "CLOSED", icon: "🔒" },
]

// Priority options
export const PRIORITY_OPTIONS: TicketFilterOption[] = [
  { label: "Critical", value: "CRITICAL", icon: "🔴" },
  { label: "Urgent", value: "URGENT", icon: "🟠" },
  { label: "High", value: "HIGH", icon: "🟡" },
  { label: "Medium", value: "MEDIUM", icon: "🔵" },
  { label: "Low", value: "LOW", icon: "⚪" },
]

// Source options
export const SOURCE_OPTIONS: TicketFilterOption[] = [
  { label: "Email", value: "EMAIL", icon: "📧" },
  { label: "Manual", value: "MANUAL", icon: "✏️" },
  { label: "Chat", value: "CHAT", icon: "💬" },
  { label: "API", value: "API", icon: "🔌" },
  { label: "Phone", value: "PHONE", icon: "📞" },
]

// Category options (can be customized per organization)
export const DEFAULT_CATEGORIES = [
  "Technical Support",
  "Billing & Payments",
  "General Inquiry",
  "Feature Request",
  "Bug Report",
  "Account Management",
  "Sales",
  "Other",
]
