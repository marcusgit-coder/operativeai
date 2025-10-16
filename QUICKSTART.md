# OperativeAI - Quick Start Checklist

Follow these steps in order:

## ☐ 1. Install Node.js
- Download from https://nodejs.org/
- Version 18 or higher required
- Verify: `node --version`

## ☐ 2. Install PostgreSQL
- **Option A**: Local PostgreSQL from https://www.postgresql.org/
- **Option B**: Free cloud database from https://supabase.com (recommended)

## ☐ 3. Get Anthropic API Key
- Sign up at https://console.anthropic.com/
- Create an API key
- Keep it handy for step 5

## ☐ 4. Install Dependencies
```powershell
npm install
npm run db:generate
```

## ☐ 5. Configure Environment
```powershell
copy .env.example .env
# Edit .env with your database URL and API key
```

Required values in `.env`:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ANTHROPIC_API_KEY` - Your API key from step 3

## ☐ 6. Set Up Database
```powershell
npm run db:push
```

## ☐ 7. Create First User
```powershell
npm run db:studio
```

1. Open http://localhost:5555
2. Create Organization: name = "Your Company"
3. Create User:
   - email: admin@demo.com
   - name: Admin
   - password: `$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG`
   - role: ADMIN
   - organization: Select your company

## ☐ 8. Run the App
```powershell
npm run dev
```

## ☐ 9. Log In
- Go to http://localhost:3000
- Email: admin@demo.com
- Password: password123

## ☐ 10. Test Upload
- Click "Upload Invoice"
- Drop a PDF or image invoice
- Watch AI extract the data!

---

## 🎉 Done!

You're now running OperativeAI locally.

**Next Steps:**
- Read SETUP.md for detailed troubleshooting
- Read README.md for project documentation
- Start building new features!

**Need Help?**
- Check browser console (F12) for errors
- Check terminal for server errors
- Review SETUP.md troubleshooting section
