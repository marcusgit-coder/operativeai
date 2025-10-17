# Email Reply Debugging Checklist

## 🔍 **Step-by-Step Diagnosis**

You've configured IMAP, started the poller, and sent/received emails, but the reply isn't showing up. Let's debug:

---

### **Step 1: Verify Email Was Actually Sent**

Check the customer's email (auchingho6@gmail.com):
- ✅ Did the customer receive your email from the dashboard?
- ✅ Did the customer click "Reply" (not "New Email")?
- ✅ Did the customer see the "Re: URGENT test" subject?
- ✅ Did the customer actually send the reply?

---

### **Step 2: Check Gmail Inbox**

Log into your support email (auchingho1@gmail.com):
- ✅ Is the customer's reply in the inbox?
- ✅ Is it marked as "Unread"?
- ✅ Check if it's in Spam folder
- ✅ Check if it's in a different folder

**If the email isn't in the inbox, the customer didn't send it successfully.**

---

### **Step 3: Verify Poller is Running**

Go to: **Settings → Integrations → Email**

Check:
- ✅ Status shows "✅ Running"
- ✅ Polling interval is 60 seconds
- ✅ Last sync time updates every minute

**If status is "⏸️ Stopped", click "Start Poller"**

---

### **Step 4: Check Server Console Logs**

Look for polling output every 60 seconds:

**Expected:**
```
📬 📬 📬 ...
📬 Polling emails for all organizations...
🎫 Found X active email tickets
📨 Found 1 unread emails from auchingho6@gmail.com
✅ Matched by subject: "URGENT test"
✅ Created inbound message for ticket ...
✅ Processed 1 ticket replies
```

**If you see:**
```
🎫 Found 126 active email tickets
(then nothing)
```

This means the poller is trying to check too many tickets and timing out.

---

### **Step 5: Check Ticket Email Address**

The system only checks emails from customers with active tickets.

**Verify:**
1. Open the ticket in dashboard
2. Check if "Customer Email" field shows: `auchingho6@gmail.com`
3. Check if ticket Status is "ACTIVE"

**If customer email is empty or wrong:**
- The system won't check emails from that address
- Update the ticket to add the customer email

---

### **Step 6: Test IMAP Connection Manually**

Let's verify IMAP settings work:

1. Open an email client (Thunderbird, Outlook, etc.)
2. Add account with same credentials:
   - Email: auchingho1@gmail.com
   - IMAP Host: imap.gmail.com
   - IMAP Port: 993
   - Security: SSL/TLS
   - Password: [Your app password]
3. Can you see emails in the client?

**If IMAP connection fails:**
- Check app password is correct
- Verify IMAP is enabled in Gmail
- Check firewall isn't blocking port 993

---

### **Step 7: Check for TypeScript Errors**

Open browser console (F12) and check for errors:
- Red errors in Network tab
- JavaScript errors in Console tab
- Failed API requests

**Common issues:**
- Prisma client out of sync
- Missing environment variables
- Database connection issues

---

### **Step 8: Reduce Active Tickets (Temporary Fix)**

The poller found **126 active email tickets**, which might be causing timeout issues.

**Quick fix:**
1. Go to Support page
2. Close old/resolved tickets
3. Change status from "ACTIVE" to "CLOSED"
4. Reduce to < 10 active tickets
5. Wait for next poll cycle

---

### **Step 9: Check Database Directly**

Run this query in Prisma Studio:

```sql
-- Check if ticket has customer email
SELECT id, customerEmail, subject, status 
FROM Conversation 
WHERE id = 'cmguh0dgy0001ep98j3g1i6ut';

-- Check recent messages
SELECT * FROM Message 
WHERE conversationId = 'cmguh0dgy0001ep98j3g1i6ut'
ORDER BY sentAt DESC;
```

**Expected:**
- `customerEmail` = `auchingho6@gmail.com`
- `status` = `ACTIVE`
- Messages show both OUTBOUND and INBOUND

---

### **Step 10: Manual Email Fetch Test**

Create a test to manually fetch one email:

1. Stop the poller
2. Send customer reply NOW
3. Wait 10 seconds
4. Start poller
5. Watch console logs closely

---

## 🔧 **Common Issues & Solutions**

### **Issue: "🎫 Found 126 active email tickets" then silence**

**Problem:** Too many tickets to poll in 60 seconds

**Solution:**
- Close old tickets (reduce to < 20 active)
- OR increase poll interval to 120 seconds
- OR optimize query to only check recent tickets

---

### **Issue: Poller shows "No new emails"**

**Problem:** Email already marked as read OR not in inbox

**Solution:**
- Mark email as unread in Gmail
- Check spam folder
- Verify email exists in INBOX (not Archives)

---

### **Issue: Email appears but wrong ticket**

**Problem:** Multiple tickets from same customer

**Solution:**
- Email matches by subject first
- Check both tickets have unique subjects
- Use email threading (In-Reply-To header)

---

### **Issue: IMAP authentication failed**

**Problem:** Wrong credentials or app password

**Solution:**
- Regenerate app password in Google account
- Copy/paste carefully (no spaces)
- Use app password, not regular password
- Verify 2FA is enabled

---

## ✅ **Quick Checklist**

Run through this in order:

- [ ] Customer replied to email (check their Sent folder)
- [ ] Email is in your inbox and unread
- [ ] Poller is running (shows "✅ Running")
- [ ] Ticket has customer email (`auchingho6@gmail.com`)
- [ ] Ticket status is ACTIVE
- [ ] Wait full 60 seconds after customer reply
- [ ] Refresh ticket page
- [ ] Check console logs for polling activity
- [ ] Reduce active tickets to < 20
- [ ] Verify IMAP credentials are correct

---

## 🎯 **Most Likely Cause**

Based on your logs showing "🎫 Found 126 active email tickets" with no further output, the issue is:

**The poller is timing out trying to check 126 tickets.**

**Solution:**
1. **Close old tickets** - Reduce to < 10 active tickets
2. **Wait 60 seconds** - Let poller run with fewer tickets
3. **Check logs** - Should now show email processing

---

## 🆘 **Still Not Working?**

If none of the above works, the issue might be:
1. Prisma client type mismatch (we saw errors earlier)
2. Runtime exception in ticket-email-receiver.ts
3. IMAP connection silently failing

**Next steps:**
1. Check browser console for errors
2. Look for error messages in server logs
3. Add more console.log statements to ticket-email-receiver.ts
4. Test with just 1-2 active tickets

---

**Created:** October 17, 2025  
**For Ticket:** cmguh0dgy0001ep98j3g1i6ut  
**Customer:** auchingho6@gmail.com
