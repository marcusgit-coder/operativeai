import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function searchForShariq() {
  console.log('\n🔍 Searching for "shariq" in conversations...\n');

  // Get all conversations and filter in JavaScript (SQLite doesn't have good case-insensitive search)
  const allConversations = await prisma.conversation.findMany({
    where: {
      channel: 'EMAIL'
    }
  });

  const conversations = allConversations.filter(conv => 
    (conv.customerEmail && conv.customerEmail.toLowerCase().includes('shariq')) ||
    (conv.customerName && conv.customerName.toLowerCase().includes('shariq')) ||
    (conv.subject && conv.subject.toLowerCase().includes('shariq'))
  );

  if (conversations.length === 0) {
    console.log('❌ No conversations found from "shariq"\n');
    
    // Check messages too
    const allMessages = await prisma.message.findMany({
      take: 500,
      orderBy: { sentAt: 'desc' }
    });
    
    const messages = allMessages.filter(msg =>
      (msg.senderEmail && msg.senderEmail.toLowerCase().includes('shariq')) ||
      (msg.sender && msg.sender.toLowerCase().includes('shariq')) ||
      (msg.content && msg.content.toLowerCase().includes('shariq'))
    ).slice(0, 5);
    
    if (messages.length > 0) {
      console.log(`✅ Found ${messages.length} message(s) containing "shariq":\n`);
      messages.forEach((msg, i) => {
        console.log(`${i + 1}. From: ${msg.senderEmail}`);
        console.log(`   Sender: ${msg.sender}`);
        console.log(`   Date: ${msg.sentAt}`);
        console.log(`   Content preview: ${msg.content.substring(0, 100)}...\n`);
      });
    } else {
      console.log('❌ No messages found containing "shariq"\n');
    }
  } else {
    console.log(`✅ Found ${conversations.length} conversation(s):\n`);
    conversations.forEach((conv, i) => {
      console.log(`${i + 1}. ID: ${conv.id}`);
      console.log(`   Subject: ${conv.subject}`);
      console.log(`   Customer: ${conv.customerName} <${conv.customerEmail}>`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Created: ${conv.createdAt}\n`);
    });
  }

  await prisma.$disconnect();
}

searchForShariq().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
