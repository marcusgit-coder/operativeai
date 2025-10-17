"use client"

import { useState } from "react"
import { Message } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, User, Send } from "lucide-react"
import { useRouter } from "next/navigation"

interface TicketMessagesProps {
  messages: Message[]
  ticketId: string
}

export default function TicketMessages({ messages, ticketId }: TicketMessagesProps) {
  const router = useRouter()
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      setNewMessage("")
      router.refresh()
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="dark:text-gray-100">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.isAiGenerated ? "bg-purple-50 dark:bg-purple-900/10" : ""
              } p-4 rounded-lg`}
            >
              <div className="flex-shrink-0">
                {message.isAiGenerated ? (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm dark:text-gray-100">
                      {message.sender}
                    </span>
                    {message.isAiGenerated && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        AI Generated
                      </span>
                    )}
                    {message.needsReview && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Needs Review
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.confidenceScore && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Confidence: {(message.confidenceScore * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSendMessage} className="border-t pt-4 dark:border-gray-700">
          <div className="space-y-3">
            <textarea
              placeholder="Type your reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
