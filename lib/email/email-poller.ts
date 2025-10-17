import { db } from "@/lib/db"
import { checkTicketEmailReplies, EmailConfig } from "./ticket-email-receiver"

export class EmailPoller {
  private isRunning = false
  private pollInterval = 60000 // 1 minute (60 seconds)
  private pollTimeout: NodeJS.Timeout | null = null

  /**
   * Start polling for emails
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️  Email poller already running")
      return
    }

    this.isRunning = true
    console.log("🚀 Email poller started (interval: 60s)")

    // Start polling loop
    this.poll()
  }

  /**
   * Stop polling
   */
  stop() {
    this.isRunning = false
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout)
      this.pollTimeout = null
    }
    console.log("🛑 Email poller stopped")
  }

  /**
   * Main polling loop
   */
  private async poll() {
    if (!this.isRunning) return

    try {
      await this.pollAllOrganizations()
    } catch (error) {
      console.error("❌ Email polling error:", error)
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.poll(), this.pollInterval)
    }
  }

  /**
   * Poll all organizations with email integration enabled
   */
  private async pollAllOrganizations() {
    const startTime = Date.now()
    console.log("📬 ".repeat(20))
    console.log("📬 Polling emails for all organizations...")

    try {
      // Get all email integrations that are enabled
      const integrations = await db.channelIntegration.findMany({
        where: {
          channel: "EMAIL",
          isEnabled: true,
          syncStatus: { not: "ERROR" }, // Skip failed integrations
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      console.log(`📊 Found ${integrations.length} active email integrations`)

      let totalEmails = 0
      let successCount = 0
      let errorCount = 0

      // Poll each organization
      for (const integration of integrations) {
        try {
          console.log(`\n📧 Polling: ${integration.organization.name}`)
          const count = await this.pollOrganization(integration)
          totalEmails += count
          successCount++
        } catch (error) {
          console.error(
            `❌ Failed to poll ${integration.organization.name}:`,
            error
          )
          errorCount++

          // Update integration status
          await db.channelIntegration.update({
            where: { id: integration.id },
            data: {
              syncStatus: "ERROR",
            },
          })
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`\n✅ Poll complete in ${duration}s`)
      console.log(`   - Organizations: ${integrations.length}`)
      console.log(`   - Emails processed: ${totalEmails}`)
      console.log(`   - Success: ${successCount}`)
      console.log(`   - Errors: ${errorCount}`)
    } catch (error) {
      console.error("❌ Failed to poll organizations:", error)
    }
  }

  /**
   * Poll a single organization - Only check replies to existing tickets
   */
  private async pollOrganization(integration: any): Promise<number> {
    if (!integration.credentials) {
      console.log("⚠️  No credentials configured")
      return 0
    }

    let config: EmailConfig
    try {
      const creds = JSON.parse(integration.credentials)

      // Extract IMAP config
      config = {
        username: creds.username || creds.user,
        password: creds.password,
        imapHost: creds.imapHost || creds.imap?.host || "imap.gmail.com",
        imapPort: creds.imapPort || creds.imap?.port || 993,
        imapSecure: creds.imapSecure !== false,
      }

      // Validate config
      if (!config.username || !config.password) {
        throw new Error("Missing username or password")
      }

      if (!config.imapHost) {
        throw new Error("IMAP host not configured")
      }
    } catch (error) {
      console.error("❌ Invalid credentials format:", error)
      return 0
    }

    try {
      // Use the new ticket-specific email receiver
      const count = await checkTicketEmailReplies(integration.organizationId, config)

      // Update last sync time
      await db.channelIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: "ACTIVE",
          errorMessage: null,
        },
      })

      return count
    } catch (error) {
      console.error("❌ Email polling failed:", error)
      
      // Update integration with error status
      await db.channelIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: "ERROR",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      })
      
      throw error
    }
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      pollIntervalSeconds: this.pollInterval / 1000,
    }
  }

  /**
   * Update polling interval
   */
  setPollInterval(intervalMs: number) {
    if (intervalMs < 10000) {
      throw new Error("Poll interval must be at least 10 seconds")
    }
    this.pollInterval = intervalMs
    console.log(`⏱️  Poll interval updated to ${intervalMs / 1000}s`)
  }
}

// Singleton instance
let pollerInstance: EmailPoller | null = null

/**
 * Get or create email poller instance
 */
export function getEmailPoller(): EmailPoller {
  if (!pollerInstance) {
    pollerInstance = new EmailPoller()
  }
  return pollerInstance
}

/**
 * Start the email poller
 */
export function startEmailPoller(): EmailPoller {
  const poller = getEmailPoller()
  poller.start()
  return poller
}

/**
 * Stop the email poller
 */
export function stopEmailPoller(): void {
  if (pollerInstance) {
    pollerInstance.stop()
  }
}

/**
 * Get poller status
 */
export function getPollerStatus() {
  return pollerInstance?.getStatus() || { isRunning: false }
}
