/**
 * Common email providers presets
 * Can be imported in both server and client components
 */
export const EMAIL_PROVIDERS = {
  GMAIL: {
    name: "Gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    secure: false,
    help: "Use an App Password instead of your regular password. Enable 2FA and generate an App Password at https://myaccount.google.com/apppasswords",
  },
  OUTLOOK: {
    name: "Outlook/Office 365",
    smtpHost: "smtp-mail.outlook.com",
    smtpPort: 587,
    secure: false,
    help: "Use your regular Outlook password",
  },
  YAHOO: {
    name: "Yahoo Mail",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 587,
    secure: false,
    help: "Generate an App Password at https://login.yahoo.com/account/security",
  },
  CUSTOM: {
    name: "Custom SMTP Server",
    smtpHost: "",
    smtpPort: 587,
    secure: false,
    help: "Enter your custom SMTP server details",
  },
} as const
