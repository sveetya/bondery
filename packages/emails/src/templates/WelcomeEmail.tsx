import { BRAND_PRIMARY_COLOR } from "@bondery/branding";
import { Column, Heading, Link, Section, Text } from "react-email";
import { defaultWelcomeCopy } from "#fixtures/default-copy.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface WelcomeEmailCopy {
  body: string;
  getStarted: string;
  greeting: string;
  greetingWithName: string;
  heading: string;
  preview: string;
  whyReceiving: string;
}

export interface WelcomeEmailProps {
  appUrl: string;
  copy?: WelcomeEmailCopy;
  userName?: string;
}

function resolveGreeting(copy: WelcomeEmailCopy, userName?: string): string {
  const trimmed = userName?.trim();
  if (trimmed) {
    return copy.greetingWithName.replace("{{userName}}", trimmed);
  }

  return copy.greeting;
}

export default function WelcomeEmail({
  appUrl,
  copy = defaultWelcomeCopy,
  userName,
}: WelcomeEmailProps) {
  const greeting = resolveGreeting(copy, userName);

  return (
    <EmailWrapper preview={copy.preview}>
      <Section>
        <Column>
          <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>
            {copy.heading}
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{greeting}</Text>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{copy.body}</Text>
          <Section style={{ margin: "24px 0", textAlign: "center" }}>
            <Link
              href={appUrl}
              style={{
                backgroundColor: BRAND_PRIMARY_COLOR,
                borderRadius: "8px",
                color: "#ffffff",
                display: "inline-block",
                fontSize: "16px",
                fontWeight: 600,
                lineHeight: "44px",
                minWidth: "200px",
                padding: "0 24px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {copy.getStarted}
            </Link>
          </Section>
          <Text style={{ color: "#6b7280", fontSize: "14px", lineHeight: "20px" }}>
            {copy.whyReceiving}
          </Text>
        </Column>
      </Section>
    </EmailWrapper>
  );
}
