# Advanced Assignment Features - Complete Implementation Guide

## 🎯 Overview

The Advanced Assignment Features provide intelligent user assignment capabilities with:
- **Smart user selection** with search and filtering
- **Real-time workload indicators** showing agent capacity
- **Team-based filtering** for organized assignment
- **Load balancing recommendations** to distribute work evenly
- **Performance metrics** (response time, active tickets)
- **Online/offline status** indicators

---

## 📁 Files Created

### 1. **Component: User Assignment Dropdown**
**File:** `components/support/user-assignment-dropdown.tsx`

**Features:**
- ✅ User search by name/email/team
- ✅ Team filtering (Support, Sales, Technical, etc.)
- ✅ Sort by workload, response time, or name
- ✅ Visual workload indicators (Available, Light, Moderate, Heavy)
- ✅ Load balancing recommendation (shows "Best" user)
- ✅ Active ticket count per user
- ✅ Average response time display
- ✅ Online/offline status
- ✅ Compact and full variants
- ✅ Dark mode support

**Props:**
```typescript
interface UserAssignmentDropdownProps {
  currentAssignee?: string | null
  onAssign: (userId: string | null) => void
  organizationId: string
  ticketId?: string
  variant?: 'default' | 'compact'
}
```

---

### 2. **API Endpoint: Users with Statistics**
**File:** `app/api/users/route.ts`

**Endpoints:**

#### **GET /api/users**
Fetch organization users with optional workload statistics.

