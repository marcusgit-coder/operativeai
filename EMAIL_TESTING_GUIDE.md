# Email Reply Sync - Testing Guide

## 🎯 System Complete!

The email reply sync system is now **fully implemented** with:
- ✅ IMAP email receiver service
- ✅ Background email poller (60-second intervals)
- ✅ Email-to-ticket matching (threading + subject)
- ✅ Automatic ticket creation
- ✅ INBOUND message creation
- ✅ Admin notifications
- ✅ Updated UI with IMAP configuration
- ✅ Poller start/stop controls

---

## 📋 Pre-Testing Checklist

### **1. Configure Email Integration**

**Navigate to:** Settings → Integrations → Email

**Required Fields:**
- ✅ Email Provider (Gmail/Outlook/Yahoo/Custom)
- ✅ SMTP Host (auto-filled)
- ✅ SMTP Port (auto-filled)
- ✅ SMTP Security (TLS/SSL)
- ✅ **IMAP Host** (auto-filled) ← NEW!
- ✅ **IMAP Port** (auto-filled) ← NEW!
- ✅ **IMAP Security** (SSL/TLS) ← NEW!
- ✅ Username (your email)
- ✅ Password (app password for Gmail)
- ✅ From Email
- ✅ From Name

### **2. Start Email Poller**

After saving configuration:
- ✅ Look for **"Email Poller"** status card at top of form
- ✅ Click **"Start Poller"** button
- ✅ Verify status changes to **"Running"**
- ✅ Check interval shows **"60 seconds"**

---

## 🧪 Test Scenarios

### **Test 1: New Email Creates Ticket** ✨

**Objective:** Verify incoming email creates a new support ticket

**Steps:**
1. Send email to your configured support address
   - From: Any customer email address
   - To: support@yourcompany.com (your fromEmail)
   - Subject: Test Ticket from Email
   - Body: This is a test message

2. Wait up to 60 seconds for poller to run

3. **Expected Results:**
   - ✅ Console shows polling logs:
     ```
     📬 Polling emails for all organizations...
     📧 Polling: [Your Organization]
     📨 Found 1 new emails
     📧 Processing incoming email
     📝 Creating new ticket from email
     ✅ Email processed successfully
     ```
   - ✅ New ticket appears in Support list
   - ✅ Customer name matches email sender
   - ✅ Customer email is populated
   - ✅ Subject matches email subject
   - ✅ Message content is the email body
   - ✅ Message direction = INBOUND
   - ✅ Bell notification badge increments
   - ✅ Notification appears in dropdown
   - ✅ Click notification navigates to ticket

---

### **Test 2: Reply from Dashboard** 📤

**Objective:** Verify outbound email sends correctly

**Steps:**
1. Open the ticket created in Test 1
2. Type a reply: "Thanks for contacting us!"
3. Click Send
4. Check customer's email inbox

**Expected Results:**
- ✅ Email received by customer
- ✅ Subject line: "Re: Test Ticket from Email"
- ✅ From: Your configured fromEmail
- ✅ Message-ID header present (for threading)
- ✅ Message appears in ticket as OUTBOUND
- ✅ Timestamp accurate

---

### **Test 3: Customer Reply Creates INBOUND Message** 💬

**Objective:** Verify email threading works correctly

**Steps:**
1. Customer replies to the email from Test 2
   - Click "Reply" in their email client
   - Body: "Thanks for the quick response!"
   - Send

2. Wait up to 60 seconds for poller

3. **Expected Results:**
   - ✅ Console shows:
     ```
     📨 Found 1 new emails
     🔍 Searching by message IDs: [...]
     ✅ Matched by email threading
     ✅ Found existing conversation: [id]
     ✅ Created message: [message_id]
     ✅ Email processed successfully
     ```
   - ✅ New message appears in **same ticket**
   - ✅ Message direction = INBOUND
   - ✅ Customer name/email correct
   - ✅ Timestamp accurate
   - ✅ Unread count increments
   - ✅ Notification sent to admins
   - ✅ Bell badge increments

---

### **Test 4: Subject-Based Matching** 🔍

**Objective:** Test fallback matching when threading fails

**Steps:**
1. Send new email with same subject as existing ticket
   - From: Same customer email
   - Subject: Test Ticket from Email (no Re:)
   - Body: Another message on same topic

2. Wait for poller

**Expected Results:**
   - ✅ Console shows:
     ```
     🔍 Searching by subject: Test Ticket from Email
     ✅ Matched by subject + email
     ```
   - ✅ Message added to existing ticket (not new ticket)
   - ✅ Message marked as INBOUND

---

### **Test 5: Multiple Organizations** 🏢

**Objective:** Verify multi-org isolation

**Steps:**
1. Configure email for Organization A
2. Configure email for Organization B
3. Start poller
4. Send email to both addresses

