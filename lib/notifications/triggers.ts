import { createNotification, createBulkNotifications } from "./notification-service"

/**
 * Trigger notification when a new support ticket is created
 */
export async function notifyNewTicket(ticket: {
  id: string
  organizationId: string
  customerName?: string | null
  customerEmail: string
  subject?: string | null
  priority: string
  channel: string
}) {
  // For now, notify all admins in the organization
  // TODO: Later, implement assignment logic to notify specific users
  const admins = await getOrganizationAdmins(ticket.organizationId)

  if (admins.length === 0) {
    console.log("⚠️ No admins found for organization:", ticket.organizationId)
    return
  }

  const priority = ticket.priority === "URGENT" ? "URGENT" : "NORMAL"

  await createBulkNotifications(admins, {
    organizationId: ticket.organizationId,
    type: "NEW_TICKET",
    title: "New Support Ticket",
    message: `New ${ticket.channel.toLowerCase()} ticket from ${ticket.customerName || ticket.customerEmail}: ${ticket.subject || "No subject"}`,
    relatedType: "ticket",
    relatedId: ticket.id,
    relatedUrl: `/support/${ticket.id}`,
    priority: priority as any,
    category: "support",
    data: {
      ticketId: ticket.id,
      customerEmail: ticket.customerEmail,
      channel: ticket.channel,
    },
  })

  console.log("✅ Notified", admins.length, "admins about new ticket")
}

/**
 * Trigger notification when a ticket receives a reply
 */
export async function notifyTicketReply(
  message: {
    id: string
    content: string
    sender: string
    direction: string
  },
  conversation: {
    id: string
    organizationId: string
    subject?: string | null
    customerName?: string | null
  }
) {
  // Only notify if it's a customer reply (inbound)
  if (message.direction !== "INBOUND") {
    return
  }

  const admins = await getOrganizationAdmins(conversation.organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId: conversation.organizationId,
    type: "TICKET_REPLY",
    title: "New Reply",
    message: `${conversation.customerName || "Customer"} replied to "${conversation.subject || "ticket"}"`,
    relatedType: "ticket",
    relatedId: conversation.id,
    relatedUrl: `/support/${conversation.id}`,
    priority: "NORMAL",
    category: "support",
    data: {
      conversationId: conversation.id,
      messageId: message.id,
    },
  })

  console.log("✅ Notified admins about ticket reply")
}

/**
 * Trigger notification when ticket status changes
 */
export async function notifyTicketStatusChange(
  ticket: {
    id: string
    organizationId: string
    subject?: string | null
    status: string
  },
  oldStatus: string
) {
  const admins = await getOrganizationAdmins(ticket.organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId: ticket.organizationId,
    type: "TICKET_STATUS_CHANGED",
    title: "Ticket Status Changed",
    message: `Ticket "${ticket.subject || "No subject"}" changed from ${oldStatus} to ${ticket.status}`,
    relatedType: "ticket",
    relatedId: ticket.id,
    relatedUrl: `/support/${ticket.id}`,
    priority: "LOW",
    category: "support",
    data: {
      ticketId: ticket.id,
      oldStatus,
      newStatus: ticket.status,
    },
  })

  console.log("✅ Notified admins about status change")
}

/**
 * Trigger notification when a ticket is escalated
 */
export async function notifyTicketEscalated(ticket: {
  id: string
  organizationId: string
  subject?: string | null
  customerName?: string | null
}) {
  const admins = await getOrganizationAdmins(ticket.organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId: ticket.organizationId,
    type: "TICKET_ESCALATED",
    title: "⚠️ Ticket Escalated",
    message: `Ticket from ${ticket.customerName || "customer"} has been escalated: "${ticket.subject || "No subject"}"`,
    relatedType: "ticket",
    relatedId: ticket.id,
    relatedUrl: `/support/${ticket.id}`,
    priority: "HIGH",
    category: "support",
    data: {
      ticketId: ticket.id,
    },
  })

  console.log("✅ Notified admins about escalation")
}

/**
 * Trigger notification when an invoice is processed
 */
export async function notifyInvoiceProcessed(invoice: {
  id: string
  organizationId: string
  vendorName?: string | null
  invoiceNumber?: string | null
  totalAmount?: number | null
  status: string
}) {
  const admins = await getOrganizationAdmins(invoice.organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId: invoice.organizationId,
    type: "INVOICE_PROCESSED",
    title: "Invoice Processed",
    message: `Invoice ${invoice.invoiceNumber || "#" + invoice.id.slice(0, 8)} from ${invoice.vendorName || "vendor"} has been processed`,
    relatedType: "invoice",
    relatedId: invoice.id,
    relatedUrl: `/invoices/${invoice.id}`,
    priority: "NORMAL",
    category: "billing",
    data: {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
    },
  })

  console.log("✅ Notified admins about processed invoice")
}

/**
 * Trigger notification when an invoice processing fails
 */
export async function notifyInvoiceFailed(invoice: {
  id: string
  organizationId: string
  vendorName?: string | null
  invoiceNumber?: string | null
}) {
  const admins = await getOrganizationAdmins(invoice.organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId: invoice.organizationId,
    type: "INVOICE_FAILED",
    title: "❌ Invoice Processing Failed",
    message: `Failed to process invoice ${invoice.invoiceNumber || "#" + invoice.id.slice(0, 8)} from ${invoice.vendorName || "vendor"}`,
    relatedType: "invoice",
    relatedId: invoice.id,
    relatedUrl: `/invoices/${invoice.id}`,
    priority: "HIGH",
    category: "billing",
    data: {
      invoiceId: invoice.id,
    },
  })

  console.log("✅ Notified admins about failed invoice")
}

/**
 * Send a system alert to all organization admins
 */
export async function notifySystemAlert(
  organizationId: string,
  title: string,
  message: string,
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"
) {
  const admins = await getOrganizationAdmins(organizationId)

  if (admins.length === 0) {
    return
  }

  await createBulkNotifications(admins, {
    organizationId,
    type: "SYSTEM_ALERT",
    title,
    message,
    priority,
    category: "system",
  })

  console.log("✅ Sent system alert to admins")
}

// Helper Functions

/**
 * Get all admin users for an organization
 */
async function getOrganizationAdmins(organizationId: string): Promise<string[]> {
  const { db } = await import("@/lib/db")

  const users = await db.user.findMany({
    where: {
      organizationId,
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  })

  return users.map((u) => u.id)
}
