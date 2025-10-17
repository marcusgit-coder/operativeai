# Email Reply Sync System - Implementation Guide

## Overview
This system automatically fetches incoming emails from IMAP servers, matches them to existing support tickets, and creates messages in the dashboard. It completes the bidirectional email integration loop.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│          Customer sends email reply             │
│       to: support@yourcompany.com               │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│     Email arrives in Gmail/Outlook inbox        │
└───────────────┬─────────────────────────────────┘
                │
                ↓ (Every 60 seconds)
┌─────────────────────────────────────────────────┐
│           EmailPoller Background Service         │
│   - Connects to IMAP server                     │
│   - Fetches UNSEEN emails                       │
│   - Marks as SEEN after processing              │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│              EmailReceiver Service               │
│   - Parse email (subject, body, headers)        │
│   - Extract threading info (In-Reply-To)        │
│   - Extract sender, date, attachments           │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│         Match to Existing Conversation          │
│   Method 1: Check In-Reply-To/References        │
│   Method 2: Match subject + customer email      │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
    Found            Not Found
        │                │
        │                ↓
        │      ┌──────────────────┐
        │      │  Create New      │
        │      │  Support Ticket  │
        │      └─────────┬────────┘
        │                │
        └────────┬───────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│           Create INBOUND Message                │
│   - Store in database                           │
│   - Link to conversation                        │
│   - Mark as DELIVERED                           │
│   - Update conversation unreadCount             │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│            Notify Support Admins                │
│   - Create notification records                 │
│   - Update notification bell badge              │
│   - Trigger email/push (if enabled)             │
└───────────────┬─────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────┐
│          Admin Dashboard Updates                │
│   - Bell badge shows new notification           │
│   - Message appears in ticket detail            │
│   - Admin can reply from dashboard              │
└─────────────────────────────────────────────────┘
```

---

## 📦 Components Built

### 1. **EmailReceiver Service** (`lib/email/email-receiver.ts`)

**Purpose:** Handle IMAP connection, email fetching, and processing

**Key Features:**
- ✅ IMAP connection management (connect/disconnect)
- ✅ Fetch unread emails from INBOX
- ✅ Parse email headers (From, To, Subject, Message-ID, In-Reply-To, References)
- ✅ Parse email body (text and HTML)
- ✅ Email threading detection (In-Reply-To and References headers)
- ✅ Fallback matching (subject + customer email)
- ✅ Automatic ticket creation for new conversations
- ✅ Message creation with INBOUND direction
- ✅ Notification triggers for ticket replies
- ✅ Subject normalization (remove Re:, Fwd:, etc.)

**Methods:**
- `connect()` - Establish IMAP connection
- `disconnect()` - Close IMAP connection
- `fetchNewEmails()` - Get all UNSEEN emails
- `processIncomingEmail()` - Main processing flow
- `findExistingConversation()` - Match email to ticket
- `createTicketFromEmail()` - Create new ticket
- `createMessageFromEmail()` - Create message record

---

### 2. **EmailPoller Background Service** (`lib/email/email-poller.ts`)

**Purpose:** Periodic email fetching for all organizations

**Key Features:**
- ✅ Background polling (default: 60 seconds)
- ✅ Multi-organization support
- ✅ Error handling per organization
- ✅ Automatic reconnection on errors
- ✅ Status tracking (lastSyncAt, syncStatus)
- ✅ Skip failed integrations
- ✅ Logging and metrics
- ✅ Singleton pattern (one poller instance)

**Methods:**
- `start()` - Start polling loop
- `stop()` - Stop polling
- `poll()` - Main polling iteration
- `pollAllOrganizations()` - Poll all enabled integrations
- `pollOrganization()` - Poll single organization
- `getStatus()` - Get current status
- `setPollInterval()` - Change polling frequency

**Polling Metrics:**
- Organizations polled
- Total emails processed
- Success/error counts
- Poll duration

---

### 3. **Poller Control API** (`app/api/email/poller/route.ts`)

**Purpose:** Start/stop/status endpoints for email polling

**Endpoints:**

**GET `/api/email/poller`**
- Returns: `{ isRunning, pollInterval, pollIntervalSeconds }`
- Auth: User must be logged in

**POST `/api/email/poller`**
- Body: `{ action: "start" | "stop" }`
- Returns: Status after action
- Auth: Admin only

---

### 4. **Type Declarations** (`types/mailparser.d.ts`)

**Purpose:** TypeScript types for mailparser library

**Interfaces:**
- `ParsedMail` - Parsed email structure
- `AddressObject` - Email address with name
- `Attachment` - Email attachments
- `simpleParser()` - Parser function signature

---

## 🔧 Configuration

### **Email Integration Credentials Format**

Store in `ChannelIntegration.credentials` as JSON:

```json
{
  "username": "support@yourcompany.com",
  "password": "your-app-password",
  
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  },
  
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true
  }
}
```

### **Gmail Configuration**

1. **Enable IMAP in Gmail:**
   - Settings → Forwarding and POP/IMAP → Enable IMAP

2. **Create App Password:**
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate password for "Mail"
   - Use this password (not your regular password)

3. **Configuration:**
   ```json
   {
     "username": "youremail@gmail.com",
     "password": "xxxx xxxx xxxx xxxx",
     "imapHost": "imap.gmail.com",
     "imapPort": 993,
     "imapSecure": true
   }
   ```

### **Outlook/Office 365 Configuration**

1. **Enable IMAP:**
   - Outlook Settings → Mail → Sync email → POP and IMAP → Enable IMAP

2. **Use App Password (if 2FA enabled):**
   - Similar to Gmail, create app-specific password

3. **Configuration:**
   ```json
   {
     "username": "youremail@outlook.com",
     "password": "your-app-password",
     "imapHost": "outlook.office365.com",
     "imapPort": 993,
     "imapSecure": true
   }
   ```

---

## 🚀 Usage

### **Start Email Poller**

**Option 1: Via API** (Recommended for testing)
```typescript
// Call API endpoint
const response = await fetch('/api/email/poller', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start' })
})
```

**Option 2: On Server Boot**
```typescript
// In your server initialization code
import { startEmailPoller } from '@/lib/email/email-poller'

