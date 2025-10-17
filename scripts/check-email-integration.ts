// Quick diagnostic script to check email integration status
import { db } from "../lib/db"

async function checkEmailIntegration() {
  console.log("🔍 Checking Email Integration Status...\n")
  
  // Check all channel integrations
  const integrations = await db.channelIntegration.findMany({
    where: { channel: "EMAIL" },
    include: { organization: true }
  })
  
  console.log(`Found ${integrations.length} email integration(s)\n`)
  
  for (const integration of integrations) {
    console.log("📧 Email Integration:")
    console.log(`   Organization: ${integration.organization.name}`)
    console.log(`   Is Enabled: ${integration.isEnabled}`)
    console.log(`   Last Sync: ${integration.lastSyncAt || "Never"}`)
    console.log(`   Sync Status: ${integration.syncStatus}`)
    
    if (integration.credentials) {
      try {
        const creds = JSON.parse(integration.credentials)
        console.log(`   SMTP Host: ${creds.smtpHost}`)
        console.log(`   SMTP Port: ${creds.smtpPort}`)
        console.log(`   From Email: ${creds.fromEmail}`)
        console.log(`   IMAP Host: ${creds.imapHost || "NOT CONFIGURED"}`)
        console.log(`   IMAP Port: ${creds.imapPort || "NOT CONFIGURED"}`)
        console.log(`   IMAP Username: ${creds.imapUsername || creds.smtpUsername || "NOT SET"}`)
      } catch (e) {
        console.log(`   ⚠️  Could not parse credentials`)
      }
    } else {
      console.log(`   ⚠️  No credentials configured`)
    }
    console.log("")
  }
  
  // Check recent conversations
  const recentConversations = await db.conversation.findMany({
    where: { channel: "EMAIL" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } }
  })
  
  console.log(`\n📨 Recent Email Conversations (last 5):`)
  for (const conv of recentConversations) {
    console.log(`   - ${conv.subject || "(no subject)"}`)
    console.log(`     Customer: ${conv.customerEmail}`)
    console.log(`     Status: ${conv.status}`)
    console.log(`     Messages: ${conv.messages.length > 0 ? conv.messages[0].sender : "No messages"}`)
    console.log(`     Created: ${conv.createdAt}`)
    console.log("")
  }
  
  await db.$disconnect()
}

checkEmailIntegration().catch(console.error)
