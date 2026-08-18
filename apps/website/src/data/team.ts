/** A member of the Bondery team. */
export type TeamMember = {
  /** Display name — also used as `author` in PostMeta. */
  name: string;
  /** Avatar image path relative to /public (e.g. "/images/team/sveetya.png"). */
  image: string;
  /** Short role label shown under the name. */
  role: string;
  /** One-line description shown on the team card. */
  description: string;
  /** Full LinkedIn profile URL. */
  linkedin: string;
  /** Full X (Twitter) profile URL, if any. */
  x?: string;
};

/**
 * Named exports for each team member — use these as the source of truth for
 * the `author` field in PostMeta, instead of hardcoding a string.
 */
export const sveetya: TeamMember = {
  description: "Built the foundation.",
  image: "/images/team/sveetya.png",
  linkedin: "https://linkedin.com/in/mareksvitek",
  name: "Sveetya",
  role: "Founder",
  x: "https://x.com/sveetya",
};

/**
 * Single source of truth for Bondery team members.
 * Used in the Team component on the website and as the author registry for blog posts.
 * The `name` field maps to PostMeta.author.
 */
export const TEAM_MEMBERS: TeamMember[] = [sveetya];

/** Look up a team member by name (matches PostMeta.author). */
export function getTeamMember(name: string): TeamMember | undefined {
  return TEAM_MEMBERS.find((m) => m.name === name);
}
