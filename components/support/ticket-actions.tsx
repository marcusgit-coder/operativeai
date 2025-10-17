"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface TicketActionsProps {
  ticketId: string
  currentStatus: string
}

export default function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update ticket status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "RESOLVED" && (
        <Button
          onClick={() => updateStatus("RESOLVED")}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Mark Resolved
        </Button>
      )}
      {currentStatus !== "ACTIVE" && (
        <Button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Reopen
        </Button>
      )}
      {currentStatus !== "CLOSED" && (
        <Button
          onClick={() => updateStatus("CLOSED")}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Close
        </Button>
      )}
    </div>
  )
}
