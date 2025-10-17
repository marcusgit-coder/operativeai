import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentMessages() {
  console.log('\n📨 Checking recent messages from auchingho6@gmail.com...\n');

  const messages = await prisma.message.findMany({
    where: {
      senderEmail: 'auchingho6@gmail.com',
    },
    orderBy: {
      sentAt: 'desc',
    },
    take: 10,
    include: {
      conversation: true,
    },
  });

  console.log(`Found ${messages.length} messages:\n`);

  messages.forEach((msg, index) => {
    const preview = msg.content.length > 100 ? `${msg.content.substring(0, 100)}...` : msg.content;
    console.log(`${index + 1}. Conversation: "${msg.conversation.subject || 'No subject'}" (${msg.conversation.id})`);
    console.log(`   Status: ${msg.conversation.status}`);
    console.log(`   Sent: ${msg.sentAt.toISOString()}`);
    console.log(`   Content: ${preview}`);
    console.log(`   External ID: ${msg.externalId || 'N/A'}\n`);
  });

  await prisma.$disconnect();
}

checkRecentMessages().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
