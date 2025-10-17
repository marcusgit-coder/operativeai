# Automatic New Ticket Creation from Email

## Feature
The email system now automatically creates new support tickets when customers send brand NEW emails (not replies).

## How It Works

### Detection Logic
When an email is received from a customer:

1. **Try to match by subject** to existing tickets
   - Normalizes subject (removes "Re:", "Fwd:", etc.)
   - Compares with all active tickets from that customer
   - If match found → Add to that ticket ✅

2. **Check if email is a reply** (no subject match)
   - Checks for `In-Reply-To` header (Gmail/Outlook add this when you hit Reply)
   - Checks for `References` header (email thread history)
   - If headers exist → It's a reply, add to most recent ticket
   - If NO headers → It's a brand new email, create new ticket! 🆕

3. **First-time customers**
   - If customer has no existing tickets → Always create new ticket

### Example Scenarios

#### Scenario 1: Customer Replies to Existing Ticket
```
Customer clicks "Reply" in Gmail to your support email
Subject: "Re: URGENT test"
Headers: In-Reply-To: <previous-message-id>

Result: ✅ Matched to existing ticket by subject
```

#### Scenario 2: Customer Composes New Email
```
Customer clicks "Compose" in Gmail (NOT reply)
Subject: "urgent need help"
Headers: (none - brand new email)

Result: 🆕 Creates NEW ticket with subject "urgent need help"
```

#### Scenario 3: Customer Replies But Subject Changed
```
Customer clicks "Reply" but changes subject line
Subject: "Different issue"
Headers: In-Reply-To: <previous-message-id>

Result: ⚠️ Added to most recent ticket (it's still a reply thread)
```

## Code Changes

### File: `lib/email/ticket-email-receiver.ts`

#### Added Method: `createNewTicket()`
```typescript
private async createNewTicket(email: ParsedEmail, customerEmail: string): Promise<{ id: string } | null> {
  // Creates new Conversation with:
  // - organizationId
  // - channel: "EMAIL"
  // - customerEmail, customerName
  // - subject from email
  // - status: "ACTIVE"
  // - priority: "MEDIUM"
  // - unreadCount: 1
}
```

#### Updated Logic: Email Matching
```typescript
// If no subject match found:
const isReply = email.inReplyTo || (email.references && email.references.length > 0)

if (isReply) {
  // Add to most recent ticket (it's a reply)
} else {
  // Create NEW ticket (it's a fresh email)
}
```

## Testing

### Test 1: Create New Ticket from Fresh Email
1. Open Gmail, click **Compose** (NOT Reply)
2. To: your-support@email.com
3. Subject: "Brand new issue"
4. Body: "I have a completely new problem"
5. Send

**Expected Result:**
- New ticket appears in Support page
- Subject: "Brand new issue"
- Status: ACTIVE
- First message is from customer

**Console Logs:**
```
📨 Found 1 emails from customer@email.com (last 7 days)
📧 Processing email with subject: "Brand new issue"
   Comparing: email="brand new issue" vs ticket="other subject" (xxx)
   Email headers: In-Reply-To="none", References=0
📝 New email detected (no reply headers), creating new ticket for "Brand new issue"
✅ Created new ticket xxx for "Brand new issue"
✅ Created inbound message for ticket xxx
```

### Test 2: Reply Goes to Existing Ticket
1. Open existing ticket email in Gmail
2. Click **Reply**
3. Subject: "Re: Brand new issue" (auto-added by Gmail)
4. Body: "Here's more info"
5. Send

**Expected Result:**
- Reply added to EXISTING ticket
- No new ticket created
- Ticket shows 2 messages

**Console Logs:**
```
📧 Processing email with subject: "Re: Brand new issue"
   Comparing: email="brand new issue" vs ticket="brand new issue" (xxx)
✅ Matched email to ticket xxx by subject: "brand new issue"
```

## Important Notes

### Gmail/Outlook Behavior
- When customers use **Reply** button: Automatically adds In-Reply-To header ✅
- When customers use **Compose** button: No headers, treated as new ticket 🆕
- When customers forward: May or may not have headers (depends on email client)

### Subject Matching Priority
1. **Exact subject match** (after normalization) → Use that ticket
2. **Reply headers present** → Use most recent ticket
3. **No headers, no match** → Create new ticket

### Current Limitation
The system only checks emails from customers who already have active tickets. Brand new customers sending their first email will not be automatically detected until they have at least one ticket.

**Workaround**: Manually create a ticket for new customers, or they can send first email to a monitored alias that auto-creates tickets.

## Configuration
No configuration needed - works automatically with the email poller.

## Logs to Monitor
- `📝 New email detected (no reply headers), creating new ticket` - New ticket created
- `✅ Created new ticket xxx for "subject"` - Ticket creation successful
- `⚠️ Reply without subject match, using most recent ticket` - Reply added to recent ticket
- `✅ Matched email to ticket xxx by subject` - Perfect match found

## Future Enhancements
- [ ] Monitor entire inbox for new customers (not just existing ticket customers)
- [ ] AI-based subject matching (fuzzy match, similar topics)
- [ ] Merge duplicate tickets from same customer
- [ ] Auto-assign based on email content/keywords
- [ ] Integration with email aliases for auto-routing
