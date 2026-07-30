import type {
  AccountDeletedEmailCopy,
  FeedbackEmailCopy,
  ReminderDigestEmailCopy,
  ShareContactEmailCopy,
  TrialEndingEmailCopy,
  WelcomeEmailCopy,
} from "@bondery/emails";
import { readCopyString } from "./email-i18n.js";

function readNestedLabels(
  bundle: Record<string, unknown>,
  key: string,
): ShareContactEmailCopy["labels"] {
  const labels = bundle[key];
  if (!labels || typeof labels !== "object") {
    return defaultShareLabels();
  }

  const record = labels as Record<string, string>;
  return {
    address: record.address ?? "Address",
    email: record.email ?? "Email",
    facebook: record.facebook ?? "Facebook",
    importantDates: record.importantDates ?? "Important dates",
    instagram: record.instagram ?? "Instagram",
    linkedin: record.linkedin ?? "LinkedIn",
    location: record.location ?? "Location",
    notes: record.notes ?? "Notes",
    phone: record.phone ?? "Phone",
    signal: record.signal ?? "Signal",
    website: record.website ?? "Website",
    whatsapp: record.whatsapp ?? "WhatsApp",
  };
}

function defaultShareLabels(): ShareContactEmailCopy["labels"] {
  return {
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
  };
}

function readDateTypes(bundle: Record<string, unknown>): ReminderDigestEmailCopy["dateTypes"] {
  const dateTypes = bundle.dateTypes;
  if (!dateTypes || typeof dateTypes !== "object") {
    return {
      anniversary: "Anniversary",
      birthday: "Birthday",
      graduation: "Graduation",
      nameday: "Name day",
      other: "Important date",
    };
  }

  const record = dateTypes as Record<string, string>;
  return {
    anniversary: record.anniversary ?? "Anniversary",
    birthday: record.birthday ?? "Birthday",
    graduation: record.graduation ?? "Graduation",
    nameday: record.nameday ?? "Name day",
    other: record.other ?? "Important date",
  };
}

export function buildTrialEndingCopy(bundle: Record<string, unknown>): TrialEndingEmailCopy {
  return {
    body: readCopyString(bundle, "body"),
    greeting: readCopyString(bundle, "greeting"),
    greetingWithName: readCopyString(bundle, "greetingWithName"),
    heading: readCopyString(bundle, "heading"),
    manageBilling: readCopyString(bundle, "manageBilling"),
    preview: readCopyString(bundle, "preview"),
    whyReceiving: readCopyString(bundle, "whyReceiving"),
  };
}

export function buildAccountDeletedCopy(bundle: Record<string, unknown>): AccountDeletedEmailCopy {
  return {
    body: readCopyString(bundle, "body"),
    feedback: readCopyString(bundle, "feedback"),
    greeting: readCopyString(bundle, "greeting"),
    greetingWithName: readCopyString(bundle, "greetingWithName"),
    heading: readCopyString(bundle, "heading"),
    preview: readCopyString(bundle, "preview"),
    thanks: readCopyString(bundle, "thanks"),
  };
}

export function buildWelcomeCopy(bundle: Record<string, unknown>): WelcomeEmailCopy {
  return {
    body: readCopyString(bundle, "body"),
    getStarted: readCopyString(bundle, "getStarted"),
    greeting: readCopyString(bundle, "greeting"),
    greetingWithName: readCopyString(bundle, "greetingWithName"),
    heading: readCopyString(bundle, "heading"),
    preview: readCopyString(bundle, "preview"),
    whyReceiving: readCopyString(bundle, "whyReceiving"),
  };
}

export function buildFeedbackCopy(bundle: Record<string, unknown>): FeedbackEmailCopy {
  return {
    generalFeedbackHeading: readCopyString(bundle, "generalFeedbackHeading"),
    heading: readCopyString(bundle, "heading"),
    notProvided: readCopyString(bundle, "notProvided"),
    npsReasonHeading: readCopyString(bundle, "npsReasonHeading"),
    npsScoreLabel: readCopyString(bundle, "npsScoreLabel"),
    npsScoreValue: readCopyString(bundle, "npsScoreValue"),
    preview: readCopyString(bundle, "preview"),
    submittedAt: readCopyString(bundle, "submittedAt"),
    userEmailLabel: readCopyString(bundle, "userEmailLabel"),
    userIdLabel: readCopyString(bundle, "userIdLabel"),
  };
}

export function buildReminderDigestCopy(bundle: Record<string, unknown>): ReminderDigestEmailCopy {
  return {
    dateTypes: readDateTypes(bundle),
    dayMany: readCopyString(bundle, "dayMany"),
    dayOne: readCopyString(bundle, "dayOne"),
    heading: readCopyString(bundle, "heading"),
    introMany: readCopyString(bundle, "introMany"),
    introOne: readCopyString(bundle, "introOne"),
    preview: readCopyString(bundle, "preview"),
    reminderLine: readCopyString(bundle, "reminderLine"),
  };
}

export function buildShareContactCopy(bundle: Record<string, unknown>): ShareContactEmailCopy {
  return {
    defaultMessage: readCopyString(bundle, "defaultMessage"),
    heading: readCopyString(bundle, "heading"),
    importantDateLine: readCopyString(bundle, "importantDateLine"),
    labels: readNestedLabels(bundle, "labels"),
    noHeadline: readCopyString(bundle, "noHeadline"),
    preview: readCopyString(bundle, "preview"),
  };
}
