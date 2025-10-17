"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TicketFormProps {
  organizationId: string
}

export default function TicketForm({ organizationId }: TicketFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    subject: "",
    message: "",
    channel: "EMAIL",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create ticket")
      }

      const data = await response.json()
      router.push(`/support/${data.conversationId}`)
      router.refresh()
    } catch (err) {
      setError("Failed to create ticket. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="customerName" className="dark:text-gray-300">
          Customer Name
        </Label>
        <Input
          id="customerName"
          placeholder="John Doe"
          value={formData.customerName}
          onChange={(e) =>
            setFormData({ ...formData, customerName: e.target.value })
          }
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Customer Email */}
      <div className="space-y-2">
        <Label htmlFor="customerEmail" className="dark:text-gray-300">
          Customer Email
        </Label>
        <Input
          id="customerEmail"
          type="email"
          placeholder="john@example.com"
          value={formData.customerEmail}
          onChange={(e) =>
            setFormData({ ...formData, customerEmail: e.target.value })
          }
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="dark:text-gray-300">
          Subject
        </Label>
        <Input
          id="subject"
          placeholder="Brief description of the issue"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="dark:text-gray-300">
          Message
        </Label>
        <textarea
          id="message"
          placeholder="Describe the issue or question in detail..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {/* Channel */}
      <div className="space-y-2">
        <Label htmlFor="channel" className="dark:text-gray-300">
          Channel
        </Label>
        <select
          id="channel"
          value={formData.channel}
          onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="EMAIL">Email</option>
          <option value="CHAT">Live Chat</option>
          <option value="PHONE">Phone</option>
          <option value="WEB">Web Form</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating..." : "Create Ticket"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
