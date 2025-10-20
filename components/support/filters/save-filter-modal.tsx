'use client'

/**
 * Save Filter Modal Component
 * Modal for saving current filter configuration
 */

import { useState } from 'react'
import { Loader2, Save, AlertCircle } from 'lucide-react'
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
import { TicketFilters } from '@/types/filters'

interface SaveFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: TicketFilters
  onSaved?: () => void
}

export function SaveFilterModal({
  open,
  onOpenChange,
  filters,
  onSaved
}: SaveFilterModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the filter')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          filters: JSON.stringify(filters),
          isDefault,
          isShared,
          isPinned,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save filter')
      }

      // Success - reset form and close
      setName('')
      setDescription('')
      setIsDefault(false)
      setIsShared(false)
      setIsPinned(false)
      onOpenChange(false)
      
      // Notify parent component
      if (onSaved) {
        onSaved()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save filter')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    setIsDefault(false)
    setIsShared(false)
    setIsPinned(false)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Filter
          </DialogTitle>
          <DialogDescription>
            Save your current filter configuration for quick access later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., High Priority Open Tickets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add a description to help you remember what this filter is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2 border-t dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            
            {/* Set as Default */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Set as default filter
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This filter will be automatically applied when you visit the support page
                </p>
              </div>
            </div>

            {/* Pin to Top */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="isPinned" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Pin to top
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pinned filters appear at the top of your saved filters list
                </p>
              </div>
            </div>

            {/* Share with Organization */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isShared"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="isShared" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Share with organization
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Other team members will be able to use this filter
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Filter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
