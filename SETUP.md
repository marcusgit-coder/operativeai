# 🚀 OperativeAI Setup Guide

Complete step-by-step guide to get OperativeAI running on your machine.

---

## ✅ Step 1: Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** database running ([Download](https://www.postgresql.org/download/))
- ✅ **Anthropic API Key** ([Get one](https://console.anthropic.com/))

### Verify Installation

```powershell
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

---

## 📦 Step 2: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages (~2-3 minutes).

---

## 🗄️ Step 3: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. **Install PostgreSQL** if not already installed
2. **Create a database:**

```sql
CREATE DATABASE operative_ai;
```

3. **Note your connection details:**
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres` (or your username)
   - Password: (your password)
   - Database: `operative_ai`

### Option B: Cloud Database (Recommended for Beginners)

Use a free cloud PostgreSQL provider:

**Supabase (Recommended):**
1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Go to Settings → Database
5. Copy the connection string

**Neon.tech:**
1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a project
4. Copy the connection string

---

## 🔐 Step 4: Configure Environment Variables

1. **Copy the example environment file:**

```powershell
copy .env.example .env
```

2. **Edit `.env` file with your details:**

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/operative_ai?schema=public"

# Authentication Secret (Generate a random string)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-32-char-minimum-string"

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-your-api-key-here"
```

### Generate NEXTAUTH_SECRET

Run this in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

---

## 🏗️ Step 5: Initialize Database

Generate Prisma Client and create database tables:

```powershell
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push
```

You should see:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your schema.
```

---

## 👤 Step 6: Create Your First User

### Method 1: Using Prisma Studio (Visual Interface)

1. **Open Prisma Studio:**

```powershell
npm run db:studio
```

2. Browser opens at http://localhost:5555

3. **Create an Organization:**
   - Click "Organization" in left sidebar
   - Click "+ Add record"
   - Fill in:
     - `name`: "Your Company Name"
     - Leave other fields as default
   - Click "Save 1 change"

4. **Create a User:**
   - Click "User" in left sidebar
   - Click "+ Add record"
   - Fill in:
     - `email`: "admin@demo.com"
     - `name`: "Admin User"
     - `password`: `$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG`
       (This is "password123" pre-hashed)
     - `role`: Select "ADMIN"
     - `organizationId`: Select the organization you just created
   - Click "Save 1 change"

### Method 2: Using SQL (Advanced)

Connect to your database and run:

```sql
-- Create organization
INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") 
VALUES ('org_demo_123', 'Demo Company', NOW(), NOW());

-- Create user (password is "password123")
INSERT INTO "User" (id, email, name, password, role, "organizationId", "createdAt", "updatedAt")
VALUES (
  'user_demo_123',
  'admin@demo.com',
  'Admin User',
  '$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG',
  'ADMIN',
  'org_demo_123',
  NOW(),
  NOW()
);
```

---

## 🎉 Step 7: Run the Application

Start the development server:

```powershell
npm run dev
```

You should see:

```
▲ Next.js 14.2.13
- Local:        http://localhost:3000
- Environments: .env

✓ Ready in 2.5s
```

---

## 🔓 Step 8: Log In

1. Open your browser to **http://localhost:3000**
2. You'll be redirected to the login page
3. **Log in with:**
   - Email: `admin@demo.com`
   - Password: `password123`

4. You should see the dashboard!

---

## 🧪 Step 9: Test Invoice Upload

1. Click **"Upload Invoice"** from the Quick Actions
2. Drag and drop any invoice PDF or image
3. Wait 10-15 seconds for AI processing
4. View the extracted data!

**Need a test invoice?** 
- Use any real invoice you have
- Or create a simple text document with:
  - Company name
  - Invoice number
  - Date
  - Amount

---

## ✨ You're All Set!

Your OperativeAI platform is now running. Explore:

- 📊 **Dashboard**: Overview of all activity
- 📄 **Invoices**: Upload and manage invoices
- 💬 **Support**: Coming soon
- 📚 **Knowledge Base**: Coming soon
- ⚙️ **Settings**: Coming soon

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'next'"

```powershell
npm install
```

### Error: "Prisma Client not found"

```powershell
npm run db:generate
```

### Error: "Database connection failed"

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection with Prisma Studio: `npm run db:studio`

### Error: "Invalid credentials" on login

- Check user exists in Prisma Studio
- Verify email is exactly `admin@demo.com`
- Verify password is the pre-hashed version shown above
- Clear browser cookies and try again

### Error: "ANTHROPIC_API_KEY is not set"

- Check `.env` file exists
- Verify ANTHROPIC_API_KEY is set correctly
- Restart the dev server: Stop with Ctrl+C, then `npm run dev`

### Invoice upload fails

- Check file size (must be <10MB)
- Verify file type (PDF, JPG, or PNG only)
- Check API key is valid in Anthropic console
- Check browser console for errors (F12)

---

## 📊 Next Steps

### Customize Your Setup

1. **Change Password:**
   - Go to Prisma Studio
   - Edit the User record
   - Generate a new hashed password:
   
   ```powershell
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourNewPassword', 10))"
   ```

2. **Add More Users:**
   - Repeat Step 6 with different emails
   - Assign roles: ADMIN or VIEWER

3. **Configure Organization:**
   - Edit organization in Prisma Studio
   - Add industry, employee count, etc.

### Start Building

Check the README.md for:
- Project structure
- Available features
- Development roadmap
- API documentation

---

## 🆘 Need Help?

**Common Commands:**

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run db:studio    # Open database GUI
npm run db:push      # Update database schema
npm run lint         # Check code quality
```

**Database Issues:**
- Open Prisma Studio to inspect data
- Check PostgreSQL logs
- Verify .env DATABASE_URL

**Application Issues:**
- Check browser console (F12)
- Check terminal for errors
- Restart dev server

---

## 🎯 Production Deployment

Ready to deploy? See DEPLOYMENT.md (coming soon) or:

1. **Vercel (Recommended):**
   - Push to GitHub
   - Import to Vercel
   - Add environment variables
   - Deploy!

2. **Other Platforms:**
   - Railway
   - Render
   - AWS/Azure/GCP

---

## 📝 Security Reminders

- ⚠️ Never commit `.env` to version control
- ⚠️ Change default passwords immediately
- ⚠️ Use strong NEXTAUTH_SECRET in production
- ⚠️ Rotate API keys regularly
- ⚠️ Enable 2FA on Anthropic account

---

**Happy Building! 🚀**

Questions? Check the code comments or review the PRD document.
