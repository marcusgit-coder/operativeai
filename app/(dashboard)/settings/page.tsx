"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Bell, Mail, DollarSign, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    emailIntegrated: false,
    emailProvider: "",
    emailAddress: "",
    autoApproveThreshold: "",
    escalationKeywords: "",
    notifyOnEscalation: true,
    dailyDigest: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            emailIntegrated: data.settings.emailIntegrated || false,
            emailProvider: data.settings.emailProvider || "",
            emailAddress: data.settings.emailAddress || "",
            autoApproveThreshold: data.settings.autoApproveThreshold?.toString() || "",
            escalationKeywords: data.settings.escalationKeywords || "",
            notifyOnEscalation: data.settings.notifyOnEscalation ?? true,
            dailyDigest: data.settings.dailyDigest ?? true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your organization preferences</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded max-w-4xl ${
            message.includes("success")
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:border dark:border-green-800"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 dark:border dark:border-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 max-w-4xl">
        {/* Email Integration */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold dark:text-gray-100">Email Integration</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailIntegrated"
                checked={settings.emailIntegrated}
                onChange={(e) =>
                  setSettings({ ...settings, emailIntegrated: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="emailIntegrated" className="font-medium dark:text-gray-200">
                Enable Email Integration
              </label>
            </div>

            {settings.emailIntegrated && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Provider
                  </label>
                  <select
                    value={settings.emailProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, emailProvider: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select provider</option>
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="custom">Custom SMTP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={settings.emailAddress}
                    onChange={(e) =>
                      setSettings({ ...settings, emailAddress: e.target.value })
                    }
                    placeholder="support@company.com"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Business Rules */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold dark:text-gray-100">Business Rules</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Approve Threshold (HKD)
              </label>
              <Input
                type="number"
                value={settings.autoApproveThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, autoApproveThreshold: e.target.value })
                }
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Invoices below this amount will be auto-approved
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Escalation Keywords
              </label>
              <Input
                value={settings.escalationKeywords}
                onChange={(e) =>
                  setSettings({ ...settings, escalationKeywords: e.target.value })
                }
                placeholder="urgent, complaint, refund"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Comma-separated list of keywords that trigger human review
              </p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold dark:text-gray-100">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium dark:text-gray-200">Escalation Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a conversation is escalated
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnEscalation}
                onChange={(e) =>
                  setSettings({ ...settings, notifyOnEscalation: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium dark:text-gray-200">Daily Digest</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive a daily summary of activity
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyDigest}
                onChange={(e) =>
                  setSettings({ ...settings, dailyDigest: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={fetchSettings}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
