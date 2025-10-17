# Email Reply Sync - Troubleshooting Guide

## Issue: "Emails are not forwarding to conversations"

This means **customer replies to your emails** are not appearing in the dashboard. Here's how to diagnose and fix:

---

## 🔍 **Step 1: Check Email Integration Configuration**

### Go to Settings → Integrations → Email

Make sure you have configured:

**SMTP Settings (Outbound - for sending):**
- ✅ SMTP Host (e.g., `smtp.gmail.com`)
- ✅ SMTP Port (e.g., `587` for TLS)
- ✅ Username (your email)
- ✅ Password (app password for Gmail)
- ✅ From Email
- ✅ From Name

**IMAP Settings (Inbound - for receiving):**
- ✅ IMAP Host (e.g., `imap.gmail.com`)
- ✅ IMAP Port (e.g., `993` for SSL/TLS)
- ✅ IMAP Security (`SSL/TLS` recommended)

### Common Issue #1: IMAP Not Configured
**Symptom:** IMAP fields are empty  
**Solution:** Fill in IMAP settings using the same credentials as SMTP

**For Gmail:**
- IMAP Host: `imap.gmail.com`
- IMAP Port: `993`
- Security: SSL/TLS (993)

**For Outlook:**
- IMAP Host: `outlook.office365.com`
- IMAP Port: `993`
- Security: SSL/TLS (993)

---

## 🔍 **Step 2: Check Email Poller Status**

The email poller is a **background service** that checks for new emails every 60 seconds.

### Check Poller Status:

1. **Via UI:** Go to Settings → Integrations → Email
   - Look for "Email Poller" status card at the top
   - Should show "✅ Running" or "⏸️ Stopped"

2. **Via API:**
   ```powershell
   # In PowerShell
   Invoke-WebRequest -Uri "http://localhost:3000/api/email/poller" -Method GET
   ```
   
   Expected response:
   ```json
   {
     "isRunning": true,
     "pollInterval": 60000,
     "pollIntervalSeconds": 60
   }
   ```

### Common Issue #2: Poller Not Started
**Symptom:** `isRunning: false`  
**Solution:** Click "Start Poller" button in Settings → Integrations → Email

### Start Poller Manually:
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/email/poller" -Method POST -Body '{"action":"start"}' -ContentType "application/json"
```

---

## 🔍 **Step 3: Check IMAP Credentials**

IMAP authentication often requires special configuration.

### For Gmail:
1. **Enable IMAP:**
   - Go to Gmail Settings → Forwarding and POP/IMAP
   - Enable IMAP
   - Save Changes

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Generate password
   - Use this password (NOT your regular password)

3. **Enable 2-Factor Authentication:**
   - Required for app passwords
   - https://myaccount.google.com/security

### For Outlook/Office 365:
1. **Enable IMAP:**
   - Go to Outlook Settings → Mail → Sync email → POP and IMAP
   - Enable IMAP
   
2. **Use Regular Password:**
   - Or generate app password if 2FA enabled

---

## 🔍 **Step 4: Check Server Logs**

### Watch for Polling Activity:

Start the dev server and watch the console:

```powershell
npm run dev
```

**Expected logs every 60 seconds:**
```
📬 Polling emails for all organizations...
📧 Polling: [Your Organization Name]
📨 Found X new emails
📧 Processing incoming email
📧 From: customer@example.com
📧 Subject: Re: Your ticket
✅ Found existing conversation: abc123
✅ Created message: xyz789
✅ Email processed successfully
✅ Poll complete in 2.34s
```

### Common Polling Errors:

**Error: "IMAP connection failed"**
```
❌ IMAP connection failed: Error: Invalid login
```
**Solution:** Check username/password, ensure app password is used

**Error: "No emails found"**
```
📭 No new emails
```
**Solution:** This is normal if no new emails. Send a test email and wait 60 seconds.

**Error: "channelIntegration not found"**
```
❌ Property 'channelIntegration' does not exist
```
**Solution:** Prisma client needs regeneration:
```powershell
npm run db:generate
```

---

## 🔍 **Step 5: Test Email Flow**

### Complete Test Procedure:

1. **Send email FROM dashboard:**
   - Go to Support page
   - Create new ticket or open existing
   - Send a message
   - **Verify customer receives email**

2. **Check Message-ID header:**
   - In sent email, view raw source
   - Look for `Message-ID: <...@...>`
   - This is stored in database for threading

3. **Customer replies:**
   - Customer clicks "Reply" in their email client
   - Types response
   - Sends email

4. **Wait for poller:**
   - Wait up to 60 seconds
   - Watch server console for polling logs

5. **Check dashboard:**
   - Go to Support page
   - Open the ticket
   - **New INBOUND message should appear**
   - Message direction should be "📥 Inbound"

---

## 🔍 **Step 6: Check Database**

### View Email Integration:

```sql
SELECT 
  id,
  channel,
  isEnabled,
  lastSyncAt,
  syncStatus,
  errorMessage
