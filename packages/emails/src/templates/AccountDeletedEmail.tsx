import { Container, Heading, Section, Text } from "react-email";
import { defaultAccountDeletedCopy } from "#fixtures/default-copy.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface AccountDeletedEmailCopy {
  body: string;
  feedback: string;
  greeting: string;
  greetingWithName: string;
  heading: string;
  preview: string;
  thanks: string;
}

export interface AccountDeletedEmailProps {
  copy?: AccountDeletedEmailCopy;
  userName?: string;
}

function resolveGreeting(copy: AccountDeletedEmailCopy, userName?: string): string {
  const trimmed = userName?.trim();
  if (trimmed) {
    return copy.greetingWithName.replace("{{userName}}", trimmed);
  }

  return copy.greeting;
}

export default function AccountDeletedEmail({
  copy = defaultAccountDeletedCopy,
  userName,
}: AccountDeletedEmailProps) {
  const greeting = resolveGreeting(copy, userName);

  return (
    <EmailWrapper preview={copy.preview}>
      <Container className="mx-auto mb-4 rounded-lg bg-white p-6 shadow-sm">
        <Heading className="mb-6 text-md font-bold text-gray-900">{copy.heading}</Heading>

        <Text className="mb-4 text-sm leading-6 text-gray-700">{greeting}</Text>

        <Text className="mb-4 text-sm leading-6 text-gray-700">{copy.body}</Text>

        <Section className="mb-4 rounded-lg bg-gray-50 p-4">
          <Text className="text-sm leading-6 text-gray-700">{copy.feedback}</Text>
        </Section>

        <Text className="text-sm text-gray-500">{copy.thanks}</Text>
      </Container>
    </EmailWrapper>
  );
}
