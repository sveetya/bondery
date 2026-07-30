export type LinkKind = "external" | "internal" | "special";

const INTERNAL_HOST_SUFFIXES = ["usebondery.com", "localhost"] as const;

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

function isInternalHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return INTERNAL_HOST_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

/** Strip origin from same-site absolute URLs so Next.js Link receives a path. */
export function toInternalPath(href: string): string {
  try {
    const url = new URL(href);
    if (!isInternalHost(url.hostname)) {
      return href;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

/**
 * Classify an href for RichAnchor: internal (same site / relative), external http(s), or special (mailto, tel, …).
 */
export function resolveLinkKind(href: string): LinkKind {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("javascript:")) {
    return "special";
  }
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return "special";
  }
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return "internal";
  }
  if (trimmed.startsWith("//")) {
    return "external";
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "special";
    }
    return isInternalHost(url.hostname) ? "internal" : "external";
  } catch {
    // Relative paths without a leading slash (uncommon in MDX).
    return "internal";
  }
}
