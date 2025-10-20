"use client"

import { useState } from "react"
import { Filter, X, Search, Calendar, Tag, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTicketFilters } from "@/hooks/use-ticket-filters"
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  DEFAULT_CATEGORIES,
} from "@/types/ticket-filters"

interface TicketFiltersProps {
  ticketCounts?: {
    total: number
    urgent: number
    overdue: number
    unassigned: number
    myTickets: number
  }
  availableTags?: string[]
  availableUsers?: Array<{ id: string; name: string }>
}

export function TicketFiltersBar({
  ticketCounts,
  availableTags = [],
  availableUsers = [],
}: TicketFiltersProps) {
  const {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilters,
    clearFilter,
    activeFilterCount,
  } = useTicketFilters()

  const [searchValue, setSearchValue] = useState(filters.search)

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Debounce search
    const timeout = setTimeout(() => {
      updateFilter("search", value)
    }, 300)
    return () => clearTimeout(timeout)
  }

  return (
    <div className="space-y-4">
      {/* Quick Filters Row */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filters.priority.includes("URGENT") || filters.priority.includes("CRITICAL") ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (filters.priority.includes("URGENT") || filters.priority.includes("CRITICAL")) {
              updateFilter("priority", [])
            } else {
              updateFilter("priority", ["URGENT", "CRITICAL"])
            }
          }}
        >
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Urgent
          {ticketCounts && <Badge variant="secondary" className="ml-2">{ticketCounts.urgent}</Badge>}
        </Button>

        <Button
          variant={filters.overdue ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter("overdue", !filters.overdue)}
        >
          ⏰ Overdue
          {ticketCounts && <Badge variant="secondary" className="ml-2">{ticketCounts.overdue}</Badge>}
        </Button>

        <Button
          variant={filters.myTickets ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter("myTickets", !filters.myTickets)}
        >
          👤 My Tickets
          {ticketCounts && <Badge variant="secondary" className="ml-2">{ticketCounts.myTickets}</Badge>}
        </Button>

        <Button
          variant={filters.unassigned ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter("unassigned", !filters.unassigned)}
        >
          📋 Unassigned
          {ticketCounts && <Badge variant="secondary" className="ml-2">{ticketCounts.unassigned}</Badge>}
        </Button>
      </div>

      {/* Main Filter Bar */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Search */}
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Status
              {filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-2">{filters.status.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Select Status</p>
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    filters.status.includes(option.value as any) ? "bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                  onClick={() => toggleArrayFilter("status", option.value)}
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value as any)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm flex-1">{option.label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Priority
              {filters.priority.length > 0 && (
                <Badge variant="secondary" className="ml-2">{filters.priority.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Select Priority</p>
              {PRIORITY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    filters.priority.includes(option.value as any) ? "bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                  onClick={() => toggleArrayFilter("priority", option.value)}
                >
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(option.value as any)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm flex-1">{option.label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filters.tags.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">Select Tags</p>
                {availableTags.map((tag) => (
                  <div
                    key={tag}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      filters.tags.includes(tag) ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                    onClick={() => toggleArrayFilter("tags", tag)}
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <span className="text-sm flex-1">{tag}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* More Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
              {activeFilterCount > 4 && (
                <Badge variant="secondary" className="ml-2">{activeFilterCount - 4}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={filters.categories[0] || ""}
                  onValueChange={(value) => updateFilter("categories", value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select
                  value={filters.source[0] || ""}
                  onValueChange={(value) => updateFilter("source", value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    {SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.icon} {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasUnread}
                    onChange={(e) => updateFilter("hasUnread", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Has unread messages</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.slaBreached}
                    onChange={(e) => updateFilter("slaBreached", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">SLA breached</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isArchived}
                    onChange={(e) => updateFilter("isArchived", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show archived</span>
                </label>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find(o => o.value === status)?.icon} {status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter("status", status)}
              />
            </Badge>
          ))}
          {filters.priority.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {PRIORITY_OPTIONS.find(o => o.value === priority)?.icon} {priority}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter("priority", priority)}
              />
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              🏷️ {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter("tags", tag)}
              />
            </Badge>
          ))}
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              📁 {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter("categories", category)}
              />
            </Badge>
          ))}
          {filters.overdue && (
            <Badge variant="secondary" className="gap-1">
              ⏰ Overdue
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("overdue", false)} />
            </Badge>
          )}
          {filters.myTickets && (
            <Badge variant="secondary" className="gap-1">
              👤 My Tickets
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("myTickets", false)} />
            </Badge>
          )}
          {filters.unassigned && (
            <Badge variant="secondary" className="gap-1">
              📋 Unassigned
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("unassigned", false)} />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
