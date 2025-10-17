import Imap from "imap"
import { simpleParser, ParsedMail, AddressObject } from "mailparser"
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

export class EmailReceiver {
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

    // Error handler
    this.imap.on("error", (err: Error) => {
      console.error("📧 IMAP Error:", err)
    })
  }

  /**
   * Connect to IMAP server
   */
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

  /**
   * Disconnect from IMAP server
   */
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
   * Fetch new unread emails from inbox
   */
  async fetchNewEmails(): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        console.log(`📬 Opened INBOX - ${box.messages.total} total messages`)

        // Search for unread emails
        this.imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            reject(err)
            return
          }

          if (!results || results.length === 0) {
            console.log("📭 No new emails")
            resolve([])
            return
          }

          console.log(`📨 Found ${results.length} unread emails`)

          const emails: ParsedEmail[] = []
          const fetch = this.imap.fetch(results, {
            bodies: "",
            markSeen: true, // Mark as read after fetching
          })

          fetch.on("message", (msg, seqno) => {
            console.log(`📧 Processing email #${seqno}`)

            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error("❌ Failed to parse email:", err)
                  return
                }

                try {
                  const email = this.parseEmail(parsed)
                  emails.push(email)
                  console.log(`✅ Parsed email: ${email.subject}`)
                } catch (error) {
                  console.error("❌ Failed to extract email data:", error)
                }
              })
            })
          })

          fetch.once("error", (err) => {
            console.error("❌ Fetch error:", err)
            reject(err)
          })

          fetch.once("end", () => {
            console.log(`✅ Finished fetching ${emails.length} emails`)
            // Give a small delay for parsing to complete
            setTimeout(() => resolve(emails), 500)
          })
        })
      })
    })
  }

  /**
   * Parse email into our format
   */
  private parseEmail(parsed: ParsedMail): ParsedEmail {
    const from = this.extractAddress(parsed.from)
    const to = this.extractAddresses(parsed.to)

    return {
      messageId: parsed.messageId || this.generateMessageId(),
      from: {
        address: from?.address || "",
        name: from?.name || from?.address || "Unknown",
      },
      to,
      subject: parsed.subject || "(No Subject)",
      text: parsed.text,
      html: parsed.html || undefined,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      date: parsed.date || new Date(),
    }
  }

  /**
   * Extract single email address
   */
  private extractAddress(
    addressObj: AddressObject | AddressObject[] | undefined
  ): { address: string; name: string } | null {
    if (!addressObj) return null

    const addresses = Array.isArray(addressObj) ? addressObj : [addressObj]
    const first = addresses[0]
    if (!first || !first.value || first.value.length === 0) return null

    return {
      address: first.value[0].address || "",
      name: first.value[0].name || first.value[0].address || "",
    }
  }

  /**
   * Extract multiple email addresses
   */
  private extractAddresses(
    addressObj: AddressObject | AddressObject[] | undefined
  ): string[] {
    if (!addressObj) return []

    const addresses = Array.isArray(addressObj) ? addressObj : [addressObj]
    return addresses.flatMap(
      (addr) => addr.value?.map((v) => v.address || "") || []
    )
  }

  /**
   * Generate a message ID if one doesn't exist
   */
  private generateMessageId(): string {
    return `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@operativeai>`
  }

  /**
   * Process an incoming email and create ticket/message
   */
  async processIncomingEmail(email: ParsedEmail): Promise<void> {
    console.log("📧 =".repeat(40))
    console.log("📧 Processing incoming email")
    console.log("📧 From:", email.from.name, `<${email.from.address}>`)
    console.log("📧 Subject:", email.subject)
    console.log("📧 Message ID:", email.messageId)

    try {
      // Step 1: Try to find existing conversation
      let conversation = await this.findExistingConversation(email)

      // Step 2: If no match, create new ticket
      if (!conversation) {
        console.log("📝 Creating new ticket from email")
        conversation = await this.createTicketFromEmail(email)
      } else {
        console.log("✅ Found existing conversation:", conversation.id)
      }

      // Step 3: Create message in conversation
      const message = await this.createMessageFromEmail(email, conversation.id)
      console.log("✅ Created message:", message.id)

      // Step 4: Update conversation metadata
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          updatedAt: new Date(),
        },
      })

      // Step 5: Trigger notification (only for replies to existing tickets)
      if (conversation.createdAt.getTime() !== conversation.updatedAt.getTime()) {
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
      }

      console.log("✅ Email processed successfully")
    } catch (error) {
      console.error("❌ Failed to process email:", error)
      throw error
    }
  }

  /**
   * Find existing conversation by threading or subject
   */
  private async findExistingConversation(email: ParsedEmail) {
    // Method 1: Match by In-Reply-To or References header
    if (email.inReplyTo || (email.references && email.references.length > 0)) {
      const messageIds = [
        email.inReplyTo,
        ...(email.references || []),
      ].filter(Boolean) as string[]

      console.log("🔍 Searching by message IDs:", messageIds)

      const existingMessage = await db.message.findFirst({
        where: {
          externalId: { in: messageIds },
          conversation: {
            organizationId: this.organizationId,
          },
        },
        include: { conversation: true },
      })

      if (existingMessage) {
        console.log("✅ Matched by email threading")
        return existingMessage.conversation
      }
    }

    // Method 2: Match by subject and customer email (for non-threaded replies)
    const normalizedSubject = this.normalizeSubject(email.subject)

    console.log("🔍 Searching by subject:", normalizedSubject)
    console.log("🔍 Customer email:", email.from.address)

    const conversation = await db.conversation.findFirst({
      where: {
        organizationId: this.organizationId,
        customerEmail: email.from.address,
        subject: { contains: normalizedSubject },
        status: { not: "CLOSED" },
      },
      orderBy: { createdAt: "desc" },
    })

    if (conversation) {
      console.log("✅ Matched by subject + email")
    }

    return conversation
  }

  /**
   * Create a new ticket from email
   */
  private async createTicketFromEmail(email: ParsedEmail) {
    return await db.conversation.create({
      data: {
        organizationId: this.organizationId,
        channel: "EMAIL",
        customerName: email.from.name,
        customerEmail: email.from.address,
        subject: email.subject,
        status: "ACTIVE",
        priority: "NORMAL",
        lastMessageAt: email.date,
        unreadCount: 1,
      },
    })
  }

  /**
   * Create a message from email
   */
  private async createMessageFromEmail(
    email: ParsedEmail,
    conversationId: string
  ) {
    return await db.message.create({
      data: {
        conversationId,
        content: email.text || email.html || "(No content)",
        sender: email.from.name,
        senderEmail: email.from.address,
        direction: "INBOUND",
        channel: "EMAIL",
        externalId: email.messageId,
        status: "DELIVERED",
        deliveredAt: email.date,
        sentAt: email.date,
      },
    })
  }

  /**
   * Normalize email subject (remove Re:, Fwd:, etc.)
   */
  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(Re|RE|Fw|FW|Fwd|FWD):\s*/gi, "")
      .trim()
      .slice(0, 50) // Take first 50 chars for matching
  }
}
