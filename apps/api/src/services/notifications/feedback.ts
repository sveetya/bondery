import { FeedbackEmail } from "@bondery/emails";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import { buildFeedbackCopy } from "../../lib/notifications/email-copy-builders.js";
import {
  loadEmailNamespace,
  readCopyString,
  resolveEmailLocale,
} from "../../lib/notifications/email-i18n.js";
import {
  isEmailConfigured,
  requireEmailConfig,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";
import { internal } from "../../lib/platform/errors/http-errors.js";

export type SendFeedbackEmailInput = {
  userEmail: string;
  userId: string;
  npsScore: number;
  npsReason?: string;
  generalFeedback?: string;
};

export async function sendFeedbackEmail(
  input: SendFeedbackEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    throw internal("email_service_not_configured");
  }

  const config = requireEmailConfig();
  const lng = await resolveEmailLocale(input.userId);
  const bundle = loadEmailNamespace(lng, "FeedbackEmail");
  const copy = buildFeedbackCopy(bundle);
  const timestamp = new Date().toISOString();
  const subject = readCopyString(bundle, "subject");

  try {
    const emailHtml = await render(
      FeedbackEmail({
        copy,
        generalFeedback: input.generalFeedback || undefined,
        npsReason: input.npsReason || undefined,
        npsScore: input.npsScore,
        timestamp,
        userEmail: input.userEmail,
        userId: input.userId,
      }),
    );

    await sendRenderedEmail(
      {
        cc: input.userEmail,
        from: `Robot from Bondery <${config.fromAddress}>`,
        html: emailHtml,
        replyTo: input.userEmail,
        subject,
        to: `Robot from Bondery <${config.fromAddress}>`,
      },
      log,
    );
  } catch (cause) {
    throw internal("failed_to_render_or_send_feedback_email_", cause);
  }
}
