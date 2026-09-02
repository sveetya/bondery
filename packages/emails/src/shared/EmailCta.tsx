import { Link, Section } from "react-email";
import { ctaButtonStyle } from "#shared/email-styles.js";

export function EmailCta({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ margin: "24px 0 8px", textAlign: "center" }}>
      <Link href={href} style={ctaButtonStyle}>
        {label}
      </Link>
    </Section>
  );
}
