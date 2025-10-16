# 🎯 Quick Reference Card

## Your Configuration

### ✅ What's Set Up:
- **Database**: Supabase PostgreSQL
- **Auth Secret**: Generated ✓
- **AI**: Not configured (optional)

### ⚠️ What You Need to Do:
1. Add your Supabase password to `.env`
2. Run database setup commands
3. Create your first user

---

## 🔑 Login Credentials (After Setup)

```
Email:    admin@demo.com
Password: password123
```

---

## ⚡ Essential Commands

```powershell
# First time setup
npm run db:generate      # Generate Prisma Client
npm run db:push          # Create database tables
npm run db:studio        # Open database GUI (create user here)

# Run the app
npm run dev              # Start development server

# Access points
http://localhost:3000    # Main application
http://localhost:5555    # Database GUI (Prisma Studio)
```

---

## 📋 User Creation (In Prisma Studio)

### Organization:
```
name: "Your Company Name"
```

### User:
```
email:    admin@demo.com
name:     Admin User
password: $2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG
role:     ADMIN
organization: (select the one you created)
```

⚠️ **Important**: Copy the password hash exactly as shown!

---

## 🚀 Quick Start (5 Steps)

```powershell
# 1. Edit .env - add your password
notepad .env

# 2. Generate Prisma
npm run db:generate

# 3. Create tables
npm run db:push

# 4. Create user (opens browser)
npm run db:studio
# → Create Organization
# → Create User with credentials above

# 5. Start app
npm run dev
# → Open http://localhost:3000
# → Login with admin@demo.com / password123
```

---

## 📁 Important Files

```
.env                     ← Add your password here
SETUP_WITHOUT_API.md     ← Full setup guide
QUICKSTART.md            ← Alternative setup path
README.md                ← Main documentation
```

---

## 🐛 Quick Troubleshooting

### Can't connect to database?
- Check password in `.env` is correct
- Verify internet connection
- Test: `npm run db:studio`

### Prisma Client error?
```powershell
npm run db:generate
```

### Can't login?
- Check user exists in Prisma Studio
- Verify password hash is correct
- Clear browser cookies

---

## 💡 Without AI Key

**What works:**
- ✅ Full dashboard
- ✅ User authentication
- ✅ Invoice uploads (saved to database)
- ✅ Invoice list
- ✅ Activity tracking

**What's manual:**
- ⏳ Invoice data extraction (you edit in Prisma Studio)

**When you get API:**
- Add to `.env`: `ANTHROPIC_API_KEY="sk-..."`
- Restart server
- AI extraction works automatically!

---

## 🆘 Need Help?

Open the detailed guides:
- **SETUP_WITHOUT_API.md** - Your custom guide
- **SETUP.md** - Full troubleshooting
- **START_HERE.md** - Complete overview

---

## ✅ Success Checklist

- [ ] Updated `.env` with Supabase password
- [ ] Ran `npm run db:generate`
- [ ] Ran `npm run db:push`
- [ ] Created organization in Prisma Studio
- [ ] Created user in Prisma Studio
- [ ] Started server with `npm run dev`
- [ ] Logged in at localhost:3000
- [ ] Saw the dashboard

**All done? You're running OperativeAI!** 🎉
