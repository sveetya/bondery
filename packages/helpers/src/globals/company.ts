/** Legal entity behind the Bondery product (hosted cloud controller). */
export const LEGAL_ENTITY = {
  addressCountryCode: "CZ",
  addressCountryName: "Czechia",
  addressLocality: "Brno",
  brandName: "Bondery",
  euid: "CZVROR.29902321",
  foundingDate: "2026",
  legalName: "Sveetech s.r.o.",
  postalCode: "614 00",
  streetAddress: "Fryčajova 82/8",
  vatId: "CZ29902321",
} as const;

export type LegalEntity = typeof LEGAL_ENTITY;

export function formatLegalAddressLine(entity: LegalEntity = LEGAL_ENTITY): string {
  return `${entity.streetAddress}, ${entity.postalCode} ${entity.addressLocality}, ${entity.addressCountryName}`;
}
