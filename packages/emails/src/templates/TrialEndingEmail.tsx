import { Column, Heading, Section, Text } from "react-email";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface TrialEndingEmailProps {
  trialEndsAt?: string | null;
  userName?: string;
}

function formatTrialEndDate(value: string | null | undefined): string {
  if (!value) {
    return "soon";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

export default function TrialEndingEmail({ trialEndsAt, userName }: TrialEndingEmailProps) {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const endDate = formatTrialEndDate(trialEndsAt ?? null);

  return (
    <EmailWrapper preview="Your Bondery Premium trial is ending soon">
      <Section>
        <Column>
          <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>
            Your Premium trial is ending soon
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{greeting}</Text>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Your Bondery Premium trial ends on {endDate}. After that, your subscription will renew
            automatically unless you cancel from your account settings.
          </Text>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
            Open Bondery and go to Settings → Subscription to manage billing or cancel before
            renewal.
          </Text>
        </Column>
      </Section>
    </EmailWrapper>
  );
}
