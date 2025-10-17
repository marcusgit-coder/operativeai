# Archived Tickets Feature

## Overview
Added a comprehensive archive system for managing closed tickets with options to view archived tickets and permanently delete them individually or in bulk.

## Features

### 1. **Archive Section**
- New "Archived" tab in the Support page showing all CLOSED tickets
- Displays ticket details: subject, customer, messages count, and closed date
- Sorted by most recently closed first

### 2. **Statistics Dashboard**
- Added "Archived" card to the statistics showing count of archived tickets
- Updated grid from 4 to 5 columns to accommodate the new metric

### 3. **Archive Actions**
- **Individual Delete**: Each archived ticket has a delete button (trash icon)
  - Confirmation dialog before deletion
  - Permanently removes ticket and all associated messages
  - Only available for CLOSED tickets

- **Clear All Archives**: Bulk delete button in the archive section
  - Two-step confirmation to prevent accidental deletion
  - Shows count of tickets to be deleted
  - Displays confirmation message after completion

### 4. **Ticket Status Flow**
```
ACTIVE → RESOLVED → CLOSED (Archived)
   ↓         ↓
   ←─────────
   (Reopen)
```

- **Active**: Ticket is open and being worked on
- **Resolved**: Issue is resolved but ticket is still accessible
- **Closed/Archived**: Ticket is moved to archive section (can be permanently deleted)

## Components Created

### `components/support/archived-tickets.tsx`
- Client component for displaying archived tickets
- Handles individual and bulk deletion
- Shows confirmation dialogs
- Responsive design with dark mode support

### `components/support/ticket-tabs.tsx`
- Tab navigation for Active, Resolved, and Archived tickets
- Shows count badges for each status
- Color-coded tabs (blue for Active, green for Resolved, gray for Archived)
- Smooth transitions between views

### `app/api/support/archive/route.ts`
- DELETE endpoint for removing archived tickets
- Supports two modes:
  - `{ ticketId: "xxx" }` - Delete specific ticket
  - `{ deleteAll: true }` - Delete all archived tickets
- Security: Only deletes tickets that belong to the organization and have status "CLOSED"

## Usage

### Archiving a Ticket
1. Open any ticket
2. Click "Mark Resolved" to resolve the ticket
3. Click "Archive" to move it to the archive section
4. Ticket now appears in the "Archived" tab

### Viewing Archived Tickets
1. Go to Support page
2. Click the "Archived" tab
3. See all closed tickets with their details

### Deleting Individual Tickets
1. In the "Archived" tab, find the ticket
2. Click the trash icon on the right
3. Confirm deletion in the dialog
4. Ticket is permanently removed

### Clearing All Archives
1. In the "Archived" tab, click "Clear All Archives"
2. Review the count of tickets to be deleted
3. Click "Confirm" to proceed or "Cancel" to abort
4. All archived tickets are permanently removed

## Database Schema

The feature uses existing Conversation model fields:
- `status`: "ACTIVE" | "RESOLVED" | "CLOSED"
- `closedAt`: Timestamp when ticket was archived (set automatically)

When a ticket is archived (status = "CLOSED"):
- `closedAt` is set to current timestamp
- Ticket is filtered to "Archived" tab
- Can only be deleted (not reopened directly from archive)

## API Routes

### DELETE /api/support/archive
**Request Body:**
```json
// Delete specific ticket
{
  "ticketId": "cmguh0dgy0001ep98j3g1i6ut"
}

// Delete all archived tickets
{
  "deleteAll": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully",
  "count": 1  // Only for deleteAll
}
```

## Security

- All operations require authentication
- Only tickets belonging to user's organization can be deleted
- Only tickets with status "CLOSED" can be deleted
- Confirmation dialogs prevent accidental deletion
- Cascade delete removes all associated messages

## UI/UX Features

- ✅ Color-coded status indicators
- ✅ Time ago display for closed dates
- ✅ Loading states during deletion
- ✅ Success/error messages
- ✅ Two-step confirmation for bulk deletion
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Icon-based actions
- ✅ Hover effects and transitions

## Benefits

1. **Reduced Clutter**: Active tickets page only shows relevant tickets
2. **Better Performance**: Fewer tickets to query and display in main view
3. **Data Hygiene**: Ability to permanently delete old/test tickets
4. **Clear Workflow**: Distinct stages for ticket lifecycle
5. **User Control**: Granular and bulk deletion options

## Future Enhancements

- [ ] Auto-archive tickets after X days of being resolved
- [ ] Export archived tickets before deletion
- [ ] Restore from archive feature
- [ ] Archive filters (by date, customer, channel)
- [ ] Archive search functionality
