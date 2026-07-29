import { TrialEndingEmail } from "@bondery/emails";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import {
  createEmailTransporter,
  emailConfigFromProcessEnv,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendTrialEndingEmailInput = {
  email: string;
  trialEndsAt: Date | null;
  userName?: string | null;
};

export async function sendTrialEndingEmail(
  input: SendTrialEndingEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  const config = emailConfigFromProcessEnv();
  if (!config) {
    log?.warn("Skipping trial-ending email: SMTP is not configured");
    return;
  }

  const transporter = createEmailTransporter(config);
  const html = await render(
    TrialEndingEmail({
      trialEndsAt: input.trialEndsAt?.toISOString() ?? null,
      userName: input.userName ?? undefined,
    }),
  );

  await sendRenderedEmail(
    transporter,
    {
      from: `Robot from Bondery <${config.fromAddress}>`,
      html,
      replyTo: config.fromAddress,
      subject: "Your Bondery Premium trial is ending soon",
      to: input.email,
    },
    log,
  );
}