if (process.env.NODE_ENV === 'production') {
  startEmailPoller()
}
```

**Option 3: Programmatically**
```typescript
import { startEmailPoller, stopEmailPoller, getPollerStatus } from '@/lib/email/email-poller'

// Start
const poller = startEmailPoller()

// Check status
const status = getPollerStatus()
console.log(status)
// { isRunning: true, pollInterval: 60000, pollIntervalSeconds: 60 }

// Stop
stopEmailPoller()
```

---

## 🧪 Testing Flow

### **Test 1: New Email Creates Ticket**

1. Send email to your support address
2. Wait up to 60 seconds for polling
3. Check console logs for:
   ```
   📬 Polling emails for all organizations...
   📨 Found 1 new emails
   📝 Creating new ticket from email
   ✅ Email processed successfully
   ```
4. Verify in dashboard:
   - New ticket appears in support list
   - Customer name/email populated
   - Message appears as INBOUND
   - Notification created for admins

### **Test 2: Reply Email Adds to Ticket**

1. Reply to an existing ticket from dashboard
2. Customer receives email
3. Customer replies to that email
4. Wait for polling (60 seconds)
5. Check console logs for:
   ```
   ✅ Found existing conversation: abc123
   ✅ Created message: xyz789
   ✅ Email processed successfully
   ```
6. Verify in dashboard:
   - New message appears in ticket
   - Message marked as INBOUND
   - Notification sent to admins
   - Bell badge increments

### **Test 3: Email Threading Works**

1. Create ticket via email
2. Reply from dashboard (creates Message-ID)
3. Customer hits "Reply" in their email client
4. Customer's reply includes In-Reply-To header
5. Poller matches via threading
6. Message added to correct ticket

---

## 📊 Monitoring

### **Check Poller Status**

```typescript
// Via API
GET /api/email/poller

