'use client'

/**
 * Advanced Filter Modal Component
 * Complex multi-criteria filtering interface
 */

import { useState } from 'react'
import { X, Filter, Calendar } from 'lucide-react'
import { TicketFilters } from '@/types/filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DateRangePicker } from './date-range-picker'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CHANNEL_OPTIONS
} from '@/lib/filters/filter-presets'

interface AdvancedFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: TicketFilters
  onApply: (filters: TicketFilters) => void
}

export function AdvancedFilterModal({
  open,
  onOpenChange,
  filters,
  onApply
}: AdvancedFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<TicketFilters>(filters)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleApply = () => {
    onApply(localFilters)
    onOpenChange(false)
  }

  const handleReset = () => {
    setLocalFilters({})
    setShowDatePicker(false)
  }

  const handleStatusToggle = (status: string) => {
    const currentStatus = localFilters.status || []
    const newStatus = currentStatus.includes(status as any)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status as any]
    
    setLocalFilters({
      ...localFilters,
      status: newStatus.length > 0 ? newStatus : undefined
    })
  }

  const handlePriorityToggle = (priority: string) => {
    const currentPriority = localFilters.priority || []
    const newPriority = currentPriority.includes(priority as any)
      ? currentPriority.filter((p) => p !== priority)
      : [...currentPriority, priority as any]
    
    setLocalFilters({
      ...localFilters,
      priority: newPriority.length > 0 ? newPriority : undefined
    })
  }

  const handleChannelToggle = (channel: string) => {
    const currentChannel = localFilters.channel || []
    const newChannel = currentChannel.includes(channel as any)
      ? currentChannel.filter((c) => c !== channel)
      : [...currentChannel, channel as any]
    
    setLocalFilters({
      ...localFilters,
      channel: newChannel.length > 0 ? newChannel : undefined
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl dark:text-gray-100">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Apply complex filters to find exactly the tickets you need
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium dark:text-gray-200">
              Search
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by subject, customer, email, or ticket ID..."
              value={localFilters.search || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, search: e.target.value || undefined })
              }
              className="dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Status Filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200">Status</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = localFilters.status?.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusToggle(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const isActive = localFilters.priority?.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handlePriorityToggle(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Channel Filters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200">Channel</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((option) => {
                const isActive = localFilters.channel?.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleChannelToggle(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Customer Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="text-sm font-medium dark:text-gray-200">
                Customer Email
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                value={localFilters.customerEmail || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, customerEmail: e.target.value || undefined })
                }
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium dark:text-gray-200">
                Customer Name
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="John Doe"
                value={localFilters.customerName || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, customerName: e.target.value || undefined })
                }
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200">Date Range</Label>
            <div className="space-y-2">
              {!showDatePicker && (
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {localFilters.dateRange?.from ? (
                    <>
                      {new Date(localFilters.dateRange.from).toLocaleDateString()} -{' '}
                      {localFilters.dateRange.to
                        ? new Date(localFilters.dateRange.to).toLocaleDateString()
                        : '...'}
                    </>
                  ) : (
                    'Select date range'
                  )}
                </Button>
              )}
              {showDatePicker && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <DateRangePicker
                    value={
                      localFilters.dateRange?.from
                        ? {
                            from: new Date(localFilters.dateRange.from),
                            to: localFilters.dateRange.to ? new Date(localFilters.dateRange.to) : undefined
                          }
                        : undefined
                    }
                    onChange={(range) => {
                      setLocalFilters({
                        ...localFilters,
                        dateRange: range
                          ? {
                              from: range.from?.toISOString(),
                              to: range.to?.toISOString()
                            }
                          : undefined
                      })
                      setShowDatePicker(false)
                    }}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-200">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setLocalFilters({ ...localFilters, unassigned: !localFilters.unassigned })
                }
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  localFilters.unassigned
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                📥 Unassigned Only
              </button>

              <button
                onClick={() =>
                  setLocalFilters({
                    ...localFilters,
                    hasUnreadMessages: !localFilters.hasUnreadMessages
                  })
                }
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  localFilters.hasUnreadMessages
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                📬 Has Unread Messages
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
              Reset All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button onClick={handleApply} className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
