import { MagicLinkEmail } from "@bondery/emails";
import type { SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import type { FastifyBaseLogger } from "fastify";
import { emailDocumentProps } from "../../lib/notifications/email-chrome.js";
import { buildMagicLinkCopy } from "../../lib/notifications/email-copy-builders.js";
import { formatEmailFrom } from "../../lib/notifications/email-from.js";
import { loadEmailNamespace, readCopyString } from "../../lib/notifications/email-i18n.js";
import { renderEmailParts } from "../../lib/notifications/render-email.js";
import {
  isEmailConfigured,
  requireEmailConfig,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendMagicLinkEmailInput = {
  email: string;
  language: SupportedLocale;
  url: string;
};

export async function sendMagicLinkEmail(
  input: SendMagicLinkEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("email_service_not_configured");
  }

  const config = requireEmailConfig();
  const bundle = loadEmailNamespace(input.language, "MagicLinkEmail");
  const copy = buildMagicLinkCopy(bundle);
  const subject = readCopyString(bundle, "subject");

  const { html, text } = await renderEmailParts(
    MagicLinkEmail({
      ...emailDocumentProps(input.language, subject),
      copy,
      url: input.url,
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

  log?.info("sign-in link email sent");
}
