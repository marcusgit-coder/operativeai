# 🚀 Quick Setup Guide - No API Key Needed!

Good news! You can run OperativeAI **without the Anthropic API key** for now.

---

## ✅ What You Have

- ✅ Supabase Database Connection
- ✅ NextAuth Secret (Generated: `408b8a18a4d97f298b4b39c692d1b29a9528f878bf6756b3ee4fb187562f8cb8`)
- ⏳ Anthropic API Key (Not needed yet!)

---

## 📝 Step 1: Update Your Database Password

1. Open the `.env` file in your editor
2. Find this line:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.hvjwtglqpzeoenvgpryl.supabase.co:5432/postgres"
   ```
3. Replace `[YOUR-PASSWORD]` with your actual Supabase database password
4. Save the file

**Example:**
```env
DATABASE_URL="postgresql://postgres:MySecurePassword123@db.hvjwtglqpzeoenvgpryl.supabase.co:5432/postgres"
```

---

## 🗄️ Step 2: Set Up Database

```powershell
# Generate Prisma Client
npm run db:generate

# Push schema to your Supabase database
npm run db:push
```

This will create all the necessary tables in your Supabase database.

---

## 👤 Step 3: Create Your First User

```powershell
# Open Prisma Studio (Database GUI)
npm run db:studio
```

Your browser will open at **http://localhost:5555**

### Create Organization:
1. Click **"Organization"** in the left sidebar
2. Click **"+ Add record"**
3. Fill in:
   - **name**: `"Your Company Name"`
   - Leave other fields as default
4. Click **"Save 1 change"**

### Create User:
1. Click **"User"** in the left sidebar
2. Click **"+ Add record"**
3. Fill in:
   - **email**: `admin@demo.com`
   - **name**: `Admin User`
   - **password**: `$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG`
     
     ⚠️ Copy this EXACT hash - it's "password123" pre-hashed
   
   - **role**: Select **ADMIN** from dropdown
   - **organizationId**: Select the organization you just created
4. Click **"Save 1 change"**

---

## 🚀 Step 4: Run the Application

```powershell
npm run dev
```

You should see:
```
▲ Next.js 14.2.13
- Local:        http://localhost:3000

✓ Ready in 2.5s
```

---

## 🔓 Step 5: Log In

1. Open your browser to **http://localhost:3000**
2. You'll be redirected to the login page
3. **Log in with:**
   - Email: `admin@demo.com`
   - Password: `password123`

4. You should see the dashboard! 🎉

---

## 📄 How Invoice Upload Works (Without AI)

Since you don't have the Anthropic API key configured:

1. **Upload works normally** - You can drag and drop invoices
2. **Status**: Invoices will be marked as "NEEDS_REVIEW"
3. **Manual entry**: You'll need to manually enter the data (for now)
4. **Data is saved**: Files are stored in the database

### When You Get API Access:

1. Get an Anthropic API key (or try alternatives)
2. Add it to `.env`:
   ```env
   ANTHROPIC_API_KEY="your-api-key-here"
   ```
3. Restart the server
4. **AI extraction will work automatically!**

---

## 🌍 API Alternatives (For Your Location)

If Anthropic is restricted, here are alternatives:

### Option 1: OpenAI GPT-4 Vision
- **Access**: More widely available
- **Capability**: Can process invoice images
- **Cost**: Similar to Claude

### Option 2: Azure OpenAI
- **Access**: Available in many regions
- **Capability**: Full GPT-4 access through Azure
- **Setup**: Requires Azure account

### Option 3: Local AI (Offline)
- **Tesseract OCR** + **OpenAI API** (text-only)
- Works without image-based AI
- Lower accuracy but privacy-focused

### Option 4: Third-party Services
- **Mindee** - Invoice parsing API
- **Veryfi** - Document extraction
- **Rossum** - AI-powered invoice processing

**Would you like me to add support for any of these alternatives?**

---

## ✨ What You Can Do Right Now

Even without AI, you have a **fully functional platform**:

✅ **Dashboard**: View all statistics  
✅ **Authentication**: Login/logout system  
✅ **Invoice Upload**: Store invoice files  
✅ **Invoice List**: View all uploaded invoices  
✅ **Activity Feed**: Track all actions  
✅ **User Management**: Via Prisma Studio  

---

## 🔧 Troubleshooting

### "Database connection failed"
- Check your Supabase password is correct in `.env`
- Verify you're connected to the internet
- Test connection: `npm run db:studio`

### "Prisma Client not found"
```powershell
npm run db:generate
```

### "Can't login"
- Verify user exists in Prisma Studio
- Check password hash is exactly: `$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG`
- Clear browser cookies

### "Invoice upload fails"
- Without API key, invoices should still upload
- Check browser console (F12) for errors
- Check terminal for server errors

---

## 📞 Next Steps

### Today:
1. ✅ Update database password in `.env`
2. ✅ Run database setup
3. ✅ Create your first user
4. ✅ Log in and explore!

### This Week:
1. Test invoice uploads (manual review)
2. Explore the dashboard
3. Add team members
4. Research API alternatives for your region

### Future:
1. Add AI capabilities (when available)
2. Build support conversation interface
3. Create knowledge base
4. Onboard first client

---

## 💡 Tips

**Manual Invoice Review Workflow:**
1. User uploads invoice → Stored in database
2. You open Prisma Studio
3. Edit the Invoice record manually:
   - Add vendor name
   - Add invoice number
   - Add amounts
   - Add dates
4. Change status to "COMPLETED"

**Later with AI:**
1. User uploads invoice → AI extracts automatically
2. Review only low-confidence items
3. Save hours of manual work!

---

## 🎯 Your Current Setup

```
✅ Database: Supabase (PostgreSQL)
✅ Auth Secret: Generated & Secure
⏳ AI: Not configured (optional)
📊 Platform: Fully functional without AI
🚀 Status: Ready to run!
```

---

## 🆘 Need Help?

**Common Commands:**
```powershell
npm run dev          # Start the app
npm run db:studio    # Open database GUI
npm run db:push      # Update database schema
```

**Getting API Key (Future):**
- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/
- **Azure OpenAI**: https://azure.microsoft.com/en-us/products/ai-services/openai-service

---

## ✅ Quick Checklist

- [ ] Updated database password in `.env`
- [ ] Ran `npm run db:generate`
- [ ] Ran `npm run db:push`
- [ ] Created organization in Prisma Studio
- [ ] Created user in Prisma Studio
- [ ] Started dev server with `npm run dev`
- [ ] Logged in successfully
- [ ] Explored dashboard

---

**You're all set! Start the app and explore!** 🚀

**Questions?** Check the other docs:
- SETUP.md - Detailed troubleshooting
- README.md - Full documentation
- START_HERE.md - Complete overview
