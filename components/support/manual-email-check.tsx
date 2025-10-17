"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ManualEmailCheckProps {
  ticketId: string
}

export default function ManualEmailCheck({ ticketId }: ManualEmailCheckProps) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  const handleCheck = async () => {
    setChecking(true)
    setResult(null)

    try {
      const response = await fetch("/api/email/check-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.message || "Check complete!")
        if (data.emailsProcessed > 0) {
          // Refresh the page to show new messages
          setTimeout(() => router.refresh(), 1000)
        }
      } else {
        setResult(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setResult("Failed to check emails")
      console.error(error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleCheck}
        disabled={checking}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {checking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Check for Email Replies
          </>
        )}
      </Button>
      {result && (
        <span className={`text-sm ${result.includes("Error") ? "text-red-600" : "text-green-600"}`}>
          {result}
        </span>
      )}
    </div>
  )
}
