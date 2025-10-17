"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader, AlertCircle } from "lucide-react"
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

  const [selectedProvider, setSelectedProvider] = useState(existingConfig?.provider || "GMAIL")
  const [formData, setFormData] = useState({
    smtpHost: existingConfig?.smtpHost || EMAIL_PROVIDERS.GMAIL.smtpHost,
    smtpPort: existingConfig?.smtpPort || EMAIL_PROVIDERS.GMAIL.smtpPort,
    secure: existingConfig?.secure ?? EMAIL_PROVIDERS.GMAIL.secure,
    username: existingConfig?.username || "",
    password: "",
    fromEmail: existingConfig?.fromEmail || "",
    fromName: existingConfig?.fromName || "",
  })

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    const providerConfig = EMAIL_PROVIDERS[provider as keyof typeof EMAIL_PROVIDERS]
    setFormData({
      ...formData,
      smtpHost: providerConfig.smtpHost,
      smtpPort: providerConfig.smtpPort,
      secure: providerConfig.secure,
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
