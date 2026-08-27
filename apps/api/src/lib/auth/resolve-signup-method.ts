/**
 * Stable signup_method values for PostHog `signup_flow:user_create`.
 * Map Better Auth `account.providerId` — do not pass unmapped provider strings to analytics.
 */
export const SIGNUP_METHOD = {
  email: "email",
  github: "github",
  linkedin: "linkedin",
  unknown: "unknown",
} as const;

export type SignupMethod = (typeof SIGNUP_METHOD)[keyof typeof SIGNUP_METHOD];

const PROVIDER_TO_SIGNUP_METHOD: Record<string, SignupMethod> = {
  credential: SIGNUP_METHOD.email,
  github: SIGNUP_METHOD.github,
  linkedin: SIGNUP_METHOD.linkedin,
  // GoTrue leftover — never emit `linkedin_oidc` as signup_method.
  linkedin_oidc: SIGNUP_METHOD.linkedin,
};

/**
 * Resolves analytics signup_method from a Better Auth account provider id.
 */
export function resolveSignupMethodFromProviderId(providerId: string): SignupMethod {
  return PROVIDER_TO_SIGNUP_METHOD[providerId] ?? SIGNUP_METHOD.unknown;
}