**Query Parameters:**
- `organizationId` - Organization ID (defaults to session user's org)
- `includeStats` - Boolean to include workload statistics
- `role` - Optional role filter (ADMIN, AGENT, etc.)

**Response:**
```json
{
  "users": [
    {
      "id": "user123",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "AGENT",
      "avatar": "https://...",
      "activeTickets": 5,
      "avgResponseTime": 1200,
      "isOnline": true,
      "team": "Support",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

#### **POST /api/users (Statistics Endpoint)**
Get aggregated statistics for all users.

**Request:**
```json
{
  "organizationId": "org123"
}
```

**Response:**
```json
{
  "ticketDistribution": [
    { "userId": "user1", "count": 5 },
    { "userId": "user2", "count": 3 }
  ],
  "statusDistribution": [
    { "status": "ACTIVE", "count": 10 },
    { "status": "RESOLVED", "count": 20 }
  ],
  "unassignedCount": 2,
  "avgTicketsPerUser": 4.5,
  "workloadBalance": 1.2,
  "totalActiveTickets": 18
}
```

---

### 3. **UI Component: Badge**
**File:** `components/ui/badge.tsx` (already exists)

Used for displaying user status, workload levels, and recommendations.

---

## 🎨 Usage Examples

### Example 1: Basic Usage in Ticket Detail Page

```typescript
'use client'

import { UserAssignmentDropdown } from '@/components/support/user-assignment-dropdown'
import { useState } from 'react'

export default function TicketDetailPage({ ticket, organizationId }) {
  const [assignedTo, setAssignedTo] = useState(ticket.assignedUserId)

  const handleAssign = async (userId: string | null) => {
    // Update ticket assignment
    const response = await fetch(`/api/support/tickets/${ticket.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedUserId: userId })
    })
    
    if (response.ok) {
      setAssignedTo(userId)
      // Optionally refresh data or show success message
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Assigned To
        </label>
        <UserAssignmentDropdown
          currentAssignee={assignedTo}
          onAssign={handleAssign}
          organizationId={organizationId}
          ticketId={ticket.id}
        />
      </div>
    </div>
  )
}
```

### Example 2: Compact Variant in Ticket List

```typescript
import { UserAssignmentDropdown } from '@/components/support/user-assignment-dropdown'

export function TicketRow({ ticket, organizationId }) {
  const handleAssign = async (userId: string | null) => {
    // Quick assign from list view
    await updateTicketAssignment(ticket.id, userId)
  }

  return (
    <tr>
      <td>{ticket.subject}</td>
      <td>{ticket.status}</td>
      <td>
        <UserAssignmentDropdown
          currentAssignee={ticket.assignedUserId}
          onAssign={handleAssign}
          organizationId={organizationId}
          variant="compact"
        />
      </td>
    </tr>
  )
}
```

### Example 3: Bulk Assignment

```typescript
import { UserAssignmentDropdown } from '@/components/support/user-assignment-dropdown'

export function BulkAssignModal({ selectedTicketIds, organizationId }) {
  const handleBulkAssign = async (userId: string | null) => {
    const response = await fetch('/api/support/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign',
        ticketIds: selectedTicketIds,
        value: userId
      })
    })
    
    if (response.ok) {
      // Show success message and refresh
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Assign {selectedTicketIds.length} Tickets
      </h3>
      <UserAssignmentDropdown
        onAssign={handleBulkAssign}
        organizationId={organizationId}
      />
    </div>
  )
}
```

---

## 🔧 Integration Steps

### Step 1: Add to Ticket Detail Page

Update `app/(dashboard)/support/[id]/page.tsx`:

```typescript
import { UserAssignmentDropdown } from '@/components/support/user-assignment-dropdown'

// ... in your component
<div className="space-y-4">
  <div>
    <label className="text-sm font-medium">Assigned To</label>
    <UserAssignmentDropdown
      currentAssignee={conversation.assignedUserId}
      onAssign={handleAssign}
      organizationId={session.user.organizationId}
      ticketId={conversation.id}
    />
  </div>
</div>
```

### Step 2: Add Assignment Update Endpoint

Create `app/api/support/tickets/[id]/assign/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignedUserId } = await request.json()

  const updated = await db.conversation.update({
    where: {
      id: params.id,
      organizationId: session.user.organizationId,
    },
    data: {
      assignedUserId: assignedUserId || null,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ conversation: updated })
}
```

### Step 3: Update Ticket List

Add assignment dropdown to ticket cards in `components/support/ticket-card.tsx`.

---

## 📊 Features Breakdown

### 1. **Search Functionality**
- Real-time search across user names, emails, and teams
- Instant filtering as you type
- Clear button to reset search

### 2. **Team Filtering**
- Automatically extracts teams from user emails
- In production: Add a proper `team` field to User model
- Quick filter buttons for each team
- "All Teams" option to show everyone

### 3. **Smart Sorting**
- **By Workload:** Shows users with fewer tickets first (load balancing)
- **By Speed:** Shows fastest responders first
- **By Name:** Alphabetical sorting

### 4. **Load Balancing**
- Automatically calculates which user has the lightest workload
- Shows "Best" badge on recommended user
- Helps distribute work evenly across team

### 5. **Workload Indicators**
- **Available:** 0 active tickets (green)
- **Light:** 1-5 active tickets (blue)
- **Moderate:** 6-10 active tickets (yellow)
- **Heavy:** 11+ active tickets (red)

### 6. **Performance Metrics**
- Active ticket count per user
- Average response time in minutes
- Online/offline status (requires WebSocket in production)

---

## 🎯 Future Enhancements

### Phase 2 Improvements:
1. **Real Online Status:** Integrate WebSocket for live presence
2. **Team Management:** Add proper team/department model
3. **Skills-Based Routing:** Match tickets to users with relevant skills
4. **Auto-Assignment Rules:** Automatically assign based on criteria
5. **Round-Robin Assignment:** Distribute tickets evenly
6. **Assignment History:** Track who assigned what to whom
7. **Performance Dashboard:** Detailed agent performance metrics
8. **Availability Calendar:** Track PTO and working hours

---

## 🧪 Testing Checklist

- [ ] Search users by name
- [ ] Search users by email
- [ ] Filter by team
- [ ] Sort by workload (ascending)
- [ ] Sort by response time
- [ ] Sort alphabetically
- [ ] Assign ticket to user
- [ ] Unassign ticket
- [ ] View workload indicators
- [ ] See online/offline status
- [ ] Recommended user shows "Best" badge
- [ ] Current assignee shows "Current" badge
- [ ] Compact variant works in lists
- [ ] Full variant works in detail pages
- [ ] Dark mode displays correctly
- [ ] Mobile responsive

---

## 🐛 Troubleshooting

### Issue: Users not loading
**Solution:** Check that `/api/users` endpoint is working and user has proper organization access.

### Issue: Workload not showing
**Solution:** Ensure `includeStats=true` query parameter is passed to `/api/users`.

### Issue: Team not displaying
**Solution:** Teams are extracted from email prefixes. In production, add a proper `team` field to User model.

### Issue: Online status always false
**Solution:** Current implementation uses placeholder. Implement WebSocket or activity tracking for real presence.

---

## 📈 Performance Considerations

1. **API Caching:** Consider caching user list for 30-60 seconds
2. **Lazy Loading:** Load full stats only when dropdown opens
3. **Debounce Search:** Already implemented with 300ms delay
4. **Pagination:** For orgs with 100+ users, add pagination
5. **Virtual Scrolling:** For very long user lists

---

## ✅ Completion Status

- [x] UserAssignmentDropdown component created
- [x] Users API endpoint with statistics
- [x] Search functionality
- [x] Team filtering
- [x] Sort options (workload, speed, name)
- [x] Load balancing recommendation
- [x] Workload indicators
- [x] Dark mode support
- [x] Compact and full variants
- [x] Documentation complete

**Next Steps:**
1. Integrate into ticket detail page
2. Add to ticket list (compact variant)
3. Create assignment update endpoint
4. Test with real users
5. Consider adding real-time presence tracking

---

**Status:** ✅ **COMPLETE AND READY FOR INTEGRATION**
