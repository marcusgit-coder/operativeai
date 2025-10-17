import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import EmailIntegrationForm from "@/components/settings/email-integration-form"
import { db } from "@/lib/db"

async function getEmailIntegration(organizationId: string) {
  const integration = await db.channelIntegration.findUnique({
    where: {
      organizationId_channel: {
        organizationId,
        channel: "EMAIL",
      },
    },
  })

  return integration
}

export default async function EmailIntegrationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  const integration = await getEmailIntegration(session.user.organizationId)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Email Integration</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure SMTP settings to send and receive support emails
          </p>
        </div>
      </div>

      {/* Integration Status */}
      {integration && (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${integration.isEnabled ? "bg-green-500" : "bg-gray-400"}`} />
              <div>
                <p className="font-medium dark:text-gray-100">
                  {integration.isEnabled ? "Active" : "Inactive"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {integration.lastSyncAt 
                    ? `Last synced: ${new Date(integration.lastSyncAt).toLocaleString()}`
                    : "Never synced"}
                </p>
              </div>
            </div>
            {integration.errorMessage && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error: {integration.errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">SMTP Configuration</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Enter your email server details to enable email support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailIntegrationForm 
            organizationId={session.user.organizationId}
            existingConfig={integration?.credentials ? JSON.parse(integration.credentials) : null}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Common Email Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold dark:text-gray-100">Gmail</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>• SMTP Host: smtp.gmail.com</li>
              <li>• SMTP Port: 587 (TLS)</li>
              <li>• Enable 2FA and use an App Password</li>
              <li>• Generate App Password at: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-blue-600 hover:underline">Google Account</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold dark:text-gray-100">Outlook / Office 365</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>• SMTP Host: smtp-mail.outlook.com</li>
              <li>• SMTP Port: 587 (TLS)</li>
              <li>• Use your regular Outlook password</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold dark:text-gray-100">Yahoo Mail</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>• SMTP Host: smtp.mail.yahoo.com</li>
              <li>• SMTP Port: 587 (TLS)</li>
              <li>• Generate an App Password at Yahoo Account Security</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