// Response:
{
  "success": true,
  "status": {
    "isRunning": true,
    "pollInterval": 60000,
    "pollIntervalSeconds": 60
  }
}
```

### **Console Logs**

```
🚀 Email poller started (interval: 60s)
📬 📬 📬 ... (polling start)
📧 Polling: Acme Corp
📨 Processing 2 emails...
✅ Email processed successfully
✅ Poll complete in 3.45s
   - Organizations: 1
   - Emails processed: 2
   - Success: 1
   - Errors: 0
```

### **Database Checks**

```sql
-- Check last sync time
SELECT id, organizationId, lastSyncAt, syncStatus 
FROM ChannelIntegration 
WHERE channel = 'EMAIL';

-- Check recent inbound messages
SELECT * FROM Message 
WHERE direction = 'INBOUND' 
ORDER BY sentAt DESC 
LIMIT 10;

-- Check notifications
SELECT * FROM Notification 
WHERE type = 'TICKET_REPLY' 
ORDER BY createdAt DESC 
LIMIT 10;
```

---

## 🐛 Troubleshooting

### **Problem: Poller not fetching emails**

**Symptoms:** No console logs, no emails being processed

**Solutions:**
1. Check poller is running:
   ```typescript
   const status = getPollerStatus()
   console.log(status.isRunning) // Should be true
   ```

2. Verify IMAP credentials:
   ```sql
   SELECT credentials FROM ChannelIntegration WHERE channel = 'EMAIL';
   ```

3. Test IMAP connection manually:
   ```typescript
   import { EmailReceiver } from '@/lib/email/email-receiver'
   
   const receiver = new EmailReceiver(orgId, config)
   await receiver.connect()
   const emails = await receiver.fetchNewEmails()
   console.log(emails)
   ```

### **Problem: Emails not matching to tickets**

**Symptoms:** Every email creates a new ticket instead of adding to existing

**Solutions:**
1. Check email Message-IDs are being stored:
   ```sql
   SELECT externalId FROM Message WHERE direction = 'OUTBOUND';
   ```

2. Check In-Reply-To header in customer's email
3. Verify subject line matching logic
4. Check customer email address matches exactly

### **Problem: IMAP connection errors**

**Symptoms:** "IMAP Error" in console, syncStatus = "ERROR"

**Common Issues:**
1. **Wrong credentials**
   - Verify username/password
   - Use app-specific password if 2FA enabled

2. **IMAP not enabled**
   - Enable IMAP in Gmail/Outlook settings

3. **Firewall blocking port 993**
   - Check network/firewall settings

4. **Rate limiting**
   - Gmail has limits on IMAP connections
   - Consider increasing poll interval

### **Problem: Duplicate tickets created**

**Symptoms:** Same email creates multiple tickets

**Solutions:**
1. Verify emails are being marked as SEEN
2. Check for race conditions (multiple pollers running)
3. Add unique constraint on externalId:
   ```prisma
   @@unique([externalId])
   ```

---

## ⚡ Performance Optimization

### **Adjust Poll Interval**

```typescript
import { getEmailPoller } from '@/lib/email/email-poller'

const poller = getEmailPoller()
poller.setPollInterval(120000) // 2 minutes
```

**Recommendations:**
- **Low volume:** 2-5 minutes (less resource usage)
- **Medium volume:** 1 minute (balanced)
- **High volume:** 30 seconds (faster response)
- **Very high volume:** Use webhooks instead (Phase 2)

### **Database Indexes**

Already optimized:
- `@@index([conversationId, sentAt])` on Message
- `@@index([externalId])` on Message
- `@@index([customerEmail])` on Conversation
- `@@index([externalId])` on Conversation

### **Connection Pooling**

Current implementation: One connection per poll cycle

**Future improvement:**
- Reuse IMAP connections
- Connection pooling for multiple organizations
- Idle timeout handling

---

## 🔒 Security Considerations

### **Credential Storage**

✅ **Current:** Encrypted credentials in database
⚠️ **Recommendation:** Use environment variables or secrets manager for production

```typescript
// Store encrypted
const encrypted = encryptCredentials(credentials)
await db.channelIntegration.update({
  data: { credentials: encrypted }
})