FROM ChannelIntegration
WHERE channel = 'EMAIL';
```

**Expected:**
- `isEnabled`: 1 (true)
- `lastSyncAt`: Recent timestamp
- `syncStatus`: "ACTIVE"
- `errorMessage`: NULL

### View Recent Messages:

```sql
SELECT 
  m.id,
  m.direction,
  m.sender,
  m.senderEmail,
  m.content,
  m.sentAt,
  c.customerEmail,
  c.subject
FROM Message m
JOIN Conversation c ON m.conversationId = c.id
WHERE c.channel = 'EMAIL'
ORDER BY m.sentAt DESC
LIMIT 10;
```

**Look for:**
- Messages with `direction` = "INBOUND"
- Recent timestamps
- Customer email addresses

---

## 🔍 **Step 7: Common Issues & Solutions**

### Issue: Emails send but don't receive

**Symptoms:**
- Outbound emails work (📤)
- No inbound emails appear (📥)
- Poller shows "No new emails"

**Possible Causes:**
1. IMAP not configured
2. IMAP credentials incorrect
3. IMAP not enabled in email account
4. Poller not running
5. Wrong IMAP host/port

**Solution Checklist:**
- [ ] IMAP Host filled in
- [ ] IMAP Port is 993
- [ ] IMAP enabled in email account settings
- [ ] Using app password (Gmail)
- [ ] Poller status shows "Running"
- [ ] Wait full 60 seconds after customer reply

---

### Issue: Duplicate tickets created

**Symptoms:**
- Each customer reply creates a new ticket
- Messages not grouped in same conversation

**Possible Causes:**
1. Email threading not working
2. Message-ID not being stored
3. In-Reply-To header missing

**Solution:**
1. Check outbound messages have `externalId` set
2. Verify Message-ID is being generated
3. Check email client supports threading

---

### Issue: Poller stops after error

**Symptoms:**
- Poller was running, now stopped
- `syncStatus` = "ERROR"
- Error message in database

**Solution:**
1. Check error message in database
2. Fix underlying issue (credentials, connection)
3. Restart poller via UI or API

---

### Issue: Emails processed but no notification

**Symptoms:**
- Inbound messages appear in tickets
- No notification bell badge
- No notification in panel

**Possible Causes:**
1. Notification preferences disabled
2. Quiet hours active
3. Notification service error

**Solution:**
1. Check Settings → Notifications → Preferences
2. Enable "Ticket Replies" notification type
3. Check console for notification errors

---

## 🎯 **Quick Diagnostic Checklist**

Run through this checklist to diagnose the issue:

```
Configuration:
[ ] SMTP configured (outbound works)
[ ] IMAP Host set (e.g., imap.gmail.com)
[ ] IMAP Port set (993)
[ ] IMAP username same as SMTP
[ ] App password used (for Gmail)
[ ] IMAP enabled in email account

Poller:
[ ] Poller started (check UI or API)
[ ] Poller shows "Running" status
[ ] Poll interval is 60 seconds
[ ] No error message in status

Email Account:
[ ] IMAP enabled in account settings
[ ] 2FA enabled (Gmail)
[ ] App password generated (Gmail)
[ ] Can connect via other IMAP client (Thunderbird, etc.)

Testing:
[ ] Sent email from dashboard to customer
[ ] Customer received email
[ ] Customer replied to email
[ ] Waited 60+ seconds
[ ] Checked server console logs
[ ] Checked Support page for new message
[ ] Checked database for INBOUND messages

Server:
[ ] Dev server running (npm run dev)
[ ] No Prisma type errors in console
[ ] Prisma client up to date (npm run db:generate)
[ ] No IMAP connection errors in logs
```

---

## 📊 **Diagnostic Page**

A diagnostic page has been created to help troubleshoot:

**URL:** `/diagnostics/email`

This page shows:
- Email integration status
- IMAP configuration
- Recent messages (with direction)
- Last sync time
- Error messages
- Action items

---

## 🆘 **Still Not Working?**

If you've gone through all steps and emails still aren't forwarding:

1. **Check Prisma Client:**
   ```powershell
   npm run db:generate
   ```

2. **Restart Dev Server:**
   ```powershell
   Get-Process node | Stop-Process -Force
   npm run dev
   ```

3. **Test IMAP Manually:**
   - Use an IMAP client like Thunderbird
   - Connect with same credentials
   - Verify you can see emails

4. **Check Firewall:**
   - Port 993 (IMAP SSL) must be open
   - Some corporate networks block IMAP

5. **Enable Debug Logging:**
   - Check `lib/email/email-receiver.ts`
   - Look for console.log statements
   - Add more logging if needed

---

## 📝 **Summary**

**The most common issues are:**

1. ⚠️  **IMAP not configured** → Fill in IMAP settings
2. ⚠️  **Poller not started** → Click "Start Poller" button
3. ⚠️  **Wrong credentials** → Use app password for Gmail
4. ⚠️  **IMAP not enabled** → Enable in email account settings
5. ⚠️  **Prisma client out of sync** → Run `npm run db:generate`

**Expected behavior:**
- Customer replies to your email
- Within 60 seconds, new message appears in ticket
- Message shows as "📥 Inbound"
- Notification appears in bell icon
- No duplicate tickets created

---

**Last Updated:** October 17, 2025  
**Version:** 1.0
