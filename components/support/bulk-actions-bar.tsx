'use client'

/**
 * Bulk Actions Bar Component
 * Shows when tickets are selected and provides bulk action options
 */

import { useState } from 'react'
import { Check, X, Archive, Trash2, Tag, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulkActionModal } from './bulk-action-modal'

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsBarProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState<{
    type: 'status' | 'priority' | 'assign' | 'tag' | 'archive' | 'delete'
    label: string
  } | null>(null)

  if (selectedCount === 0) {
    return null
  }

  const handleAction = (
    type: 'status' | 'priority' | 'assign' | 'tag' | 'archive' | 'delete',
    label: string
  ) => {
    setSelectedAction({ type, label })
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedAction(null)
  }

  const handleActionSuccess = () => {
    handleModalClose()
    onClearSelection()
    onActionComplete()
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-semibold">
                {selectedCount}
              </div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCount} ticket{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            <button
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Clear selection
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {/* Status Actions */}
            <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-1">
                Status:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('status', 'Mark as In Progress')}
                className="h-7 px-2 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
              >
                <span className="mr-1">🔄</span>
                In Progress
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('status', 'Mark as Resolved')}
                className="h-7 px-2 text-xs hover:bg-green-100 dark:hover:bg-green-900/20"
              >
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('status', 'Mark as Closed')}
                className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Close
              </Button>
            </div>

            {/* Priority Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('priority', 'Change Priority')}
              className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <AlertCircle className="h-4 w-4" />
              Priority
            </Button>

            {/* Assignment */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('assign', 'Assign To')}
              className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <User className="h-4 w-4" />
              Assign
            </Button>

            {/* Tags */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('tag', 'Manage Tags')}
              className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <Tag className="h-4 w-4" />
              Tags
            </Button>

            {/* Archive */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('archive', 'Archive Tickets')}
              className="flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('delete', 'Delete Tickets')}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:bg-gray-800 dark:border-gray-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Action Modal */}
      {selectedAction && (
        <BulkActionModal
          open={showModal}
          onOpenChange={setShowModal}
          action={selectedAction.type}
          actionLabel={selectedAction.label}
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          onSuccess={handleActionSuccess}
          onCancel={handleModalClose}
        />
      )}
    </>
  )
}
