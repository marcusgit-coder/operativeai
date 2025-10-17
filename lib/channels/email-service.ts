import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { db } from "@/lib/db"
import { EMAIL_PROVIDERS } from "@/lib/email-providers"

export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  secure: boolean // true for 465, false for other ports
  username: string
  password: string
  fromEmail: string
  fromName?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  attachments?: Array<{
    filename: string
    path?: string // File path or URL
    content?: Buffer // File buffer
  }>
  inReplyTo?: string // Email message ID for threading
  references?: string[] // List of message IDs for threading
}

/**
 * Get email configuration for an organization
 */
export async function getEmailConfig(organizationId: string): Promise<EmailConfig | null> {
  const integration = await db.channelIntegration.findUnique({
    where: {
      organizationId_channel: {
        organizationId,
        channel: "EMAIL",
      },
    },
  })

  if (!integration || !integration.isEnabled || !integration.credentials) {
    return null
  }

  try {
    const credentials = JSON.parse(integration.credentials)
    return credentials as EmailConfig
  } catch (error) {
    console.error("Failed to parse email credentials:", error)
    return null
  }
}

/**
 * Create a nodemailer transporter with the given configuration
 */
export function createEmailTransporter(config: EmailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  })
}

/**
 * Send an email via SMTP
 */
export async function sendEmail(
  organizationId: string,
  params: SendEmailParams
): Promise<string> {
  console.log("📧 sendEmail() called")
  console.log("📧 Organization ID:", organizationId)
  console.log("📧 To:", params.to)
  console.log("📧 Subject:", params.subject)

  // Get email configuration
  const config = await getEmailConfig(organizationId)

  if (!config) {
    console.error("❌ Email integration not configured")
    throw new Error("Email integration not configured or not enabled")
  }

  console.log("✅ Email config found:")
  console.log("   - SMTP Host:", config.smtpHost)
  console.log("   - SMTP Port:", config.smtpPort)
  console.log("   - From:", config.fromEmail)

  // Create transporter
  const transporter = createEmailTransporter(config)

  // Prepare email headers for threading
  const headers: Record<string, string> = {}
  if (params.inReplyTo) {
    headers["In-Reply-To"] = params.inReplyTo
  }
  if (params.references && params.references.length > 0) {
    headers["References"] = params.references.join(" ")
  }

  console.log("📤 Sending email via SMTP...")

  // Send email
  const info = await transporter.sendMail({
    from: config.fromName 
      ? `"${config.fromName}" <${config.fromEmail}>`
      : config.fromEmail,
    to: params.to,
    subject: params.subject,
    text: params.textBody || stripHtml(params.htmlBody),
    html: params.htmlBody,
    attachments: params.attachments,
    headers,
  })

  console.log("✅ Email sent successfully!")
  console.log("📧 Message ID:", info.messageId)

  // Return the message ID
  return info.messageId
}

/**
 * Test email connection
 */
export async function testEmailConnection(config: EmailConfig): Promise<boolean> {
  try {
    const transporter = createEmailTransporter(config)
    await transporter.verify()
    return true
  } catch (error) {
    console.error("Email connection test failed:", error)
    return false
  }
}

/**
 * Save email configuration for an organization
 */
export async function saveEmailConfig(
  organizationId: string,
  config: EmailConfig
): Promise<void> {
  // Test connection first
  const isValid = await testEmailConnection(config)

  if (!isValid) {
    throw new Error("Invalid email configuration. Connection test failed.")
  }

  // Save or update configuration
  await db.channelIntegration.upsert({
    where: {
      organizationId_channel: {
        organizationId,
        channel: "EMAIL",
      },
    },
    create: {
      organizationId,
      channel: "EMAIL",
      isEnabled: true,
      credentials: JSON.stringify(config),
      syncStatus: "ACTIVE",
    },
    update: {
      credentials: JSON.stringify(config),
      isEnabled: true,
      syncStatus: "ACTIVE",
      lastSyncAt: new Date(),
      errorMessage: null,
    },
  })
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim()
}

/**
 * Format email body with proper styling
 */
export function formatEmailHtml(content: string, includeSignature: boolean = true): string {
  // Convert newlines to <br> tags
  const formattedContent = content.replace(/\n/g, "<br>")

  const signature = includeSignature
    ? `
    <br><br>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      <p>Best regards,<br>Support Team</p>
      <p style="font-size: 12px; color: #9ca3af;">
        This email was sent from OperativeAI Support System
      </p>
    </div>
  `
    : ""

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 24px;">
          <div style="font-size: 16px;">
            ${formattedContent}
          </div>
          ${signature}
        </div>
      </body>
    </html>
  `
}

// Re-export EMAIL_PROVIDERS for convenience
export { EMAIL_PROVIDERS } from "@/lib/email-providers"
