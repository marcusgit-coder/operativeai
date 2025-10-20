'use client'

/**
 * Ticket Filter Bar Component
 * Main filter interface with search and quick filters
 */

import { useState } from 'react'
import { Search, Filter, X, SlidersHorizontal, Save, Bookmark } from 'lucide-react'
import { TicketFilters } from '@/types/filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdvancedFilterModal } from './advanced-filter-modal'
import { SaveFilterModal } from './save-filter-modal'
import { SavedFiltersDropdown } from './saved-filters-dropdown'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CHANNEL_OPTIONS,
  FILTER_PRESETS
} from '@/lib/filters/filter-presets'

interface TicketFilterBarProps {
  filters: TicketFilters
  onFiltersChange: (filters: TicketFilters) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function TicketFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFilterCount
}: TicketFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false)
  const [refreshSavedFilters, setRefreshSavedFilters] = useState(0)

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Debounce the filter update
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined })
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  // Handle status filter toggle
  const toggleStatus = (status: string) => {
    const currentStatus = filters.status || []
    const newStatus = currentStatus.includes(status as any)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status as any]
    
    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined
    })
  }

  // Handle priority filter toggle
  const togglePriority = (priority: string) => {
    const currentPriority = filters.priority || []
    const newPriority = currentPriority.includes(priority as any)
      ? currentPriority.filter((p) => p !== priority)
      : [...currentPriority, priority as any]
    
    onFiltersChange({
      ...filters,
      priority: newPriority.length > 0 ? newPriority : undefined
    })
  }

  // Handle channel filter toggle
  const toggleChannel = (channel: string) => {
    const currentChannel = filters.channel || []
    const newChannel = currentChannel.includes(channel as any)
      ? currentChannel.filter((c) => c !== channel)
      : [...currentChannel, channel as any]
    
    onFiltersChange({
      ...filters,
      channel: newChannel.length > 0 ? newChannel : undefined
    })
  }

  // Toggle unassigned filter
  const toggleUnassigned = () => {
    onFiltersChange({
      ...filters,
      unassigned: !filters.unassigned
    })
  }

  // Toggle unread messages filter
  const toggleUnread = () => {
    onFiltersChange({
      ...filters,
      hasUnreadMessages: !filters.hasUnreadMessages
    })
  }

  // Handle filter saved
  const handleFilterSaved = () => {
    setRefreshSavedFilters(prev => prev + 1)
  }

  // Handle saved filter applied
  const handleApplySavedFilter = (savedFilters: TicketFilters) => {
    onFiltersChange(savedFilters)
  }

  return (
    <div className="space-y-4 pb-4 border-b">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tickets by subject, customer, email, or ID..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('')
                onFiltersChange({ ...filters, search: undefined })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filters */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Status:</span>
          {STATUS_OPTIONS.map((option) => {
            const isActive = filters.status?.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleStatus(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Priority:</span>
          {PRIORITY_OPTIONS.map((option) => {
            const isActive = filters.priority?.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => togglePriority(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            )
          })}
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Channel:</span>
          {CHANNEL_OPTIONS.map((option) => {
            const isActive = filters.channel?.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleChannel(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            )
          })}
        </div>

        {/* Quick Action Filters */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={toggleUnassigned}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.unassigned
                ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            📥 Unassigned
          </button>
          
          <button
            onClick={toggleUnread}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.hasUnreadMessages
                ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            📬 Unread
          </button>
        </div>
      </div>

      {/* Filter Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Quick filters:</span>
        {FILTER_PRESETS.slice(0, 6).map((preset) => (
          <button
            key={preset.id}
            onClick={() => onFiltersChange(preset.filters)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <span>{preset.icon}</span>
            {preset.name}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-2">
          {/* Saved Filters Dropdown */}
          <SavedFiltersDropdown
            onApplyFilter={handleApplySavedFilter}
            refreshTrigger={refreshSavedFilters}
          />
          
          {/* Save Current Filter Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveFilterModal(true)}
              className="flex items-center gap-1 whitespace-nowrap dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Save className="h-4 w-4" />
              Save Filter
            </Button>
          )}
          
          {/* Advanced Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(true)}
            className="flex items-center gap-1 whitespace-nowrap dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        open={showAdvancedFilters}
        onOpenChange={setShowAdvancedFilters}
        filters={filters}
        onApply={onFiltersChange}
      />
      
      {/* Save Filter Modal */}
      <SaveFilterModal
        open={showSaveFilterModal}
        onOpenChange={setShowSaveFilterModal}
        filters={filters}
        onSaved={handleFilterSaved}
      />
    </div>
  )
}
