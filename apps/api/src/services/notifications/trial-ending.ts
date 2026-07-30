import { TrialEndingEmail } from "@bondery/emails";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import { buildTrialEndingCopy } from "../../lib/notifications/email-copy-builders.js";
import {
  formatEmailDate,
  loadEmailNamespace,
  readCopyString,
  resolveEmailLocale,
} from "../../lib/notifications/email-i18n.js";
import {
  isEmailConfigured,
  requireEmailConfig,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendTrialEndingEmailInput = {
  email: string;
  trialEndsAt: Date | null;
  userId?: string | null;
  userName?: string | null;
};

export async function sendTrialEndingEmail(
  input: SendTrialEndingEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    log?.warn("Skipping trial-ending email: SMTP is not configured");
    return;
  }

  const config = requireEmailConfig();
  const lng = await resolveEmailLocale(input.userId);
  const bundle = loadEmailNamespace(lng, "TrialEndingEmail");
  const copy = buildTrialEndingCopy(bundle);
  const formattedEndDate = input.trialEndsAt
    ? formatEmailDate(input.trialEndsAt, lng)
    : readCopyString(bundle, "endDateFallback");

  const html = await render(
    TrialEndingEmail({
      copy,
      formattedEndDate,
      userName: input.userName ?? undefined,
    }),
  );

  await sendRenderedEmail(
    {
      from: `Robot from Bondery <${config.fromAddress}>`,
      html,
      replyTo: config.fromAddress,
      subject: readCopyString(bundle, "subject"),
      to: input.email,
    },
    log,
  );
}
