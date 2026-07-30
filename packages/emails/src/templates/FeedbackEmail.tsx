import { Container, Heading, Section, Text } from "react-email";
import { defaultFeedbackCopy } from "#fixtures/default-copy.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface FeedbackEmailCopy {
  generalFeedbackHeading: string;
  heading: string;
  notProvided: string;
  npsReasonHeading: string;
  npsScoreLabel: string;
  npsScoreValue: string;
  preview: string;
  submittedAt: string;
  userEmailLabel: string;
  userIdLabel: string;
}

export interface FeedbackEmailProps {
  copy?: FeedbackEmailCopy;
  generalFeedback?: string;
  npsReason?: string;
  npsScore: number;
  timestamp: string;
  userEmail: string;
  userId: string;
}

export default function FeedbackEmail({
  copy = defaultFeedbackCopy,
  userEmail,
  userId,
  npsScore,
  npsReason,
  generalFeedback,
  timestamp,
}: FeedbackEmailProps) {
  const preview = copy.preview
    .replace("{{userEmail}}", userEmail)
    .replace("{{npsScore}}", String(npsScore));
  const npsScoreValue = copy.npsScoreValue.replace("{{npsScore}}", String(npsScore));
  const submittedAt = copy.submittedAt.replace("{{timestamp}}", timestamp);

  return (
    <EmailWrapper preview={preview}>
      <Container className="mx-auto mb-4 rounded-lg bg-white p-6 shadow-sm">
        <Heading className="mb-8 text-md font-bold text-gray-900">{copy.heading}</Heading>

        <Section className="mb-4 rounded-lg bg-gray-50 p-4">
          <Text className="mb-1 text-sm font-semibold text-gray-700">{copy.userEmailLabel}</Text>
          <Text className="text-sm text-gray-900">{userEmail}</Text>
        </Section>

        <Section className="mb-4 rounded-lg bg-gray-50 p-4">
          <Text className="mb-1 text-sm font-semibold text-gray-700">{copy.userIdLabel}</Text>
          <Text className="text-sm font-mono text-gray-600">{userId}</Text>
        </Section>

        <Section className="mb-4 rounded-lg bg-brand/10 p-4">
          <Text className="text-sm font-semibold text-brand">{copy.npsScoreLabel}</Text>
          <Text className="text-sm font-bold text-brand">{npsScoreValue}</Text>
        </Section>
        <Section className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-gray-900">{copy.npsReasonHeading}</Text>
          <Text className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {npsReason || copy.notProvided}
          </Text>
        </Section>

        <Section className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            {copy.generalFeedbackHeading}
          </Text>
          <Text className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {generalFeedback || copy.notProvided}
          </Text>
        </Section>

        <Text className="text-xs text-gray-500">{submittedAt}</Text>
      </Container>
    </EmailWrapper>
  );
}
