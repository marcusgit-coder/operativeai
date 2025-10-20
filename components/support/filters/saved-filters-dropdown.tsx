'use client'

/**
 * Saved Filters Dropdown Component
 * Display and apply saved filters
 */

import { useState, useEffect } from 'react'
import { Star, Trash2, Edit, Share2, Pin, Clock } from 'lucide-react'
import { TicketFilters } from '@/types/filters'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SavedFilter {
  id: string
  name: string
  description?: string
  filters: string
  isDefault: boolean
  isShared: boolean
  isPinned: boolean
  usageCount: number
  lastUsedAt?: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface SavedFiltersDropdownProps {
  onApplyFilter: (filters: TicketFilters, filterId?: string) => void
  onEditFilter?: (filter: SavedFilter) => void
  onDeleteFilter?: (filterId: string) => void
  refreshTrigger?: number
}

export function SavedFiltersDropdown({
  onApplyFilter,
  onEditFilter,
  onDeleteFilter,
  refreshTrigger
}: SavedFiltersDropdownProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Fetch saved filters
  useEffect(() => {
    if (open) {
      fetchSavedFilters()
    }
  }, [open])
  
  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchSavedFilters()
    }
  }, [refreshTrigger])

  const fetchSavedFilters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/filters?includeShared=true')
      if (response.ok) {
        const data = await response.json()
        setSavedFilters(data.filters || [])
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = async (filter: SavedFilter) => {
    try {
      const parsedFilters = JSON.parse(filter.filters)
      onApplyFilter(parsedFilters, filter.id)
      
      // Track usage
      await fetch(`/api/filters/${filter.id}`, {
        method: 'PATCH'
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Error applying filter:', error)
    }
  }

  const handleDelete = async (filterId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this filter?')) {
      return
    }

    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSavedFilters(savedFilters.filter(f => f.id !== filterId))
        onDeleteFilter?.(filterId)
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
    }
  }

  // Separate pinned and regular filters
  const pinnedFilters = savedFilters.filter(f => f.isPinned)
  const regularFilters = savedFilters.filter(f => !f.isPinned)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <Star className="h-4 w-4" />
          Saved Filters
          {savedFilters.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
              {savedFilters.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto dark:bg-gray-900 dark:border-gray-800"
      >
        <DropdownMenuLabel className="dark:text-gray-200">Saved Filters</DropdownMenuLabel>
        <DropdownMenuSeparator className="dark:bg-gray-800" />

        {loading ? (
          <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading filters...
          </div>
        ) : savedFilters.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No saved filters yet
          </div>
        ) : (
          <>
            {/* Pinned Filters */}
            {pinnedFilters.length > 0 && (
              <>
                {pinnedFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    onClick={() => handleApplyFilter(filter)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-sm dark:text-gray-200">
                          {filter.name}
                        </span>
                        {filter.isDefault && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                        {filter.isShared && (
                          <Share2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {onEditFilter && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditFilter(filter)
                              setOpen(false)
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Edit className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(filter.id, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {filter.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {filter.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Used {filter.usageCount} times
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="dark:bg-gray-800" />
              </>
            )}

            {/* Regular Filters */}
            {regularFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleApplyFilter(filter)}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer dark:hover:bg-gray-800 dark:focus:bg-gray-800"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm dark:text-gray-200">
                      {filter.name}
                    </span>
                    {filter.isDefault && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                    {filter.isShared && (
                      <Share2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditFilter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditFilter(filter)
                          setOpen(false)
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(filter.id, e)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
                {filter.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {filter.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Used {filter.usageCount} times
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
