import type { AccountDeletedEmailCopy } from "#templates/AccountDeletedEmail.js";
import type { FeedbackEmailCopy } from "#templates/FeedbackEmail.js";
import type { ReminderDigestEmailCopy } from "#templates/ReminderDigestEmail.js";
import type { ShareContactEmailCopy } from "#templates/ShareContactEmail.js";
import type { TrialEndingEmailCopy } from "#templates/TrialEndingEmail.js";
import type { WelcomeEmailCopy } from "#templates/WelcomeEmail.js";

export const defaultWelcomeCopy: WelcomeEmailCopy = {
  body: "Bondery helps you stay close to the people who matter — track interactions, remember important dates, and nurture your relationships in one place.",
  getStarted: "Open Bondery",
  greeting: "Hi there,",
  greetingWithName: "Hi {{userName}},",
  heading: "Welcome to Bondery",
  preview: "Your personal CRM for meaningful relationships",
  whyReceiving: "You're receiving this because you just created a Bondery account.",
};

export const defaultTrialEndingCopy: TrialEndingEmailCopy = {
  body: "Your Bondery Premium trial ends on {{endDate}}. After that, your subscription will renew automatically unless you cancel from your account settings.",
  greeting: "Hi there,",
  greetingWithName: "Hi {{userName}},",
  heading: "Your Premium trial is ending soon",
  manageBilling:
    "Open Bondery and go to Settings → Subscription to manage billing or cancel before renewal.",
  preview: "Your Premium trial is ending soon",
  whyReceiving: "You're receiving this because you have a Bondery Premium trial.",
};

export const defaultAccountDeletedCopy: AccountDeletedEmailCopy = {
  body: "This confirms that your Bondery account and associated data in our systems have been deleted.",
  feedback:
    "If you have feedback about Bondery or why you left, you can reply to this email. We read every message.",
  greeting: "Hi,",
  greetingWithName: "Hi {{userName}},",
  heading: "Your Bondery account has been deleted",
  preview: "Your Bondery account and data have been deleted",
  thanks: "Thank you for trying Bondery.",
};

export const defaultFeedbackCopy: FeedbackEmailCopy = {
  generalFeedbackHeading: "General feedback:",
  heading: "New feedback received",
  notProvided: "(Not provided)",
  npsReasonHeading: "Why did they pick this score?",
  npsScoreLabel: "NPS score:",
  npsScoreValue: "{{npsScore}} / 10",
  preview: "New feedback from user@example.com - NPS Score: 8",
  submittedAt: "Submitted at: {{timestamp}}",
  userEmailLabel: "User email:",
  userIdLabel: "User ID:",
};

export const defaultReminderDigestCopy: ReminderDigestEmailCopy = {
  dateTypes: {
    anniversary: "Anniversary",
    birthday: "Birthday",
    graduation: "Graduation",
    nameday: "Name day",
    other: "Important date",
  },
  dayMany: "{{count}} days",
  dayOne: "1 day",
  heading: "Bondery reminders for January 1",
  introMany: "You have 2 reminders:",
  introOne: "You have 1 reminder:",
  preview: "You have 2 reminders for 2026-01-01",
  reminderLine: "{{emoji}} {{typeLabel}} is coming up in {{remainingLabel}} on {{dateLabel}}.",
};

export const defaultShareContactCopy: ShareContactEmailCopy = {
  defaultMessage: "Shared this contact with you via Bondery.",
  heading: "Contact shared with you",
  importantDateLine: "{{label}}: {{date}} ({{type}})",
  labels: {
    address: "Address",
    email: "Email",
    facebook: "Facebook",
    importantDates: "Important dates",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    location: "Location",
    notes: "Notes",
    phone: "Phone",
    signal: "Signal",
    website: "Website",
    whatsapp: "WhatsApp",
  },
  noHeadline: "No headline",
  preview: "Alex shared a contact with you • Jane Doe",
};
