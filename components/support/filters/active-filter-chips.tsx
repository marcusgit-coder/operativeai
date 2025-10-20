'use client'

/**
 * Active Filter Chips Component
 * Displays currently applied filters as removable chips
 */

import { X } from 'lucide-react'
import { TicketFilters } from '@/types/filters'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CHANNEL_OPTIONS
} from '@/lib/filters/filter-presets'
import { format } from 'date-fns'

interface ActiveFilterChipsProps {
  filters: TicketFilters
  onRemoveFilter: (key: keyof TicketFilters, value?: any) => void
  onClearAll: () => void
}

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll
}: ActiveFilterChipsProps) {
  const chips: Array<{
    key: keyof TicketFilters
    label: string
    value?: any
  }> = []

  // Search chip
  if (filters.search) {
    chips.push({
      key: 'search',
      label: `Search: "${filters.search}"`
    })
  }

  // Status chips
  if (filters.status && filters.status.length > 0) {
    const statusLabels = filters.status
      .map((s) => STATUS_OPTIONS.find((o) => o.value === s)?.label)
      .filter(Boolean)
      .join(', ')
    chips.push({
      key: 'status',
      label: `Status: ${statusLabels}`
    })
  }

  // Priority chips
  if (filters.priority && filters.priority.length > 0) {
    const priorityLabels = filters.priority
      .map((p) => PRIORITY_OPTIONS.find((o) => o.value === p)?.label)
      .filter(Boolean)
      .join(', ')
    chips.push({
      key: 'priority',
      label: `Priority: ${priorityLabels}`
    })
  }

  // Channel chips
  if (filters.channel && filters.channel.length > 0) {
    const channelLabels = filters.channel
      .map((c) => CHANNEL_OPTIONS.find((o) => o.value === c)?.label)
      .filter(Boolean)
      .join(', ')
    chips.push({
      key: 'channel',
      label: `Channel: ${channelLabels}`
    })
  }

  // Unassigned chip
  if (filters.unassigned) {
    chips.push({
      key: 'unassigned',
      label: 'Unassigned only'
    })
  }

  // Unread messages chip
  if (filters.hasUnreadMessages) {
    chips.push({
      key: 'hasUnreadMessages',
      label: 'Has unread messages'
    })
  }

  // Customer email chip
  if (filters.customerEmail) {
    chips.push({
      key: 'customerEmail',
      label: `Customer: ${filters.customerEmail}`
    })
  }

  // Customer name chip
  if (filters.customerName) {
    chips.push({
      key: 'customerName',
      label: `Name: ${filters.customerName}`
    })
  }

  // Date range chip
  if (filters.dateRange?.from || filters.dateRange?.to) {
    const from = filters.dateRange.from
      ? format(new Date(filters.dateRange.from), 'MMM d, yyyy')
      : '...'
    const to = filters.dateRange.to
      ? format(new Date(filters.dateRange.to), 'MMM d, yyyy')
      : '...'
    chips.push({
      key: 'dateRange',
      label: `Date: ${from} - ${to}`
    })
  }

  // If no active filters, return null
  if (chips.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap py-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
      
      {chips.map((chip, index) => (
        <div
          key={`${chip.key}-${index}`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className="hover:bg-blue-100 rounded-full p-0.5 transition-colors dark:hover:bg-blue-800/50"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 underline ml-2 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
