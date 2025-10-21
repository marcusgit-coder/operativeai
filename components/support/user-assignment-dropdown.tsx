'use client'

/**
 * User Assignment Dropdown Component
 * Advanced user selection with search, team filtering, and load balancing
 */

import { useState, useEffect, useMemo } from 'react'
import { Search, User, Users, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  avatar?: string
  activeTickets?: number
  avgResponseTime?: number
  isOnline?: boolean
  team?: string
}

interface UserAssignmentDropdownProps {
  currentAssignee?: string | null
  onAssign: (userId: string | null) => void
  organizationId: string
  ticketId?: string
  variant?: 'default' | 'compact'
}

export function UserAssignmentDropdown({
  currentAssignee,
  onAssign,
  organizationId,
  ticketId,
  variant = 'default'
}: UserAssignmentDropdownProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'workload' | 'response-time'>('workload')

  // Fetch users and their workload
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open, organizationId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users?organizationId=${organizationId}&includeStats=true`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique teams
  const teams = useMemo(() => {
    const teamSet = new Set(users.map(u => u.team).filter(Boolean))
    return ['all', ...Array.from(teamSet)]
  }, [users])

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        u =>
          u.name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.team?.toLowerCase().includes(query)
      )
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(u => u.team === selectedTeam)
    }

    // Sort users
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || a.email).localeCompare(b.name || b.email)
        case 'workload':
          return (a.activeTickets || 0) - (b.activeTickets || 0)
        case 'response-time':
          return (a.avgResponseTime || 0) - (b.avgResponseTime || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [users, searchQuery, selectedTeam, sortBy])

  // Get current assignee info
  const currentUser = users.find(u => u.id === currentAssignee)

  // Calculate load balancing recommendation
  const recommendedUser = useMemo(() => {
    if (filteredUsers.length === 0) return null
    // Find user with lowest workload
    return filteredUsers.reduce((best, current) => {
      const currentLoad = current.activeTickets || 0
      const bestLoad = best.activeTickets || 0
      return currentLoad < bestLoad ? current : best
    }, filteredUsers[0])
  }, [filteredUsers])

  const handleAssign = async (userId: string | null) => {
    onAssign(userId)
    setOpen(false)
  }

  const getWorkloadColor = (activeTickets: number = 0) => {
    if (activeTickets === 0) return 'text-green-600 dark:text-green-400'
    if (activeTickets <= 5) return 'text-blue-600 dark:text-blue-400'
    if (activeTickets <= 10) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getWorkloadLabel = (activeTickets: number = 0) => {
    if (activeTickets === 0) return 'Available'
    if (activeTickets <= 5) return 'Light'
    if (activeTickets <= 10) return 'Moderate'
    return 'Heavy'
  }

  const renderDropdownContent = () => (
    <>
      <DropdownMenuLabel className="flex items-center justify-between">
        <span>Assign To</span>
        {recommendedUser && (
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Team Filter */}
      {teams.length > 1 && (
        <div className="px-2 pb-2">
          <div className="flex gap-1 flex-wrap">
            {teams.map(team => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team || 'all')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedTeam === team
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {team === 'all' ? 'All Teams' : team}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="px-2 pb-2">
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('workload')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              sortBy === 'workload'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            By Workload
          </button>
          <button
            onClick={() => setSortBy('response-time')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              sortBy === 'response-time'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            By Speed
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            By Name
          </button>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Unassign Option */}
      <DropdownMenuItem
        onClick={() => handleAssign(null)}
        className="cursor-pointer"
      >
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Unassign</p>
            <p className="text-xs text-gray-500">Remove assignee</p>
          </div>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* User List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            No users found
          </div>
        ) : (
          filteredUsers.map(user => {
            const isRecommended = recommendedUser?.id === user.id
            const isCurrentAssignee = currentAssignee === user.id

            return (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleAssign(user.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </p>
                      {isCurrentAssignee && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {isRecommended && !isCurrentAssignee && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Best
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {user.team && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {user.team}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        •
                      </span>
                      <span className={`font-medium ${getWorkloadColor(user.activeTickets)}`}>
                        {user.activeTickets || 0} tickets
                      </span>
                      {user.avgResponseTime && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(user.avgResponseTime / 60)}m avg
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Workload Indicator */}
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getWorkloadColor(user.activeTickets)}`}
                    >
                      {getWorkloadLabel(user.activeTickets)}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })
        )}
      </div>
    </>
  )

  if (variant === 'compact') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <User className="h-4 w-4 mr-1" />
            {currentUser ? (
              <span className="max-w-[120px] truncate">
                {currentUser.name || currentUser.email}
              </span>
            ) : (
              <span className="text-gray-500">Unassigned</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {renderDropdownContent()}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <User className="h-4 w-4 mr-2" />
          {currentUser ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="truncate">{currentUser.name || currentUser.email}</span>
              <Badge variant="secondary" className="text-xs">
                {currentUser.activeTickets || 0} tickets
              </Badge>
            </div>
          ) : (
            <span className="text-gray-500">Select assignee...</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96">
        {renderDropdownContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
