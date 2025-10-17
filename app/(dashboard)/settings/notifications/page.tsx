"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Mail, Smartphone, Clock, Save, Loader2 } from "lucide-react"

interface NotificationPreferences {
  // Channel preferences
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  
  // Notification type preferences
  newTicket: boolean
  ticketReply: boolean
  ticketStatus: boolean
  invoiceUpdates: boolean
  systemAlerts: boolean
  
  // Quiet hours (24-hour format)
  quietHoursStart: number | null
  quietHoursEnd: number | null
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    newTicket: true,
    ticketReply: true,
    ticketStatus: true,
    invoiceUpdates: true,
    systemAlerts: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Fetch current preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/notifications/preferences")
        if (response.ok) {
          const data = await response.json()
          setPreferences(data.preferences)
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPreferences()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })
      
      if (response.ok) {
        setMessage({ type: "success", text: "Preferences saved successfully!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error("Failed to save preferences")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleQuietHoursChange = (type: "start" | "end", value: string) => {
    const hour = value ? parseInt(value) : null
    setPreferences((prev) => ({
      ...prev,
      [type === "start" ? "quietHoursStart" : "quietHoursEnd"]: hour,
    }))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notification Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage how and when you receive notifications
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Notification Channels */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Channels
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose how you want to receive notifications
          </p>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">In-App Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Show notifications in the notification bell
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={() => handleToggle("inAppEnabled")}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={() => handleToggle("emailEnabled")}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive browser push notifications
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={() => handleToggle("pushEnabled")}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Notification Types
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Select which types of notifications you want to receive
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <span className="font-medium text-gray-900 dark:text-white">New Support Tickets</span>
              <input
                type="checkbox"
                checked={preferences.newTicket}
                onChange={() => handleToggle("newTicket")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <span className="font-medium text-gray-900 dark:text-white">Ticket Replies</span>
              <input
                type="checkbox"
                checked={preferences.ticketReply}
                onChange={() => handleToggle("ticketReply")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <span className="font-medium text-gray-900 dark:text-white">Ticket Status Changes</span>
              <input
                type="checkbox"
                checked={preferences.ticketStatus}
                onChange={() => handleToggle("ticketStatus")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <span className="font-medium text-gray-900 dark:text-white">Invoice Updates</span>
              <input
                type="checkbox"
                checked={preferences.invoiceUpdates}
                onChange={() => handleToggle("invoiceUpdates")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
              <span className="font-medium text-gray-900 dark:text-white">System Alerts</span>
              <input
                type="checkbox"
                checked={preferences.systemAlerts}
                onChange={() => handleToggle("systemAlerts")}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </Card>

        {/* Quiet Hours */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Quiet Hours
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Set a time range when you don't want to receive notifications
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <select
                value={preferences.quietHoursStart ?? ""}
                onChange={(e) => handleQuietHoursChange("start", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not set</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <select
                value={preferences.quietHoursEnd ?? ""}
                onChange={(e) => handleQuietHoursChange("end", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not set</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {preferences.quietHoursStart !== null && preferences.quietHoursEnd !== null && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You won't receive notifications between{" "}
                {preferences.quietHoursStart.toString().padStart(2, "0")}:00 and{" "}
                {preferences.quietHoursEnd.toString().padStart(2, "0")}:00
              </p>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
