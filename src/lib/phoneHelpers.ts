/**
 * Phone number utilities and country codes
 */

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  { code: "US", name: "United States", dialCode: "+1", flag: "us" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "gb" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "ca" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "au" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "de" },
  { code: "FR", name: "France", dialCode: "+33", flag: "fr" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "es" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "it" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "nl" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "be" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "ch" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "at" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "se" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "no" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "dk" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "fi" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "pl" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "cz" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "pt" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "gr" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "jp" },
  { code: "CN", name: "China", dialCode: "+86", flag: "cn" },
  { code: "IN", name: "India", dialCode: "+91", flag: "in" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "br" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "mx" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "ar" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "za" },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "ru" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "kr" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "sg" },
];

/**
 * Parse a phone number and extract country code and number
 * @param phoneNumber - Full phone number with or without +
 * @returns Object with dialCode and number, or null if invalid
 */
export function parsePhoneNumber(phoneNumber: string): {
  dialCode: string;
  number: string;
} | null {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // Try to match against known country codes (longest first)
  const sortedCodes = [...countryCodes].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of sortedCodes) {
    if (cleaned.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        number: cleaned.substring(country.dialCode.length),
      };
    }
  }

  // If no match, assume +1 (US/Canada) if starts with +1
  if (cleaned.startsWith("+1")) {
    return {
      dialCode: "+1",
      number: cleaned.substring(2),
    };
  }

  // Default: treat everything after + as area code + number
  return {
    dialCode: "+1",
    number: cleaned.substring(1),
  };
}

/**
 * Format a phone number for display
 * @param phoneNumber - Full phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const parsed = parsePhoneNumber(phoneNumber);
  if (!parsed) return phoneNumber;

  const { dialCode, number } = parsed;

  // Simple formatting: add spaces every 3-4 digits
  const formatted = number.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

  return `${dialCode} ${formatted}`;
}

/**
 * Combine dial code and number into full phone number
 * @param dialCode - Country dial code (e.g., "+1")
 * @param number - Phone number without country code
 * @returns Full phone number
 */
export function combinePhoneNumber(dialCode: string, number: string): string {
  const cleanNumber = number.replace(/\D/g, "");
  return dialCode + cleanNumber;
}
