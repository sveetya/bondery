import { ShareContactEmail } from "@bondery/emails";
import type { ShareableField } from "@bondery/schemas";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { DomainContext } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";
import { attachContactExtras, type FullContactExtras } from "../../lib/contacts/enrichment.js";
import { contactDetailSelect, mapContactDetailRecord } from "../../lib/data/prisma-mappers.js";
import { internal, notFound } from "../../lib/platform/errors/http-errors.js";
import { resolveContactAvatarUrl } from "../../lib/storage/avatar-urls.js";

export type ShareContactInput = {
  personId: string;
  recipientEmails: string[];
  message?: string;
  selectedFields: ShareableField[];
};

export type ContactSharingPreview = {
  contactId: string;
  contactName: string;
  availableFields: { field: ShareableField; preview: string }[];
};

type ShareContext = Pick<DomainContext, "db" | "user">;

/** Combined type of a contact row plus enrichment extras. */
type EnrichedContact = FullContactExtras & {
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  location?: string | null;
  notes?: string | null;
};

const ALL_SHAREABLE_FIELDS: ShareableField[] = [
  "name",
  "avatar",
  "headline",
  "phones",
  "emails",
  "location",
  "linkedin",
  "instagram",
  "facebook",
  "website",
  "whatsapp",
  "signal",
  "addresses",
  "notes",
  "importantDates",
];

function buildFieldPreview(
  field: ShareableField,
  enriched: EnrichedContact,
  importantDates: { type: string; date: string }[],
): string | null {
  switch (field) {
    case "name":
      return [enriched.firstName, enriched.lastName].filter(Boolean).join(" ") || null;
    case "avatar":
      return enriched.avatar ? "Yes" : null;
    case "headline":
      return enriched.headline ?? null;
    case "phones":
      if (!Array.isArray(enriched.phones) || enriched.phones.length === 0) {
        return null;
      }
      return enriched.phones
        .map((p) => [p.prefix, p.value, p.type ? `(${p.type})` : ""].filter(Boolean).join(" "))
        .join(", ");
    case "emails":
      if (!Array.isArray(enriched.emails) || enriched.emails.length === 0) {
        return null;
      }
      return enriched.emails
        .map((e) => [e.value, e.type ? `(${e.type})` : ""].filter(Boolean).join(" "))
        .join(", ");
    case "location":
      return enriched.location ?? null;
    case "linkedin":
      return enriched.linkedin ?? null;
    case "instagram":
      return enriched.instagram ?? null;
    case "facebook":
      return enriched.facebook ?? null;
    case "website":
      return enriched.website ?? null;
    case "whatsapp":
      return enriched.whatsapp ?? null;
    case "signal":
      return enriched.signal ?? null;
    case "addresses":
      if (!Array.isArray(enriched.addresses) || enriched.addresses.length === 0) {
        return null;
      }
      return (
        enriched.addresses
          .filter((a) => a.addressFormatted)
          .map((a) => a.addressFormatted)
          .join("; ") || null
      );
    case "notes":
      if (!enriched.notes) {
        return null;
      }
      return enriched.notes.length > 80 ? `${enriched.notes.substring(0, 80)}…` : enriched.notes;
    case "importantDates":
      return importantDates.length > 0 ? `${importantDates.length} date(s)` : null;
    default:
      return null;
  }
}

/**
 * Returns an enriched preview of a contact's shareable fields.
 * Used by the AI tool to show the user what data can be included before sharing.
 */
export async function getContactSharingPreview(
  ctx: ShareContext,
  personId: string,
): Promise<ContactSharingPreview> {
  const { user } = ctx;
  const db = domainDb(ctx as DomainContext);

  const contactRow = await db.people.findFirst({
    select: contactDetailSelect,
    where: { id: personId, userId: user.id },
  });

  if (!contactRow) {
    throw notFound("Contact not found", "contact_not_found");
  }

  const mappedContact = mapContactDetailRecord(contactRow);

  const enriched = await attachContactExtras(db, user.id, [mappedContact], {
    addresses: true,
  })
    .then(([result]) => result)
    .catch(() => null);

  if (!enriched) {
    throw internal("contact_share_failed");
  }

  const importantDatesRaw = await db.peopleImportantDate.findMany({
    select: { date: true, type: true },
    where: { personId, userId: user.id },
  });

  const importantDates = importantDatesRaw.map((entry) => ({
    date: entry.date.toISOString().slice(0, 10),
    type: entry.type,
  }));

  const contactName =
    [enriched.firstName, enriched.lastName].filter(Boolean).join(" ") || "Unnamed contact";

  const availableFields = ALL_SHAREABLE_FIELDS.flatMap((field) => {
    const preview = buildFieldPreview(field, enriched, importantDates);
    return preview ? [{ field, preview }] : [];
  });

  return { availableFields, contactId: personId, contactName };
}

/**
 * Sends a contact share email to one or more recipients.
 * Reads SMTP configuration from environment variables.
 */
