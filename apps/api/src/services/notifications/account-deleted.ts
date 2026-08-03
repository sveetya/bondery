import { AccountDeletedEmail } from "@bondery/emails";
import type { SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import { buildAccountDeletedCopy } from "../../lib/notifications/email-copy-builders.js";
import { loadEmailNamespace, readCopyString } from "../../lib/notifications/email-i18n.js";
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

  const html = await render(
    AccountDeletedEmail({
      copy,
      userName: input.userName ?? undefined,
    }),
  );

  await sendRenderedEmail(
    {
      from: `Robot from Bondery <${config.fromAddress}>`,
      html,
      replyTo: config.replyToAddress,
      subject: readCopyString(bundle, "subject"),
      to: input.email,
    },
    log,
  );
}
