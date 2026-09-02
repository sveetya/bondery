import { LEGAL_ENTITY } from "@bondery/helpers";

/** SMTP From display name. Product copy — not env. Address stays `BONDERY_PRIVATE_EMAIL_ADDRESS`. */
export const EMAIL_FROM_DISPLAY_NAME = `Robot from ${LEGAL_ENTITY.brandName}`;

export function formatEmailFrom(address: string): string {
  return `${EMAIL_FROM_DISPLAY_NAME} <${address}>`;
}
