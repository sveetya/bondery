import { Column, Heading, Section, Text } from "react-email";
import { defaultTrialEndingCopy } from "#fixtures/default-copy.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface TrialEndingEmailCopy {
  body: string;
  greeting: string;
  greetingWithName: string;
  heading: string;
  manageBilling: string;
  preview: string;
  whyReceiving: string;
}

export interface TrialEndingEmailProps {
  copy?: TrialEndingEmailCopy;
  formattedEndDate: string;
  userName?: string;
}

function resolveGreeting(copy: TrialEndingEmailCopy, userName?: string): string {
  const trimmed = userName?.trim();
  if (trimmed) {
    return copy.greetingWithName.replace("{{userName}}", trimmed);
  }

  return copy.greeting;
}

export default function TrialEndingEmail({
  copy = defaultTrialEndingCopy,
  formattedEndDate,
  userName,
}: TrialEndingEmailProps) {
  const greeting = resolveGreeting(copy, userName);
  const body = copy.body.replace("{{endDate}}", formattedEndDate);

  return (
    <EmailWrapper preview={copy.preview}>
      <Section>
        <Column>
          <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>
            {copy.heading}
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{greeting}</Text>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{body}</Text>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{copy.manageBilling}</Text>
          <Text style={{ color: "#6b7280", fontSize: "14px", lineHeight: "20px" }}>
            {copy.whyReceiving}
          </Text>
        </Column>
      </Section>
    </EmailWrapper>
  );
}
