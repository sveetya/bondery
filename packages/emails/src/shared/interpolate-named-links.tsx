import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-email";

const PLACEHOLDER = /(\{\{\w+\}\})/g;

export function interpolateNamedLinks(
  template: string,
  links: Record<string, { href: string; label: string }>,
  linkStyle: CSSProperties,
): ReactNode[] {
  return template.split(PLACEHOLDER).map((part) => {
    const match = part.match(/^\{\{(\w+)\}\}$/);
    if (!match) {
      return part;
    }

    const token = match[1];
    const link = token ? links[token] : undefined;
    if (!link) {
      return part;
    }

    return (
      <Link href={link.href} key={token} style={linkStyle}>
        {link.label}
      </Link>
    );
  });
}
