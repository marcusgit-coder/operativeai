"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Building, Shield, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        // Update session
        await update({ name });
      } else {
        setMessage("Failed to update profile");
      }
    } catch (error) {
      setMessage("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Profile Information Card */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold dark:text-gray-100">Profile Information</h2>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            )}
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes("success")
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 dark:border dark:border-green-800"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 dark:border dark:border-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium dark:text-gray-200">{session.user?.name || "User"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{session.user?.email}</p>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">{session.user?.name || "Not set"}</p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <p className="text-gray-900 dark:text-gray-100">{session.user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Role
              </label>
              <p className="text-gray-900 dark:text-gray-100 capitalize">{session.user?.role || "User"}</p>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="inline w-4 h-4 mr-2" />
                Organization
              </label>
              <p className="text-gray-900 dark:text-gray-100">{session.user?.organizationId || "Not assigned"}</p>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Member Since
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setName(session.user?.name || "");
                    setMessage("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Keep your account secure with a strong password
              </p>
              <Button variant="outline">Change Password</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 dark:border-red-900 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="outline" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