export async function shareContact(
  ctx: ShareContext,
  input: ShareContactInput,
): Promise<{ success: true }> {
  const { user } = ctx;
  const db = domainDb(ctx as DomainContext);
  const { personId, recipientEmails, message, selectedFields } = input;

  const myselfContact = await db.people.findFirst({
    select: {
      firstName: true,
      hasAvatar: true,
      lastName: true,
      middleName: true,
      updatedAt: true,
    },
    where: { myself: true, userId: user.id },
  });
  const senderName =
    [myselfContact?.firstName, myselfContact?.middleName, myselfContact?.lastName]
      .filter(Boolean)
      .join(" ") || user.email;

  const contactRow = await db.people.findFirst({
    select: contactDetailSelect,
    where: { id: personId, userId: user.id },
  });

  if (!contactRow) {
    throw notFound("Contact not found", "contact_not_found");
  }

  const mappedContact = mapContactDetailRecord(contactRow);

  const enriched = await attachContactExtras(db, user.id, [mappedContact], {
    addresses: true,
  })
    .then(([result]) => result)
    .catch(() => null);

  if (!enriched) {
    throw internal("contact_share_failed");
  }

  const importantDatesRaw = await db.peopleImportantDate.findMany({
    select: { date: true, type: true },
    where: { personId, userId: user.id },
  });

  const importantDates = importantDatesRaw.map((entry) => ({
    date: entry.date.toISOString().slice(0, 10),
    label: entry.type,
    type: entry.type,
  }));

  const contactName =
    [enriched.firstName || "", enriched.lastName || ""].filter(Boolean).join(" ") ||
    "Unnamed contact";

  const has = (field: ShareableField) => field === "headline" || selectedFields.includes(field);
  const phones = has("phones") && Array.isArray(enriched.phones) ? enriched.phones : undefined;
  const emails = has("emails") && Array.isArray(enriched.emails) ? enriched.emails : undefined;

  const emailProps = {
    addresses: has("addresses")
      ? enriched.addresses
          ?.filter((a) => a.addressFormatted)
          .map((a) => ({ formatted: a.addressFormatted ?? undefined }))
      : undefined,
    contactAvatarUrl: enriched.avatar ?? undefined,
    contactName,
    emails: emails?.map((e) => ({
      type: e.type || undefined,
      value: e.value,
    })),
    facebook: has("facebook") ? (enriched.facebook ?? undefined) : undefined,
    headline: has("headline") ? (enriched.headline ?? undefined) : undefined,
    importantDates: has("importantDates") && importantDates.length > 0 ? importantDates : undefined,
    instagram: has("instagram") ? (enriched.instagram ?? undefined) : undefined,
    linkedin: has("linkedin") ? (enriched.linkedin ?? undefined) : undefined,
    location: has("location") ? (enriched.location ?? undefined) : undefined,
    message: message || undefined,
    notes: has("notes") ? (enriched.notes ?? undefined) : undefined,
    phones: phones?.map((p) => ({
      prefix: p.prefix || undefined,
      type: p.type || undefined,
      value: p.value,
    })),
    recipientEmail: recipientEmails[0],
    senderAvatarUrl:
      resolveContactAvatarUrl(user.id, {
        hasAvatar: myselfContact?.hasAvatar ?? false,
        id: user.id,
        updatedAt: myselfContact?.updatedAt?.toISOString(),
      }) ?? undefined,
    senderEmail: user.email,
    senderName,
    signal: has("signal") ? (enriched.signal ?? undefined) : undefined,
    website: has("website") ? (enriched.website ?? undefined) : undefined,
    whatsapp: has("whatsapp") ? (enriched.whatsapp ?? undefined) : undefined,
  };

  const smtpHost = process.env.BONDERY_PRIVATE_EMAIL_HOST;
  const smtpUser = process.env.BONDERY_PRIVATE_EMAIL_USER;
  const smtpPass = process.env.BONDERY_PRIVATE_EMAIL_PASS;
  const smtpAddress = process.env.BONDERY_PRIVATE_EMAIL_ADDRESS;
  const smtpPort = Number(process.env.BONDERY_PRIVATE_EMAIL_PORT ?? 587);

  if (!smtpHost || !smtpUser) {
    throw internal("email_service_not_configured");
  }

  let emailHtml: string;
  try {
    emailHtml = await render(ShareContactEmail(emailProps));
  } catch {
    throw internal("contact_share_email_render_failed");
  }

  try {
    const transporter = nodemailer.createTransport({
      auth: { pass: smtpPass, user: smtpUser },
      host: smtpHost,
      port: smtpPort,
      secure: false,
      tls: { rejectUnauthorized: false },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: `Bondery <${smtpAddress}>`,
      html: emailHtml,
      replyTo: user.email,
      subject: `${senderName} shared a contact with you • ${contactName}`,
      to: recipientEmails.join(", "),
    };

    mailOptions.cc = user.email;

    await transporter.sendMail(mailOptions);
  } catch {
    throw internal("contact_share_email_send_failed");
  }

  return { success: true };
}
