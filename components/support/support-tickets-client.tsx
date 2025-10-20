'use client'

/**
 * Support Tickets Client Component
 * Handles filtering, pagination, and data fetching
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TicketFilters, DEFAULT_FILTERS } from '@/types/filters'
import { countActiveFilters } from '@/lib/filters/ticket-filter-service'
import { TicketFilterBar } from '@/components/support/filters/ticket-filter-bar'
import { ActiveFilterChips } from '@/components/support/filters/active-filter-chips'
import TicketList from '@/components/support/ticket-list'
import { Loader2 } from 'lucide-react'

interface SupportTicketsClientProps {
  initialTickets: any[]
  initialTotal: number
}

export function SupportTicketsClient({
  initialTickets,
  initialTotal
}: SupportTicketsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<TicketFilters>(() => {
    // Try to restore filters from URL
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      try {
        return JSON.parse(decodeURIComponent(filtersParam))
      } catch {
        return DEFAULT_FILTERS
      }
    }
    return DEFAULT_FILTERS
  })
  
  const [tickets, setTickets] = useState(initialTickets)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [defaultFilterLoaded, setDefaultFilterLoaded] = useState(false)

  // Load default filter on mount if no URL filters
  useEffect(() => {
    const loadDefaultFilter = async () => {
      const filtersParam = searchParams.get('filters')
      if (!filtersParam && !defaultFilterLoaded) {
        try {
          const response = await fetch('/api/filters?includeShared=false')
          if (response.ok) {
            const data = await response.json()
            const defaultFilter = data.filters?.find((f: any) => f.isDefault)
            if (defaultFilter) {
              const parsedFilters = JSON.parse(defaultFilter.filters)
              setFilters(parsedFilters)
              // Track usage
              await fetch(`/api/filters/${defaultFilter.id}`, {
                method: 'PATCH',
              })
            }
          }
        } catch (error) {
          console.error('Error loading default filter:', error)
        } finally {
          setDefaultFilterLoaded(true)
        }
      } else {
        setDefaultFilterLoaded(true)
      }
    }

    loadDefaultFilter()
  }, [searchParams, defaultFilterLoaded])

  // Fetch tickets when filters change
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      params.set('filters', encodeURIComponent(JSON.stringify(filters)))
      params.set('page', page.toString())
      params.set('limit', '20')
      
      const response = await fetch(`/api/support?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }
      
      const data = await response.json()
      setTickets(data.conversations)
      setTotal(data.pagination.total)
      
      // Update URL with current filters
      router.replace(`/support?filters=${encodeURIComponent(JSON.stringify(filters))}`)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, page, router])

  // Fetch tickets when filters or page changes
  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Handle filter changes
  const handleFiltersChange = (newFilters: TicketFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  // Remove specific filter
  const handleRemoveFilter = (key: keyof TicketFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
    setPage(1)
  }

  const activeFilterCount = countActiveFilters(filters)

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <TicketFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <ActiveFilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tickets...
            </span>
          ) : (
            <>
              Showing {tickets.length} of {total} tickets
              {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied)`}
            </>
          )}
        </p>

        {/* Sort Options */}
        <select
          value={`${filters.sortBy || 'lastMessageAt'}-${filters.sortOrder || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-')
            handleFiltersChange({
              ...filters,
              sortBy: sortBy as any,
              sortOrder: sortOrder as any
            })
          }}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
        >
          <option value="lastMessageAt-desc">Last Message (Newest)</option>
          <option value="lastMessageAt-asc">Last Message (Oldest)</option>
          <option value="createdAt-desc">Created (Newest)</option>
          <option value="createdAt-asc">Created (Oldest)</option>
          <option value="priority-desc">Priority (High to Low)</option>
          <option value="priority-asc">Priority (Low to High)</option>
          <option value="subject-asc">Subject (A-Z)</option>
          <option value="subject-desc">Subject (Z-A)</option>
        </select>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No tickets found matching your filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <TicketList tickets={tickets} />
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20) || loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
