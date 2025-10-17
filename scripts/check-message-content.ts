/**
 * Debug script to check message content in database
 * Run with: npx ts-node scripts/check-message-content.ts
 */

import { db } from "../lib/db"

async function checkMessages() {
  console.log("🔍 Checking recent messages...")
  
  // Find recent messages
  const messages = await db.message.findMany({
    where: {
      direction: "INBOUND",
      channel: "EMAIL",
    },
    orderBy: {
      sentAt: "desc",
    },
    take: 10,
    include: {
      conversation: {
        select: {
          subject: true,
          customerEmail: true,
        },
      },
    },
  })

  console.log(`\n📊 Found ${messages.length} recent inbound email messages:\n`)

  for (const msg of messages) {
    console.log(`─────────────────────────────────────────────────────────`)
    console.log(`ID: ${msg.id}`)
    console.log(`Ticket: ${msg.conversation.subject}`)
    console.log(`From: ${msg.senderEmail || msg.sender}`)
    console.log(`Date: ${msg.sentAt.toISOString()}`)
    console.log(`Content length: ${msg.content.length} characters`)
    console.log(`Content preview:`)
    console.log(msg.content.substring(0, 200))
    if (msg.content.length > 200) {
      console.log(`... (${msg.content.length - 200} more characters)`)
    }
    console.log()
  }

  await db.$disconnect()
}

checkMessages().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
