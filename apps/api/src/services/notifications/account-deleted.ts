import { AccountDeletedEmail } from "@bondery/emails";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import {
  createEmailTransporter,
  emailConfigFromProcessEnv,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendAccountDeletedEmailInput = {
  email: string;
  userName?: string | null;
};

export async function sendAccountDeletedEmail(
  input: SendAccountDeletedEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  const config = emailConfigFromProcessEnv();
  if (!config) {
    log?.warn("Skipping account-deleted email: SMTP is not configured");
    return;
  }

  const transporter = createEmailTransporter(config);
  const html = await render(
    AccountDeletedEmail({
      userName: input.userName ?? undefined,
    }),
  );

  await sendRenderedEmail(
    transporter,
    {
      from: `Robot from Bondery <${config.fromAddress}>`,
      html,
      replyTo: config.fromAddress,
      subject: "Your Bondery account has been deleted",
      to: input.email,
    },
    log,
  );
}
