export type { EmailChromeCopy, EmailDocumentProps } from "#shared/chrome.js";
export {
  clipEmailPreview,
  defaultEmailChromeCopy,
  EMAIL_PREVIEW_MAX_CHARS,
} from "#shared/chrome.js";
export type {
  AccountDeletedEmailCopy,
  AccountDeletedEmailProps,
} from "#templates/account/AccountDeletedEmail.js";
export { default as AccountDeletedEmail } from "#templates/account/AccountDeletedEmail.js";
export type {
  MagicLinkEmailCopy,
  MagicLinkEmailProps,
} from "#templates/account/MagicLinkEmail.js";
export { default as MagicLinkEmail } from "#templates/account/MagicLinkEmail.js";
export type { WelcomeEmailCopy, WelcomeEmailProps } from "#templates/account/WelcomeEmail.js";
export { default as WelcomeEmail } from "#templates/account/WelcomeEmail.js";
export type {
  TrialEndingEmailCopy,
  TrialEndingEmailProps,
} from "#templates/billing/TrialEndingEmail.js";
export { default as TrialEndingEmail } from "#templates/billing/TrialEndingEmail.js";
export type { FeedbackEmailCopy, FeedbackEmailProps } from "#templates/internal/FeedbackEmail.js";
export { default as FeedbackEmail } from "#templates/internal/FeedbackEmail.js";
export type {
  ReminderDigestEmailCopy,
  ReminderDigestEmailItem,
  ReminderDigestEmailProps,
} from "#templates/notifications/ReminderDigestEmail.js";
export { default as ReminderDigestEmail } from "#templates/notifications/ReminderDigestEmail.js";
export type {
  ShareContactEmailCopy,
  ShareContactEmailProps,
} from "#templates/notifications/ShareContactEmail.js";
export { default as ShareContactEmail } from "#templates/notifications/ShareContactEmail.js";
