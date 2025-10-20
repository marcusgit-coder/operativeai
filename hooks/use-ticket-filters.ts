"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  TicketFilters, 
  DEFAULT_FILTERS,
  TicketStatus,
  TicketPriority,
  TicketSource,
  DateRange
} from "@/types/ticket-filters"

/**
 * Custom hook for managing ticket filters
 * Syncs filters with URL search params for shareable filter states
 */
export function useTicketFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<TicketFilters>(() => {
    return {
      search: searchParams.get("search") || "",
      status: searchParams.getAll("status") as TicketStatus[] || [],
      priority: searchParams.getAll("priority") as TicketPriority[] || [],
      dateRange: {
        type: (searchParams.get("dateType") as any) || "created",
        from: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : null,
        to: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : null,
      },
      tags: searchParams.getAll("tags") || [],
      categories: searchParams.getAll("categories") || [],
      assignedTo: searchParams.getAll("assignedTo") || [],
      unassigned: searchParams.get("unassigned") === "true",
      myTickets: searchParams.get("myTickets") === "true",
      customerEmail: searchParams.get("customerEmail") || "",
      source: searchParams.getAll("source") as TicketSource[] || [],
      isArchived: searchParams.get("isArchived") === "true",
      overdue: searchParams.get("overdue") === "true",
      slaBreached: searchParams.get("slaBreached") === "true",
      hasUnread: searchParams.get("hasUnread") === "true",
    }
  })

  // Update URL params when filters change
  const updateURL = useCallback((newFilters: TicketFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set("search", newFilters.search)
    newFilters.status.forEach(s => params.append("status", s))
    newFilters.priority.forEach(p => params.append("priority", p))
    
    if (newFilters.dateRange.from) {
      params.set("dateType", newFilters.dateRange.type)
      params.set("dateFrom", newFilters.dateRange.from.toISOString())
    }
    if (newFilters.dateRange.to) {
      params.set("dateTo", newFilters.dateRange.to.toISOString())
    }
    
    newFilters.tags.forEach(t => params.append("tags", t))
    newFilters.categories.forEach(c => params.append("categories", c))
    newFilters.assignedTo.forEach(a => params.append("assignedTo", a))
    
    if (newFilters.unassigned) params.set("unassigned", "true")
    if (newFilters.myTickets) params.set("myTickets", "true")
    if (newFilters.customerEmail) params.set("customerEmail", newFilters.customerEmail)
    
    newFilters.source.forEach(s => params.append("source", s))
    
    if (newFilters.isArchived) params.set("isArchived", "true")
    if (newFilters.overdue) params.set("overdue", "true")
    if (newFilters.slaBreached) params.set("slaBreached", "true")
    if (newFilters.hasUnread) params.set("hasUnread", "true")
    
    router.push(`/support?${params.toString()}`, { scroll: false })
  }, [router])

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof TicketFilters>(
    key: K,
    value: TicketFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Toggle a value in an array filter
  const toggleArrayFilter = useCallback(<K extends keyof Pick<TicketFilters, "status" | "priority" | "tags" | "categories" | "assignedTo" | "source">>(
    key: K,
    value: string
  ) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v: string) => v !== value)
      : [...currentArray, value]
    
    updateFilter(key, newArray as any)
  }, [filters, updateFilter])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    router.push("/support", { scroll: false })
  }, [router])

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof TicketFilters) => {
    if (Array.isArray(DEFAULT_FILTERS[key])) {
      updateFilter(key, [] as any)
    } else if (typeof DEFAULT_FILTERS[key] === "boolean") {
      updateFilter(key, false as any)
    } else if (typeof DEFAULT_FILTERS[key] === "object") {
      updateFilter(key, DEFAULT_FILTERS[key] as any)
    } else {
      updateFilter(key, "" as any)
    }
  }, [updateFilter])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.tags.length > 0) count++
    if (filters.categories.length > 0) count++
    if (filters.assignedTo.length > 0) count++
    if (filters.unassigned) count++
    if (filters.myTickets) count++
    if (filters.customerEmail) count++
    if (filters.source.length > 0) count++
    if (filters.isArchived) count++
    if (filters.overdue) count++
    if (filters.slaBreached) count++
    if (filters.hasUnread) count++
    return count
  }, [filters])

  // Build API query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set("search", filters.search)
    filters.status.forEach(s => params.append("status", s))
    filters.priority.forEach(p => params.append("priority", p))
    
    if (filters.dateRange.from) {
      params.set("dateType", filters.dateRange.type)
      params.set("dateFrom", filters.dateRange.from.toISOString())
    }
    if (filters.dateRange.to) {
      params.set("dateTo", filters.dateRange.to.toISOString())
    }
    
    filters.tags.forEach(t => params.append("tags", t))
    filters.categories.forEach(c => params.append("categories", c))
    filters.assignedTo.forEach(a => params.append("assignedTo", a))
    
    if (filters.unassigned) params.set("unassigned", "true")
    if (filters.myTickets) params.set("myTickets", "true")
    if (filters.customerEmail) params.set("customerEmail", filters.customerEmail)
    
    filters.source.forEach(s => params.append("source", s))
    
    if (filters.isArchived) params.set("isArchived", "true")
    if (filters.overdue) params.set("overdue", "true")
    if (filters.slaBreached) params.set("slaBreached", "true")
    if (filters.hasUnread) params.set("hasUnread", "true")
    
    return params.toString()
  }, [filters])

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    clearFilter,
    activeFilterCount,
    queryString,
  }
}
