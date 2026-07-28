import { Container, Heading, Section, Text } from "react-email";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface AccountDeletedEmailProps {
  userName?: string;
}

export default function AccountDeletedEmail({ userName }: AccountDeletedEmailProps) {
  const greeting = userName?.trim() ? `Hi ${userName.trim()},` : "Hi,";
  const previewText = "Your Bondery account and data have been deleted";

  return (
    <EmailWrapper preview={previewText}>
      <Container className="mx-auto mb-4 rounded-lg bg-white p-6 shadow-sm">
        <Heading className="mb-6 text-md font-bold text-gray-900">
          Your Bondery account has been deleted
        </Heading>

        <Text className="mb-4 text-sm leading-6 text-gray-700">{greeting}</Text>

        <Text className="mb-4 text-sm leading-6 text-gray-700">
          This confirms that your Bondery account and associated data in our systems have been
          deleted.
        </Text>

        <Section className="mb-4 rounded-lg bg-gray-50 p-4">
          <Text className="text-sm leading-6 text-gray-700">
            If you have feedback about Bondery or why you left, you can reply to this email. We read
            every message.
          </Text>
        </Section>

        <Text className="text-sm text-gray-500">Thank you for trying Bondery.</Text>
      </Container>
    </EmailWrapper>
  );
}
