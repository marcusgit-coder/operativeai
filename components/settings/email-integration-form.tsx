"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader, AlertCircle, Mail, Inbox, Play, Square } from "lucide-react"
import { EMAIL_PROVIDERS } from "@/lib/email-providers"

interface EmailIntegrationFormProps {
  organizationId: string
  existingConfig: any
}

export default function EmailIntegrationForm({ organizationId, existingConfig }: EmailIntegrationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [pollerStatus, setPollerStatus] = useState<any>(null)
  const [pollerLoading, setPollerLoading] = useState(false)

  const [selectedProvider, setSelectedProvider] = useState(existingConfig?.provider || "GMAIL")
  const [formData, setFormData] = useState({
    smtpHost: existingConfig?.smtpHost || EMAIL_PROVIDERS.GMAIL.smtpHost,
    smtpPort: existingConfig?.smtpPort || EMAIL_PROVIDERS.GMAIL.smtpPort,
    secure: existingConfig?.secure ?? EMAIL_PROVIDERS.GMAIL.secure,
    imapHost: existingConfig?.imapHost || EMAIL_PROVIDERS.GMAIL.imapHost,
    imapPort: existingConfig?.imapPort || EMAIL_PROVIDERS.GMAIL.imapPort,
    imapSecure: existingConfig?.imapSecure ?? EMAIL_PROVIDERS.GMAIL.imapSecure,
    username: existingConfig?.username || "",
    password: "",
    fromEmail: existingConfig?.fromEmail || "",
    fromName: existingConfig?.fromName || "",
  })

  // Fetch poller status on mount
  useEffect(() => {
    fetchPollerStatus()
  }, [])

  const fetchPollerStatus = async () => {
    try {
      const response = await fetch("/api/email/poller")
      if (response.ok) {
        const data = await response.json()
        setPollerStatus(data.status)
      }
    } catch (error) {
      console.error("Failed to fetch poller status:", error)
    }
  }

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    const providerConfig = EMAIL_PROVIDERS[provider as keyof typeof EMAIL_PROVIDERS]
    setFormData({
      ...formData,
      smtpHost: providerConfig.smtpHost,
      smtpPort: providerConfig.smtpPort,
      secure: providerConfig.secure,
      imapHost: providerConfig.imapHost,
      imapPort: providerConfig.imapPort,
      imapSecure: providerConfig.imapSecure,
    })
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/settings/integrations/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Connection successful! ✓",
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleTogglePoller = async () => {
    setPollerLoading(true)
    try {
      const action = pollerStatus?.isRunning ? "stop" : "start"
      const response = await fetch("/api/email/poller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchPollerStatus()
      }
    } catch (error) {
      console.error("Failed to toggle poller:", error)
    } finally {
      setPollerLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/settings/integrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          config: formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save configuration")
      }

      router.refresh()
      alert("Email integration configured successfully!")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save configuration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Email Poller Status */}
      {existingConfig && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Poller</h3>
            </div>
            <Button
              type="button"
              onClick={handleTogglePoller}
              disabled={pollerLoading}
              size="sm"
              variant="outline"
              className={pollerStatus?.isRunning ? "border-red-500 text-red-600 hover:bg-red-50" : "border-green-500 text-green-600 hover:bg-green-50"}
            >
              {pollerLoading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : pollerStatus?.isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Poller
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Poller
                </>
              )}
            </Button>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              Status: <span className={`font-semibold ${pollerStatus?.isRunning ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                {pollerStatus?.isRunning ? "Running" : "Stopped"}
              </span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Checks for new emails every {pollerStatus?.pollIntervalSeconds || 60} seconds
            </p>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider" className="dark:text-gray-300">Email Provider</Label>
        <select
          id="provider"
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
        >
          {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
            <option key={key} value={key}>
              {provider.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {EMAIL_PROVIDERS[selectedProvider as keyof typeof EMAIL_PROVIDERS].help}
        </p>
      </div>

      {/* SMTP Host */}
      <div className="space-y-2">
        <Label htmlFor="smtpHost" className="dark:text-gray-300">SMTP Host</Label>
        <Input
          id="smtpHost"
          value={formData.smtpHost}
          onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
          placeholder="smtp.gmail.com"
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* SMTP Port */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtpPort" className="dark:text-gray-300">SMTP Port</Label>
          <Input
            id="smtpPort"
            type="number"
            value={formData.smtpPort}
            onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
            placeholder="587"
            required
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secure" className="dark:text-gray-300">Security</Label>
          <select
            id="secure"
            value={formData.secure ? "true" : "false"}
            onChange={(e) => setFormData({ ...formData, secure: e.target.value === "true" })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="false">TLS (587)</option>
            <option value="true">SSL (465)</option>
          </select>
        </div>
      </div>

      {/* IMAP Settings Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Incoming Mail (IMAP) Settings
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure IMAP to receive customer email replies automatically
        </p>

        {/* IMAP Host */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="imapHost" className="dark:text-gray-300">IMAP Host</Label>
          <Input
            id="imapHost"
            value={formData.imapHost}
            onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
            placeholder="imap.gmail.com"
            required
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        {/* IMAP Port and Security */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="imapPort" className="dark:text-gray-300">IMAP Port</Label>
            <Input
              id="imapPort"
              type="number"
              value={formData.imapPort}
              onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
              placeholder="993"
              required
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imapSecure" className="dark:text-gray-300">IMAP Security</Label>
            <select
              id="imapSecure"
              value={formData.imapSecure ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, imapSecure: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="true">SSL/TLS (993)</option>
              <option value="false">STARTTLS (143)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Username / Email */}
      <div className="space-y-2">
        <Label htmlFor="username" className="dark:text-gray-300">Email Address (Username)</Label>
        <Input
          id="username"
          type="email"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="your-email@gmail.com"
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="dark:text-gray-300">
          Password {selectedProvider === "GMAIL" && "(App Password)"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder={existingConfig ? "Leave blank to keep existing password" : "Enter password"}
          required={!existingConfig}
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* From Email */}
      <div className="space-y-2">
        <Label htmlFor="fromEmail" className="dark:text-gray-300">From Email Address</Label>
        <Input
          id="fromEmail"
          type="email"
          value={formData.fromEmail}
          onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
          placeholder="support@yourcompany.com"
          required
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This is the email address customers will see replies from
        </p>
      </div>

      {/* From Name */}
      <div className="space-y-2">
        <Label htmlFor="fromName" className="dark:text-gray-300">From Name (Optional)</Label>
        <Input
          id="fromName"
          value={formData.fromName}
          onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
          placeholder="Support Team"
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-md ${testResult.success ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-sm ${testResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing || !formData.username || !formData.password}
        >
          {testing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Configuration"
          )}
        </Button>
      </div>
    </form>
  )
}
