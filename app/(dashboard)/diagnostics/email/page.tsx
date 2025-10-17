import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EmailDiagnosticsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }
  
  // Check email integrations
  const integrations = await db.channelIntegration.findMany({
    where: {
      organizationId: session.user.organizationId,
      channel: "EMAIL"
    }
  })
  
  const integration = integrations[0]
  let parsedCredentials = null
  
  if (integration?.credentials) {
    try {
      parsedCredentials = JSON.parse(integration.credentials)
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Check recent messages
  const recentMessages = await db.message.findMany({
    where: {
      conversation: {
        organizationId: session.user.organizationId,
        channel: "EMAIL"
      }
    },
    orderBy: { sentAt: "desc" },
    take: 10,
    include: {
      conversation: {
        select: {
          customerEmail: true,
          subject: true
        }
      }
    }
  })
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Email Integration Diagnostics</h1>
      
      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Email Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {integration ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Enabled:</div>
                <div>{integration.isEnabled ? "✅ Yes" : "❌ No"}</div>
                
                <div className="font-semibold">Last Sync:</div>
                <div>{integration.lastSyncAt?.toLocaleString() || "Never"}</div>
                
                <div className="font-semibold">Sync Status:</div>
                <div>{integration.syncStatus}</div>
                
                {integration.errorMessage && (
                  <>
                    <div className="font-semibold">Error:</div>
                    <div className="text-red-600">{integration.errorMessage}</div>
                  </>
                )}
              </div>
              
              {parsedCredentials && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <h3 className="font-semibold mb-2">Configuration:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>SMTP Host:</div>
                    <div>{parsedCredentials.smtpHost || "Not set"}</div>
                    
                    <div>SMTP Port:</div>
                    <div>{parsedCredentials.smtpPort || "Not set"}</div>
                    
                    <div>From Email:</div>
                    <div>{parsedCredentials.fromEmail || "Not set"}</div>
                    
                    <div>IMAP Host:</div>
                    <div>{parsedCredentials.imapHost || "⚠️ NOT CONFIGURED"}</div>
                    
                    <div>IMAP Port:</div>
                    <div>{parsedCredentials.imapPort || "⚠️ NOT CONFIGURED"}</div>
                    
                    <div>IMAP Username:</div>
                    <div>{parsedCredentials.imapUsername || parsedCredentials.smtpUsername || "Not set"}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-600">❌ No email integration configured</p>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Messages (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length > 0 ? (
            <div className="space-y-2">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 border rounded text-sm">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="font-semibold">Direction:</div>
                    <div className="col-span-3">
                      {msg.direction === "INBOUND" ? "📥 Inbound" : "📤 Outbound"}
                    </div>
                    
                    <div className="font-semibold">From:</div>
                    <div className="col-span-3">{msg.sender}</div>
                    
                    <div className="font-semibold">Customer:</div>
                    <div className="col-span-3">{msg.conversation.customerEmail}</div>
                    
                    <div className="font-semibold">Subject:</div>
                    <div className="col-span-3">{msg.conversation.subject}</div>
                    
                    <div className="font-semibold">Time:</div>
                    <div className="col-span-3">{msg.sentAt.toLocaleString()}</div>
                    
                    <div className="font-semibold">Status:</div>
                    <div className="col-span-3">{msg.status}</div>
                    
                    {msg.externalId && (
                      <>
                        <div className="font-semibold">External ID:</div>
                        <div className="col-span-3 text-xs text-gray-600">{msg.externalId}</div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    {msg.content.substring(0, 200)}
                    {msg.content.length > 200 && "..."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent email messages found</p>
          )}
        </CardContent>
      </Card>
      
      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Configure IMAP settings in Settings → Integrations → Email</li>
            <li>Start the email poller using the "Start Poller" button</li>
            <li>Send a test email to your configured support address</li>
            <li>Wait 60 seconds for the poller to fetch emails</li>
            <li>Check this page or the Support page for new tickets</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
