"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface TimeAgoProps {
  date: Date | string
  addSuffix?: boolean
  className?: string
}

export function TimeAgo({ date, addSuffix = true, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side mounted
    setIsClient(true)
    
    // Initial update
    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix }))
    }
    updateTime()

    // Update every minute to keep it fresh
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [date, addSuffix])

  // Show nothing during SSR to avoid hydration mismatch
  if (!isClient) {
    return <span className={className} suppressHydrationWarning />
  }

  return <span className={className}>{timeAgo}</span>
}
