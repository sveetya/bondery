import { Section, Text } from "react-email";
import { defaultFeedbackCopy } from "#fixtures/default-copy.js";
import { clipEmailPreview, type EmailDocumentProps } from "#shared/chrome.js";
import { EmailBody } from "#shared/EmailBody.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";
import { descriptionStyle, EMAIL_MUTED, EMAIL_TEXT } from "#shared/email-styles.js";

export interface FeedbackEmailCopy {
  description: string;
  generalFeedbackHeading: string;
  heading: string;
  notProvided: string;
  npsReasonHeading: string;
  npsScoreLabel: string;
  npsScoreValue: string;
  preview: string;
  replyCta: string;
  submittedAt: string;
  userEmailLabel: string;
  userIdLabel: string;
}

export interface FeedbackEmailProps extends EmailDocumentProps {
  copy?: FeedbackEmailCopy;
  generalFeedback?: string;
  npsReason?: string;
  npsScore: number;
  timestamp: string;
  userEmail: string;
  userId: string;
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <Section
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        margin: "0 0 12px",
        padding: "16px",
      }}
    >
      <Text style={{ color: EMAIL_MUTED, fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
        {label}
      </Text>
      <Text style={{ color: EMAIL_TEXT, fontSize: "16px", lineHeight: "24px", margin: 0 }}>
        {value}
      </Text>
    </Section>
  );
}

export default function FeedbackEmail({
  chrome,
  copy = defaultFeedbackCopy,
  dir,
  generalFeedback,
  lang,
  npsReason,
  npsScore = 8,
  timestamp = "2026-01-01T12:00:00.000Z",
  title,
  userEmail = "user@example.com",
  userId = "preview-user",
  websiteUrl,
}: FeedbackEmailProps) {
  const heading = copy.heading.replace("{{userEmail}}", userEmail);
  const description = copy.description
    .replace("{{npsScore}}", String(npsScore))
    .replace("{{timestamp}}", timestamp);
  const preview = clipEmailPreview(
    copy.preview.replace("{{userEmail}}", userEmail).replace("{{npsScore}}", String(npsScore)),
  );
  const npsScoreValue = copy.npsScoreValue.replace("{{npsScore}}", String(npsScore));
  const submittedAt = copy.submittedAt.replace("{{timestamp}}", timestamp);

  return (
    <EmailWrapper
      chrome={chrome}
      dir={dir}
      lang={lang}
      preview={preview}
      showHelp={false}
      title={title ?? heading}
      websiteUrl={websiteUrl}
    >
      <EmailBody
        cta={{
          href: `mailto:${userEmail}`,
          label: copy.replyCta.replace("{{userEmail}}", userEmail),
        }}
        description={description}
        heading={heading}
      >
        <FieldBlock label={copy.userEmailLabel} value={userEmail} />
        <FieldBlock label={copy.userIdLabel} value={userId} />
        <FieldBlock label={copy.npsScoreLabel} value={npsScoreValue} />
        <Text style={{ ...descriptionStyle, fontWeight: 600, marginBottom: "8px" }}>
          {copy.npsReasonHeading}
        </Text>
        <Text style={descriptionStyle}>{npsReason || copy.notProvided}</Text>
        <Text style={{ ...descriptionStyle, fontWeight: 600, marginBottom: "8px" }}>
          {copy.generalFeedbackHeading}
        </Text>
        <Text style={descriptionStyle}>{generalFeedback || copy.notProvided}</Text>
        <Text style={{ color: EMAIL_MUTED, fontSize: "14px", lineHeight: "20px", margin: 0 }}>
          {submittedAt}
        </Text>
      </EmailBody>
    </EmailWrapper>
  );
}
