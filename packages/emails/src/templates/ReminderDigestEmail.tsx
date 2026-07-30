import { IMPORTANT_DATE_TYPE_META } from "@bondery/helpers";
import { Column, Container, Heading, Img, Link, Row, Section, Text } from "react-email";
import { defaultReminderDigestCopy } from "#fixtures/default-copy.js";
import { EmailWrapper } from "#shared/EmailWrapper.js";

export interface ReminderDigestEmailItem {
  date: string;
  dateLabel: string;
  note: string | null;
  notifyDaysBefore: 1 | 3 | 7;
  notifyOn: string;
  personAvatar: string | null;
  personId: string;
  personName: string;
  remainingLabel: string;
  type: "birthday" | "anniversary" | "nameday" | "graduation" | "other";
  typeLabel: string;
}

export interface ReminderDigestEmailCopy {
  dateTypes: Record<ReminderDigestEmailItem["type"], string>;
  dayMany: string;
  dayOne: string;
  heading: string;
  introMany: string;
  introOne: string;
  preview: string;
  reminderLine: string;
}

export interface ReminderDigestEmailProps {
  copy?: ReminderDigestEmailCopy;
  formattedHeadingDate: string;
  reminders: ReminderDigestEmailItem[];
  targetDate: string;
  userId: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ReminderDigestEmail({
  copy = defaultReminderDigestCopy,
  formattedHeadingDate,
  reminders,
  targetDate,
}: ReminderDigestEmailProps) {
  const preview = copy.preview
    .replace("{{count}}", String(reminders.length))
    .replace("{{targetDate}}", targetDate);
  const heading = copy.heading.replace("{{headingDate}}", formattedHeadingDate);
  const intro =
    reminders.length === 1
      ? copy.introOne
      : copy.introMany.replace("{{count}}", String(reminders.length));

  return (
    <EmailWrapper preview={preview}>
      <Container className="mx-auto mb-4 rounded-lg bg-white p-6 shadow-sm">
        <Heading as="h1" className="mb-1 text-md font-bold text-gray-900">
          {heading}
        </Heading>
        <Text className="mb-4 text-sm text-gray-700">{intro}</Text>

        {reminders.map((reminder) => {
          const personUrl = `https://app.usebondery.com/app/person/${encodeURIComponent(reminder.personId)}`;
          const dateMeta = IMPORTANT_DATE_TYPE_META[reminder.type];
          const personInitials = getInitials(reminder.personName) || "?";
          const reminderLine = copy.reminderLine
            .replace("{{emoji}}", dateMeta.emoji)
            .replace("{{typeLabel}}", reminder.typeLabel)
            .replace("{{remainingLabel}}", reminder.remainingLabel)
            .replace("{{dateLabel}}", reminder.dateLabel);

          return (
            <Section
              className="mb-3 border border-gray-200 bg-white"
              key={`${reminder.personId}-${reminder.type}-${reminder.date}`}
              style={{ borderRadius: "12px", overflow: "hidden" }}
            >
              <Row>
                <Column align="center" className="bg-brand py-3" width="72">
                  {reminder.personAvatar ? (
                    <Img
                      alt={`${reminder.personName} avatar`}
                      className="border border-white"
                      height="40"
                      src={reminder.personAvatar}
                      style={{
                        borderRadius: "9999px",
                        height: "40px",
                        objectFit: "cover",
                        width: "40px",
                      }}
                      width="40"
                    />
                  ) : (
                    <Text
                      className="m-0 border border-white bg-white text-xs font-bold text-brand"
                      style={{
                        borderRadius: "9999px",
                        height: "40px",
                        lineHeight: "40px",
                        textAlign: "center",
                        width: "40px",
                      }}
                    >
                      {personInitials}
                    </Text>
                  )}
                </Column>
                <Column className="px-3 py-2">
                  <Link
                    className="mt-0 mb-1 text-sm font-bold text-gray-900 underline"
                    href={personUrl}
                  >
                    {reminder.personName}
                  </Link>
                  <Text className="m-0 text-sm text-gray-700">{reminderLine}</Text>
                  {reminder.note ? (
                    <Text className="mt-1 mb-0 text-xs text-gray-600">{reminder.note}</Text>
                  ) : null}
                </Column>
              </Row>
            </Section>
          );
        })}
      </Container>
    </EmailWrapper>
  );
}