// Decrypt before use
const decrypted = decryptCredentials(integration.credentials)
const receiver = new EmailReceiver(orgId, decrypted)
```

### **Email Validation**

✅ **Current:** Basic validation (email format, required fields)
⚠️ **Recommendation:** Add spam filtering, virus scanning

```typescript
// Check sender reputation
if (isSpamEmail(email)) {
  await markAsSpam(email)
  return
}

// Scan attachments
if (email.attachments.length > 0) {
  await scanForViruses(email.attachments)
}
```

### **Rate Limiting**

✅ **Current:** Per-organization error handling
⚠️ **Recommendation:** Implement exponential backoff

```typescript
if (errorCount > 3) {
  // Disable integration temporarily
  await db.channelIntegration.update({
    data: { syncStatus: 'PAUSED' }
  })
  
  // Re-enable after cooldown period
  setTimeout(() => enableIntegration(), 3600000) // 1 hour
}
```

---

## 🎯 Next Steps

### **Phase 2: Enhanced Features**

1. **Real-time Webhooks** (Alternative to polling)
   - Integrate SendGrid Inbound Parse
   - Or Mailgun Routes
   - Or custom SMTP server with webhooks

2. **Attachment Support**
   - Download email attachments
   - Store in cloud storage (S3, Cloudflare R2)
   - Display in ticket view

3. **Rich Email Formatting**
   - Preserve HTML formatting
   - Inline images
   - Email signature detection

4. **Smart Threading**
   - AI-powered conversation matching
   - Handle forwarded emails
   - Detect conversation splits

5. **Email Templates**
   - Customizable reply templates
   - Signature management
   - Auto-responses

6. **Analytics Dashboard**
   - Emails processed per day
   - Response time metrics
   - Threading accuracy

---

## 📚 API Reference

### **EmailReceiver Class**

```typescript
class EmailReceiver {
  constructor(organizationId: string, config: EmailConfig)
  
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async fetchNewEmails(): Promise<ParsedEmail[]>
  async processIncomingEmail(email: ParsedEmail): Promise<void>
}
```

### **EmailPoller Class**

```typescript
class EmailPoller {
  async start(): Promise<void>
  stop(): void
  getStatus(): PollerStatus
  setPollInterval(ms: number): void
}
```

### **Helper Functions**

```typescript
function startEmailPoller(): EmailPoller
function stopEmailPoller(): void
function getPollerStatus(): PollerStatus
function getEmailPoller(): EmailPoller
```

---

## ✅ Completion Checklist

- [x] Install IMAP and mailparser packages
- [x] Create EmailReceiver service
- [x] Implement email parsing and threading
- [x] Create EmailPoller background service
- [x] Add poller control API endpoints
- [x] Create type declarations for mailparser
- [x] Test email fetching locally
- [ ] Update email configuration UI with IMAP fields
- [ ] Add poller status indicator in dashboard
- [ ] Test end-to-end flow with real emails
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Adjust poll interval based on volume

---

## 🎊 Summary

**What We Built:**
- Complete IMAP email receiving system
- Automatic email-to-ticket matching
- Background polling service
- Multi-organization support
- Notification integration
- Error handling and monitoring

**Files Created:**
1. `lib/email/email-receiver.ts` - IMAP receiver service
2. `lib/email/email-poller.ts` - Background polling service
3. `app/api/email/poller/route.ts` - Control API
4. `types/mailparser.d.ts` - Type declarations

**Ready For:**
✅ Testing with real email accounts
✅ Processing incoming customer replies
✅ Automatic ticket creation
✅ Email threading and matching
✅ Multi-organization deployments

**Next:** Update the UI to add IMAP configuration fields and test the complete flow!
