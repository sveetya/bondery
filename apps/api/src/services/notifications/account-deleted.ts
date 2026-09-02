import { AccountDeletedEmail } from "@bondery/emails";
import type { SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import type { FastifyBaseLogger } from "fastify";
import { emailDocumentProps } from "../../lib/notifications/email-chrome.js";
import { buildAccountDeletedCopy } from "../../lib/notifications/email-copy-builders.js";
import { formatEmailFrom } from "../../lib/notifications/email-from.js";
import { loadEmailNamespace, readCopyString } from "../../lib/notifications/email-i18n.js";
import { renderEmailParts } from "../../lib/notifications/render-email.js";
import {
  isEmailConfigured,
  requireEmailConfig,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendAccountDeletedEmailInput = {
  email: string;
  language?: SupportedLocale | null;
  userName?: string | null;
};

export async function sendAccountDeletedEmail(
  input: SendAccountDeletedEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    log?.warn("Skipping account-deleted email: SMTP is not configured");
    return;
  }

  const config = requireEmailConfig();
  const lng = input.language ?? "en";
  const bundle = loadEmailNamespace(lng, "AccountDeletedEmail");
  const copy = buildAccountDeletedCopy(bundle);
  const subject = readCopyString(bundle, "subject");

  const { html, text } = await renderEmailParts(
    AccountDeletedEmail({
      ...emailDocumentProps(lng, subject),
      copy,
    }),
  );

  await sendRenderedEmail(
    {
      from: formatEmailFrom(config.fromAddress),
      html,
      replyTo: config.replyToAddress,
      subject,
      text,
      to: input.email,
    },
    log,
  );
}
