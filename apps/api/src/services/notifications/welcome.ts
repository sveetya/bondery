import { prisma } from "@bondery/db";
import { WelcomeEmail } from "@bondery/emails";
import type { SupportedLocale } from "@bondery/schemas/locale/supported-locale";
import { render } from "@react-email/render";
import type { FastifyBaseLogger } from "fastify";
import { buildWelcomeCopy } from "../../lib/notifications/email-copy-builders.js";
import { loadEmailNamespace, readCopyString } from "../../lib/notifications/email-i18n.js";
import {
  isEmailConfigured,
  requireEmailConfig,
  sendRenderedEmail,
} from "../../lib/notifications/transporter.js";

export type SendWelcomeEmailInput = {
  email: string;
  language: SupportedLocale;
  userId: string;
  userName?: string | null;
};

function resolveAppUrl(): string {
  return (process.env.BONDERY_PUBLIC_WEBAPP_URL ?? "").replace(/\/+$/, "");
}

export async function sendWelcomeEmail(
  input: SendWelcomeEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    log?.warn("Skipping welcome email: SMTP is not configured");
    return;
  }

  const config = requireEmailConfig();
  const bundle = loadEmailNamespace(input.language, "WelcomeEmail");
  const copy = buildWelcomeCopy(bundle);
  const appUrl = resolveAppUrl();

  const html = await render(
    WelcomeEmail({
      appUrl: appUrl || "https://app.usebondery.com",
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

export async function sendWelcomeEmailIfNeeded(
  input: SendWelcomeEmailInput,
  log?: FastifyBaseLogger,
): Promise<void> {
  if (!isEmailConfigured()) {
    log?.warn("Skipping welcome email: SMTP is not configured");
    return;
  }

  const claimed = await prisma.userSettings.updateMany({
    data: { welcomeEmailSentAt: new Date() },
    where: { userId: input.userId, welcomeEmailSentAt: null },
  });

  if (claimed.count === 0) {
    log?.info(
      { userId: input.userId },
      "welcome email already sent or settings missing — skipping",
    );
    return;
  }

  try {
    await sendWelcomeEmail(input, log);
    log?.info({ userId: input.userId }, "welcome email sent");
  } catch (error) {
    log?.warn({ err: error, userId: input.userId }, "welcome email failed");
  }
}
