/** Max characters before OG titles are truncated (readable at social preview thumbnail size). */
export const OG_TITLE_MAX_LENGTH = 72;

export function truncateOgTitle(title: string, maxLength: number = OG_TITLE_MAX_LENGTH): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
