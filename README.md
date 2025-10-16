# OperativeAI - B2B AI Automation Platform

AI-powered platform that automates administrative tasks for SMBs through invoice processing and 24/7 customer support agents.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```powershell
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

2. Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/operative_ai"
NEXTAUTH_SECRET="generate-a-random-32-char-string-here"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

**Generate a secure NEXTAUTH_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Setup

```powershell
# Push schema to database (creates all tables)
npm run db:push

# Open Prisma Studio to manage data
npm run db:studio
```

### Create First User

1. Run `npm run db:studio`
2. Go to http://localhost:5555
3. Create an **Organization**:
   - Click "+ Add record" on Organization table
   - Name: "Demo Company"
   - Save

4. Create a **User**:
   - Click "+ Add record" on User table
   - Email: `admin@demo.com`
   - Name: "Admin User"
   - Password: `$2a$10$rEaVCxKqP0VEfXBgDqYziu7vYB4QJ8JqVPKXqr9Z8w9vKGDLKJ9iG` (this is "password123" hashed)
   - Role: `ADMIN`
   - Organization: Select the organization you created
   - Save

### Run Development Server

```powershell
npm run dev
```

Visit http://localhost:3000 and login with:
- Email: `admin@demo.com`
- Password: `password123`

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── login/              # Login page
│   ├── (dashboard)/            # Protected routes
│   │   ├── dashboard/          # Main dashboard
│   │   ├── invoices/           # Invoice management
│   │   │   └── upload/         # Upload invoices
│   │   ├── support/            # Support conversations
│   │   ├── knowledge/          # Knowledge base
│   │   └── settings/           # Settings
│   ├── api/
│   │   ├── auth/               # NextAuth endpoints
│   │   │   └── [...nextauth]/
│   │   ├── invoices/           # Invoice API
│   │   │   ├── route.ts        # List invoices
│   │   │   └── upload/         # Upload & process
│   │   └── support/            # Support API
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── dashboard/              # Dashboard components
│   │   ├── stats-cards.tsx
│   │   ├── quick-actions.tsx
│   │   └── recent-activity.tsx
│   ├── header.tsx              # Top navigation
│   └── sidebar.tsx             # Side navigation
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # NextAuth config
│   ├── claude.ts               # AI integration
│   └── utils.ts                # Utilities
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

---

## 🎯 Features

### ✅ Implemented (MVP)

1. **Authentication**
   - Secure login with NextAuth
   - Session management
   - Role-based access (Admin/Viewer)

2. **Invoice Processing**
   - Upload PDF, JPG, PNG invoices
   - AI extraction using Claude 3.5 Sonnet
   - Automatic data extraction:
     - Vendor name
     - Invoice number
     - Dates (invoice & due)
     - Total amount & currency
     - Line items
   - Confidence scoring
   - Review flagging for low confidence

3. **Dashboard**
   - Real-time statistics
   - Recent activity feed
   - Quick action shortcuts

4. **Database**
   - PostgreSQL with Prisma ORM
   - Full schema for invoices, conversations, knowledge base
   - Activity logging

### 🚧 Coming Next

- [ ] Invoice list view with filters
- [ ] Support conversation interface
- [ ] Email integration for support
- [ ] Chat widget for websites
- [ ] Knowledge base management
- [ ] Organization settings
- [ ] User management
- [ ] Analytics & reporting

---

## 🔧 Available Scripts

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma Client
```

---

## 🧪 Testing the Invoice Upload

1. Navigate to http://localhost:3000/invoices/upload
2. Drag and drop a sample invoice (PDF or image)
3. Wait for AI processing (~10-15 seconds)
4. Review extracted data
5. Check dashboard for activity

**Need a test invoice?** Use any invoice PDF or create a simple one with:
- Company name
- Invoice number
- Date
- Amount

---

## 🔐 Security Notes

- **Never commit `.env`** - it's in `.gitignore`
- **Change NEXTAUTH_SECRET** in production
- **Use strong passwords** - the demo password is weak for testing only
- **Keep API keys secure** - rotate them regularly

---

## 📊 Database Schema Highlights

### User & Organization
- Multi-tenant architecture
- Each organization has its own data
- Users belong to one organization

### Invoice
- Stores uploaded files and extracted data
- Status: PENDING → PROCESSING → COMPLETED/NEEDS_REVIEW
- Confidence scoring for quality control

### Conversation & Message
- Thread-based support conversations
- AI-generated vs human messages
- Escalation workflow

### Knowledge Base
- Support articles and FAQs
- Used by AI for context
- Future: Vector embeddings for semantic search

---

## 🤖 AI Configuration

### Current Model
- **Claude 3.5 Sonnet** (claude-3-5-sonnet-20241022)
- Best-in-class for structured data extraction
- Excellent reasoning for support responses

### Cost Optimization
- Input tokens: ~$0.003 per 1K tokens
- Output tokens: ~$0.015 per 1K tokens
- Average invoice: ~$0.05-0.10
- Monitor usage in Anthropic console

---

## 🐛 Troubleshooting

### Database Connection Error
```powershell
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
npm run db:push
```

### Prisma Client Not Found
```powershell
npm run db:generate
```

### Login Not Working
- Clear browser cookies
- Check user exists in Prisma Studio
- Verify password is correctly hashed

### Invoice Upload Fails
- Check ANTHROPIC_API_KEY is set
- Verify API key is valid
- Check file size (<10MB recommended)

---

## 📞 Support & Development

### Next Steps for Development

1. **Complete Invoice List Page**
   - Create `/app/(dashboard)/invoices/page.tsx`
   - Display all processed invoices
   - Add filters and search

2. **Build Support Interface**
   - Create `/app/(dashboard)/support/page.tsx`
   - List conversations
   - Message thread view

3. **Add Email Integration**
   - Configure IMAP/SMTP
   - Poll for new emails
   - Auto-respond with AI

4. **Deploy to Production**
   - Set up Vercel or similar
   - Configure production database
   - Set environment variables

---

## 📝 License

Proprietary - OperativeAI © 2025

---

## 🎉 You're Ready!

Your OperativeAI platform is set up. Start by:
1. Logging in to the dashboard
2. Uploading a test invoice
3. Exploring the interface
4. Building additional features

**Questions?** Check the code comments or review the PRD in the repository.