**Expected Results:**
   - ✅ Poller processes both organizations
   - ✅ Tickets created in correct organizations
   - ✅ No cross-org data leakage
   - ✅ Notifications only to respective org admins

---

### **Test 6: Poller Controls** ⚙️

**Objective:** Test start/stop functionality

**Steps:**
1. Go to email integration settings
2. Click "Stop Poller"
3. Send test email
4. Wait 2 minutes
5. Verify no ticket created
6. Click "Start Poller"
7. Wait 60 seconds
8. Verify ticket now created

**Expected Results:**
   - ✅ Status updates to "Stopped"
   - ✅ No polling while stopped
   - ✅ Status updates to "Running" after start
   - ✅ Polling resumes immediately

---

### **Test 7: Error Handling** ❌

**Objective:** Test graceful failure handling

**Scenarios to Test:**

**A. Invalid IMAP Credentials**
- Change password to incorrect value
- Wait for poller
- Expected: Error logged, syncStatus = "ERROR", poller continues for other orgs

**B. IMAP Connection Timeout**
- Use incorrect IMAP host
- Wait for poller
- Expected: Error logged, integration marked as ERROR

**C. Malformed Email**
- Send email with no subject
- Expected: Creates ticket with "(No Subject)"

**D. Very Large Email**
- Send email with 10MB attachment
- Expected: Processes body, handles attachment gracefully

---

## 🔍 Monitoring & Debugging

### **Check Console Logs**

**Successful Poll:**
```
📬 📬 📬 ... (polling start)
📬 Polling emails for all organizations...
📧 Polling: Acme Corp
📨 Processing 1 emails...
📧 Processing incoming email
📧 From: John Doe <john@example.com>
📧 Subject: Test Subject
✅ Found existing conversation: abc123
✅ Created message: xyz789
✅ Email processed successfully
✅ Poll complete in 2.34s
   - Organizations: 1
   - Emails processed: 1
   - Success: 1
   - Errors: 0
```

**No New Emails:**
```
📬 Polling emails for all organizations...
📧 Polling: Acme Corp
📭 No new emails
✅ Poll complete in 1.12s
   - Organizations: 1
   - Emails processed: 0
   - Success: 1
   - Errors: 0
```

**Error:**
```
❌ IMAP connection failed: Error: Invalid login
❌ Failed to poll Acme Corp: [error details]
✅ Poll complete in 3.45s
   - Organizations: 1
   - Emails processed: 0
   - Success: 0
   - Errors: 1
```

### **Database Queries**

**Check Email Integration:**
```sql
SELECT 
  id, 
  organizationId, 
  isEnabled, 
  lastSyncAt, 
  syncStatus 
FROM ChannelIntegration 
WHERE channel = 'EMAIL';
```

**Check Recent INBOUND Messages:**
```sql
SELECT 
  m.id,
  m.content,
  m.direction,
  m.senderEmail,
  m.sentAt,
  c.subject,
  c.customerEmail
FROM Message m
JOIN Conversation c ON m.conversationId = c.id
WHERE m.direction = 'INBOUND'
ORDER BY m.sentAt DESC
LIMIT 10;
```

**Check Notifications:**
```sql
SELECT 
  type,
  title,
  message,
  isRead,
  createdAt
FROM Notification
WHERE type = 'TICKET_REPLY'
ORDER BY createdAt DESC
LIMIT 10;
```

