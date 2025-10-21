'use client'

/**
 * Bulk Action Modal Component
 * Confirmation and configuration modal for bulk actions
 */

import { useState } from 'react'
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAssignmentDropdown } from './user-assignment-dropdown'

interface BulkActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'status' | 'priority' | 'assign' | 'tag' | 'archive' | 'delete'
  actionLabel: string
  selectedCount: number
  selectedIds: string[]
  organizationId: string
  onSuccess: () => void
  onCancel: () => void
}

export function BulkActionModal({
  open,
  onOpenChange,
  action,
  actionLabel,
  selectedCount,
  selectedIds,
  organizationId,
  onSuccess,
  onCancel,
}: BulkActionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Action-specific state
  const [statusValue, setStatusValue] = useState('RESOLVED')
  const [priorityValue, setPriorityValue] = useState('HIGH')
  const [assignToValue, setAssignToValue] = useState('')
  const [tagsToAdd, setTagsToAdd] = useState('')
  const [tagsToRemove, setTagsToRemove] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let value: any

      switch (action) {
        case 'status':
          value = statusValue
          break
        case 'priority':
          value = priorityValue
          break
        case 'assign':
          value = assignToValue || null
          break
        case 'tag':
          value = {
            add: tagsToAdd ? tagsToAdd.split(',').map(t => t.trim()).filter(Boolean) : [],
            remove: tagsToRemove ? tagsToRemove.split(',').map(t => t.trim()).filter(Boolean) : [],
          }
          break
        case 'archive':
          value = true
          break
        case 'delete':
          value = true
          break
      }

      const response = await fetch('/api/support/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ticketIds: selectedIds,
          value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to perform bulk action')
      }

      const result = await response.json()
      setSuccess(result.message)

      // Close modal after brief delay
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk action')
    } finally {
      setLoading(false)
    }
  }

  const renderActionForm = () => {
    switch (action) {
      case 'status':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Status
            </label>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_CUSTOMER">Waiting for Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        )

      case 'priority':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Priority
            </label>
            <select
              value={priorityValue}
              onChange={(e) => setPriorityValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="CRITICAL">⚫ Critical</option>
            </select>
          </div>
        )

      case 'assign':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assign To
            </label>
            <UserAssignmentDropdown
              currentAssignee={assignToValue || null}
              onAssign={(userId) => setAssignToValue(userId || '')}
              organizationId={organizationId}
              variant="default"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select a user to assign {selectedCount} ticket{selectedCount !== 1 ? 's' : ''}, or clear to unassign
            </p>
          </div>
        )

      case 'tag':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add Tags (comma-separated)
              </label>
              <Input
                type="text"
                placeholder="e.g., billing, urgent, vip"
                value={tagsToAdd}
                onChange={(e) => setTagsToAdd(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remove Tags (comma-separated)
              </label>
              <Input
                type="text"
                placeholder="e.g., spam, outdated"
                value={tagsToRemove}
                onChange={(e) => setTagsToRemove(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )

      case 'archive':
        return (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Archive {selectedCount} ticket{selectedCount !== 1 ? 's' : ''}?
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Archived tickets will be hidden from the main view but can be restored later.
              </p>
            </div>
          </div>
        )

      case 'delete':
        return (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Delete {selectedCount} ticket{selectedCount !== 1 ? 's' : ''}?
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This will archive the selected tickets. You can unarchive them later from the archived tickets view.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            This action will affect {selectedCount} ticket{selectedCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {renderActionForm()}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading || !!success}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !!success}
            className={
              action === 'delete'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : ''
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done!
              </>
            ) : (
              `Confirm ${action === 'delete' ? 'Delete' : action === 'archive' ? 'Archive' : 'Update'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
