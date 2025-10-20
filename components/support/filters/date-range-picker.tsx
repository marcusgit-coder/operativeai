'use client'

/**
 * Date Range Picker Component
 * Calendar UI for selecting date ranges with quick presets
 */

import { useState } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  onClose?: () => void
}

// Quick date range presets
const DATE_PRESETS = [
  {
    label: 'Today',
    getValue: () => ({
      from: new Date(),
      to: new Date()
    })
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        from: yesterday,
        to: yesterday
      }
    }
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date()
    })
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date()
    })
  },
  {
    label: 'This month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      }
    }
  },
  {
    label: 'This year',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date()
    })
  }
]

export function DateRangePicker({ value, onChange, onClose }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(value)

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
  }

  const handleApply = () => {
    onChange(selectedRange)
    onClose?.()
  }

  const handleClear = () => {
    setSelectedRange(undefined)
    onChange(undefined)
    onClose?.()
  }

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getValue()
    setSelectedRange(range)
  }

  return (
    <Card className="w-auto dark:bg-gray-900 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Quick Presets */}
          <div className="flex flex-col gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Quick Select
            </h3>
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Custom Range
            </h3>
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              className="date-range-picker"
            />

            {/* Selected Range Display */}
            {selectedRange?.from && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Selected:</span>{' '}
                  {format(selectedRange.from, 'MMM d, yyyy')}
                  {selectedRange.to && (
                    <>
                      {' '}→ {format(selectedRange.to, 'MMM d, yyyy')}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!selectedRange?.from}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
