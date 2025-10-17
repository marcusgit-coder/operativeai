import Imap from "imap"
import { simpleParser, ParsedMail } from "mailparser"
import { db } from "@/lib/db"
import { notifyTicketReply } from "@/lib/notifications/triggers"

export interface EmailConfig {
  username: string
  password: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
}

export interface ParsedEmail {
  messageId: string
  from: { address: string; name: string }
  to: string[]
  subject: string
  text?: string
  html?: string
  inReplyTo?: string
  references?: string[]
  date: Date
}

export class TicketEmailReceiver {
  private imap: Imap
  private organizationId: string
  private config: EmailConfig

  constructor(organizationId: string, config: EmailConfig) {
    this.organizationId = organizationId
    this.config = config

    this.imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.imapHost,
      port: config.imapPort,
      tls: config.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    })

    this.imap.on("error", (err: Error) => {
      console.error("📧 IMAP Error:", err)
    })
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        console.log("✅ IMAP connection established")
        resolve()
      })
      this.imap.once("error", reject)
      this.imap.connect()
    })
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.imap.once("end", () => {
        console.log("🔌 IMAP connection closed")
        resolve()
      })
      this.imap.end()
    })
  }

  /**
   * Fetch emails only for active tickets
   * This is much more efficient than parsing every email
   */
  async fetchTicketReplies(): Promise<number> {
    let processedCount = 0

    try {
      // Get all active email conversations for this organization
      const activeTickets = await db.conversation.findMany({
        where: {
          organizationId: this.organizationId,
          channel: "EMAIL",
          status: "ACTIVE",
          NOT: {
            customerEmail: null
          }
        },
        select: {
          id: true,
          customerEmail: true,
          subject: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc" // Most recent first
        },
      })

      console.log(`🎫 Found ${activeTickets.length} active email tickets`)

      if (activeTickets.length === 0) {
        return 0
      }

      // Group tickets by customer email to avoid fetching same inbox multiple times
      const ticketsByCustomer = new Map<string, typeof activeTickets>()
      
      for (const ticket of activeTickets) {
        if (!ticket.customerEmail) continue
        
        const existing = ticketsByCustomer.get(ticket.customerEmail) || []
        ticketsByCustomer.set(ticket.customerEmail, [...existing, ticket])
      }

      console.log(`👥 Checking ${ticketsByCustomer.size} unique customers`)

      // For each customer, fetch their emails once and match to their tickets
      for (const [customerEmail, customerTickets] of Array.from(ticketsByCustomer.entries())) {
        const replies = await this.fetchEmailsFromSender(customerEmail)
        
        if (replies.length === 0) continue

        console.log(`📧 Found ${replies.length} emails from ${customerEmail}, matching to ${customerTickets.length} ticket(s)`)
        
        for (const email of replies) {
          console.log(`📧 Processing email with subject: "${email.subject}"`)
          
          // Try to find the best matching ticket for this email
          let matchedTicket: typeof customerTickets[0] | null = null
          
          // First, try to match by subject
          for (const ticket of customerTickets) {
            if (ticket.subject && email.subject) {
              const normalizedEmailSubject = this.normalizeSubject(email.subject)
              const normalizedTicketSubject = this.normalizeSubject(ticket.subject)
              
              console.log(`   Comparing: email="${normalizedEmailSubject}" vs ticket="${normalizedTicketSubject}" (${ticket.id.slice(0,8)})`)
              
              if (normalizedEmailSubject === normalizedTicketSubject) {
                console.log(`✅ Matched email to ticket ${ticket.id.slice(0,8)} by subject: "${normalizedTicketSubject}"`)
                matchedTicket = ticket
                break
              }
            }
          }
          
          // If no match found, check if this is a brand new ticket or a reply
          if (!matchedTicket && customerTickets.length > 0) {
            // Check if email is a reply (has In-Reply-To or References headers)
            const isReply = email.inReplyTo || (email.references && email.references.length > 0)
            
            console.log(`   Email headers: In-Reply-To="${email.inReplyTo || 'none'}", References=${email.references?.length || 0}`)
            
            if (isReply) {
              // It's a reply but we couldn't match it - use most recent ticket
              matchedTicket = customerTickets[0]
              console.log(`⚠️  Reply without subject match, using most recent ticket: ${matchedTicket.id.slice(0,8)}`)
              await this.processTicketReply(email, matchedTicket.id)
              processedCount++
            } else {
              // It's a brand new email - create a new ticket
              console.log(`📝 New email detected (no reply headers), creating new ticket for "${email.subject}"`)
              const newTicket = await this.createNewTicket(email, customerEmail)
              if (newTicket) {
                await this.processTicketReply(email, newTicket.id)
                processedCount++
              }
            }
          } else if (matchedTicket) {
            await this.processTicketReply(email, matchedTicket.id)
            processedCount++
          } else if (customerTickets.length === 0) {
            // No existing tickets for this customer - create new ticket
            console.log(`📝 First email from customer, creating new ticket`)
            const newTicket = await this.createNewTicket(email, customerEmail)
            if (newTicket) {
              await this.processTicketReply(email, newTicket.id)
              processedCount++
            }
          }
        }
      }

      console.log(`✅ Processed ${processedCount} ticket replies`)
      return processedCount
      
    } catch (error) {
      console.error("❌ Error fetching ticket replies:", error)
      throw error
    }
  }

  /**
   * Fetch emails from a specific sender sent to your organization email
   */
  private async fetchEmailsFromSender(senderEmail: string): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        // Search for emails FROM customer TO your org email in the last 7 days
        // Don't use UNSEEN filter because we track processed emails in DB
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sinceDate = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '-')
        
        // Search for emails FROM the customer AND TO your organization email
        this.imap.search([["FROM", senderEmail], ["TO", this.config.username], ["SINCE", sinceDate]], (err, results) => {
          if (err) {
            reject(err)
            return
          }

          if (!results || results.length === 0) {
            console.log(`📭 No emails found from ${senderEmail} in the last 7 days`)
            resolve([])
            return
          }

          console.log(`📨 Found ${results.length} emails from ${senderEmail} (last 7 days)`)

          const fetch = this.imap.fetch(results, { bodies: "", markSeen: false })
          const emails: ParsedEmail[] = []
          let processed = 0

          fetch.on("message", (msg: any) => {
            msg.on("body", (stream: any) => {
              simpleParser(stream, (err: any, parsed: any) => {
                if (err) {
                  console.error("Error parsing email:", err)
                  return
                }

                emails.push(this.convertToEmailFormat(parsed))
                processed++
              })
            })
          })

          fetch.once("error", reject)
          fetch.once("end", () => {
            // Wait a bit for all emails to be parsed
            setTimeout(() => resolve(emails), 500)
          })
        })
      })
    })
  }

  /**
   * Check if email is relevant to ticket using multiple strategies
   */
  private isEmailRelevantToTicket(
    email: ParsedEmail,
    ticket: { id: string; subject: string | null; externalId: string | null; messages: any[] }
  ): boolean {
    // Strategy 1: Check In-Reply-To header (most reliable)
    if (email.inReplyTo && ticket.messages.length > 0) {
      const ourMessageIds = ticket.messages.map((m) => m.externalId)
      if (ourMessageIds.includes(email.inReplyTo)) {
        console.log(`✅ Matched by In-Reply-To: ${email.inReplyTo}`)
        return true
      }
    }

    // Strategy 2: Check References header
    if (email.references && email.references.length > 0 && ticket.messages.length > 0) {
      const ourMessageIds = ticket.messages.map((m) => m.externalId)
      const hasMatch = email.references.some((ref) => ourMessageIds.includes(ref))
      if (hasMatch) {
        console.log(`✅ Matched by References header`)
        return true
      }
    }

    // Strategy 3: Subject matching (less reliable, but works for non-threaded clients)
    if (ticket.subject && email.subject) {
      const normalizedEmailSubject = this.normalizeSubject(email.subject)
      const normalizedTicketSubject = this.normalizeSubject(ticket.subject)
      
      if (normalizedEmailSubject === normalizedTicketSubject) {
        console.log(`✅ Matched by subject: "${normalizedTicketSubject}"`)
        return true
      }
    }

    console.log(`⏭️  Email not relevant to ticket ${ticket.id}`)
    return false
  }

  /**
   * Create a new ticket from an incoming email
   */
  private async createNewTicket(email: ParsedEmail, customerEmail: string): Promise<{ id: string } | null> {
    try {
      const conversation = await db.conversation.create({
        data: {
          organizationId: this.organizationId,
          channel: "EMAIL",
          customerEmail: customerEmail,
          customerName: email.from.name || customerEmail,
          subject: email.subject || "(No subject)",
          status: "ACTIVE",
          priority: "MEDIUM",
          assignedToHuman: false,
          lastMessageAt: email.date,
          unreadCount: 1,
        },
      })

      console.log(`✅ Created new ticket ${conversation.id.slice(0, 8)} for "${email.subject}"`)
      return { id: conversation.id }
    } catch (error) {
      console.error(`❌ Error creating new ticket:`, error)
      return null
    }
  }

  /**
   * Process a ticket reply
   */
  private async processTicketReply(email: ParsedEmail, ticketId: string): Promise<void> {
    try {
      // Check if we already processed this message
      const existingMessage = await db.message.findFirst({
        where: { externalId: email.messageId },
      })

      if (existingMessage) {
        console.log(`⏭️  Message ${email.messageId} already processed`)
        return
      }

      // Fetch conversation data for notification
      const conversation = await db.conversation.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          organizationId: true,
          subject: true,
          customerName: true,
        },
      })

      if (!conversation) {
        console.error(`❌ Conversation ${ticketId} not found`)
        return
      }

      // Create inbound message
      // Prefer text content, fallback to stripped HTML, then raw HTML
      let messageContent = email.text
      
      if (!messageContent && email.html) {
        // Strip HTML tags for plain text storage
        messageContent = email.html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
      }
      
      if (!messageContent) {
        messageContent = "(No content)"
      }
      
      console.log(`📧 Email content (${messageContent.length} chars): ${messageContent.substring(0, 150)}...`)
      
      const message = await db.message.create({
        data: {
          conversationId: ticketId,
          content: messageContent,
          sender: email.from.name || email.from.address,
          senderEmail: email.from.address,
          direction: "INBOUND",
          channel: "EMAIL",
          externalId: email.messageId,
          sentAt: email.date,
          isAiGenerated: false,
          status: "SENT",
        },
      })

      // Update conversation
      await db.conversation.update({
        where: { id: ticketId },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
          updatedAt: new Date(),
        },
      })

      // Send notification to admins
      await notifyTicketReply(
        {
          id: message.id,
          content: message.content,
          sender: message.sender,
          direction: message.direction,
        },
        {
          id: conversation.id,
          organizationId: conversation.organizationId,
          subject: conversation.subject,
          customerName: conversation.customerName,
        }
      )

      console.log(`✅ Created inbound message for ticket ${ticketId}`)
      
    } catch (error) {
      console.error(`❌ Error processing ticket reply:`, error)
      throw error
    }
  }

  /**
   * Convert mailparser output to our format
   */
  private convertToEmailFormat(parsed: ParsedMail): ParsedEmail {
    const from = this.extractEmail(parsed.from)
    const to = this.extractEmails(parsed.to)

    return {
      messageId: parsed.messageId || `generated-${Date.now()}`,
      from,
      to,
      subject: parsed.subject || "(No subject)",
      text: parsed.text,
      html: parsed.html ? String(parsed.html) : undefined,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      date: parsed.date || new Date(),
    }
  }

  private extractEmail(addressObj: any): { address: string; name: string } {
    if (!addressObj) return { address: "", name: "" }
    
    if (addressObj.value && addressObj.value.length > 0) {
      const addr = addressObj.value[0]
      return {
        address: addr.address || "",
        name: addr.name || "",
      }
    }
    
    return { address: "", name: "" }
  }

  private extractEmails(addressObj: any): string[] {
    if (!addressObj) return []
    
    if (addressObj.value && Array.isArray(addressObj.value)) {
      return addressObj.value.map((addr: any) => addr.address || "")
    }
    
    return []
  }

  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(Re:|RE:|Fwd:|FWD:|Fw:)\s*/gi, "")
      .trim()
      .toLowerCase()
  }
}

/**
 * Check ticket replies for an organization
 */
export async function checkTicketEmailReplies(
  organizationId: string,
  config: EmailConfig
): Promise<number> {
  const receiver = new TicketEmailReceiver(organizationId, config)
  
  try {
    await receiver.connect()
    const count = await receiver.fetchTicketReplies()
    await receiver.disconnect()
    return count
  } catch (error) {
    console.error("Error checking ticket emails:", error)
    await receiver.disconnect()
    throw error
  }
}
