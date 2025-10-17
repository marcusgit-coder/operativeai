/**
 * Common email providers presets with SMTP and IMAP settings
 * Can be imported in both server and client components
 */
export const EMAIL_PROVIDERS = {
  GMAIL: {
    name: "Gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    secure: false,
    imapHost: "imap.gmail.com",
    imapPort: 993,
    imapSecure: true,
    help: "Use an App Password instead of your regular password. Enable 2FA and generate an App Password at https://myaccount.google.com/apppasswords",
  },
  OUTLOOK: {
    name: "Outlook/Office 365",
    smtpHost: "smtp-mail.outlook.com",
    smtpPort: 587,
    secure: false,
    imapHost: "outlook.office365.com",
    imapPort: 993,
    imapSecure: true,
    help: "Use your regular Outlook password",
  },
  YAHOO: {
    name: "Yahoo Mail",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    secure: false,
    imapHost: "imap.mail.yahoo.com",
    imapPort: 993,
    imapSecure: true,
    help: "Generate an App Password at https://login.yahoo.com/account/security",
  },
  CUSTOM: {
    name: "Custom SMTP Server",
    smtpHost: "",
    smtpPort: 587,
    secure: false,
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    help: "Enter your custom SMTP and IMAP server details",
  },
} as const