**Check Poller Performance:**
```sql
SELECT 
  organizationId,
  lastSyncAt,
  syncStatus,
  CAST((julianday('now') - julianday(lastSyncAt)) * 1440 AS INTEGER) as minutes_since_sync
FROM ChannelIntegration
WHERE channel = 'EMAIL' AND isEnabled = 1;
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: No Emails Being Fetched**

**Symptoms:** Poller runs but finds 0 emails

**Possible Causes:**
1. IMAP not enabled in email account
2. Wrong IMAP credentials
3. All emails already marked as read
4. Wrong IMAP host/port

**Solutions:**
1. Enable IMAP in Gmail/Outlook settings
2. Verify username/password (use app password for Gmail)
3. Send new test email
4. Check provider config (imap.gmail.com:993)

---

### **Issue 2: Duplicate Tickets Created**

**Symptoms:** Same email creates multiple tickets

**Possible Causes:**
1. Email threading not working
2. Multiple pollers running
3. Emails not marked as SEEN

**Solutions:**
1. Check Message-ID is being stored in outbound messages
2. Restart server to ensure single poller
3. Verify markSeen: true in IMAP fetch

---

### **Issue 3: Wrong Ticket Matching**

**Symptoms:** Email added to incorrect ticket

**Possible Causes:**
1. Subject normalization too aggressive
2. Multiple tickets with same subject
3. Customer email mismatch

**Solutions:**
1. Review normalizeSubject() logic
2. Add ticket number to subject line
3. Verify customerEmail exact match

---

### **Issue 4: Notifications Not Sending**

**Symptoms:** Emails processed but no notifications

**Possible Causes:**
1. notifyTicketReply() not called
2. User preferences disabled
3. Quiet hours active

**Solutions:**
1. Check notification trigger in email-receiver.ts
2. Verify user notification preferences
3. Check quiet hours settings

---

### **Issue 5: IMAP Authentication Failed**

**Symptoms:** Error 535 "Username and Password not accepted"

**Gmail Specific:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password (not regular password)
4. Enable IMAP: Settings → Forwarding and POP/IMAP

**Outlook Specific:**
1. Use regular password (or app password if 2FA)
2. Enable IMAP: Settings → Mail → Sync email → POP and IMAP
3. May need to enable "Less secure app access"

---

## 📊 Performance Metrics

### **Expected Performance:**

- **Poll Interval:** 60 seconds
- **Emails per Poll:** 1-10 (typical)
- **Processing Time:** 1-3 seconds per email
- **Memory Usage:** ~50MB per poller
- **CPU Usage:** Minimal (only during polling)

### **Scaling Guidelines:**

| Volume | Emails/Day | Poll Interval | Notes |
|--------|-----------|---------------|-------|
| Low | < 100 | 2-5 minutes | Reduce server load |
| Medium | 100-500 | 1 minute | Balanced |
| High | 500-2000 | 30 seconds | Faster response |
| Very High | > 2000 | Use webhooks | Replace polling |

---

## ✅ Success Criteria

After testing, you should have:

- [x] Email sent to support address creates ticket
- [x] Ticket details accurate (subject, customer, content)
- [x] Reply from dashboard sends email to customer
- [x] Customer reply adds message to same ticket
- [x] Email threading works correctly
- [x] Subject-based fallback matching works
- [x] Notifications sent to admins
- [x] Bell badge updates correctly
- [x] Poller can be started/stopped
- [x] Console logs show detailed activity
- [x] Database records accurate
- [x] Multi-organization isolation works
- [x] Error handling graceful

---

## 🚀 Production Deployment Checklist

Before deploying to production:

### **Configuration:**
- [ ] All IMAP credentials stored securely
- [ ] Environment variables for sensitive data
- [ ] Database backups enabled
- [ ] Error logging configured (Sentry, LogRocket, etc.)

### **Performance:**
- [ ] Poll interval optimized for volume
- [ ] Database indexes verified
- [ ] Connection pooling configured
- [ ] Memory limits set

### **Monitoring:**
- [ ] Logging infrastructure in place
- [ ] Alerting for poller failures
- [ ] Metrics dashboard (emails/day, errors, latency)
- [ ] Health check endpoint

### **Security:**
- [ ] Credentials encrypted at rest
- [ ] IMAP connections use TLS/SSL
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all email fields
- [ ] Spam filtering considered

### **Documentation:**
- [ ] User guide for email setup
- [ ] Admin guide for troubleshooting
- [ ] Runbook for common issues
- [ ] Architecture diagrams updated

---

## 🎊 What's Next?

### **Phase 2 Enhancements:**

1. **Real-time Webhooks**
   - Replace polling with instant delivery
   - Integrate SendGrid/Mailgun/Postmark
   - Reduce latency to < 1 second

2. **Attachment Support**
   - Download email attachments
   - Store in S3/Cloudflare R2
   - Display in ticket view
   - Virus scanning

3. **Rich Email Formatting**
   - Preserve HTML formatting
   - Inline images
   - Email signatures
   - Quote threading

4. **Smart Features**
   - AI-powered conversation matching
   - Sentiment analysis
   - Auto-tagging
   - Priority detection

5. **Analytics**
   - Response time metrics
   - Threading accuracy
   - Email volume trends
   - Customer engagement

---

## 📞 Support

If you encounter issues during testing:

1. **Check Console Logs** - Most issues show clear error messages
2. **Review Database** - Verify data is being created correctly
3. **Test IMAP Connection** - Use standalone IMAP client to verify credentials
4. **Check Provider Settings** - Ensure IMAP is enabled in email account
5. **Review Documentation** - `EMAIL_REPLY_SYNC_GUIDE.md` has detailed troubleshooting

---

## 🎯 Summary

The email reply sync system is **ready for testing**! You now have:

✅ Complete bidirectional email integration  
✅ Automatic ticket creation from emails  
✅ Email threading and smart matching  
✅ Background polling service  
✅ Admin notifications  
✅ Full UI controls  
✅ Multi-organization support  
✅ Error handling and logging  

**Ready to test!** 🚀

Follow the test scenarios above to verify everything works correctly, then deploy to production!
