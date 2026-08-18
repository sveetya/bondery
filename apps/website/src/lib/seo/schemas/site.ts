import { SOCIAL_LINKS, SUPPORT_EMAIL } from "@bondery/helpers";
import type { Organization, SoftwareApplication, WebSite, WithContext } from "schema-dts";
import { LEGAL_ENTITY } from "@/data/company";
import { sveetya } from "@/data/team";
import { WEBSITE_URL } from "@/lib/config";
import { ORGANIZATION_ID, SOFTWARE_APPLICATION_ID, WEBSITE_ID } from "../constants";
import { SITE_DESCRIPTION } from "../copy";

export function buildOrganizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    address: {
      "@type": "PostalAddress",
      addressCountry: LEGAL_ENTITY.addressCountryCode,
      addressLocality: LEGAL_ENTITY.addressLocality,
      postalCode: LEGAL_ENTITY.postalCode,
      streetAddress: LEGAL_ENTITY.streetAddress,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "customer support",
        email: SUPPORT_EMAIL,
      },
    ],
    description: SITE_DESCRIPTION,
    founder: {
      "@type": "Person",
      name: sveetya.name,
      sameAs: [sveetya.linkedin, sveetya.x].filter((url): url is string => Boolean(url)),
      url: sveetya.linkedin,
    },
    foundingDate: LEGAL_ENTITY.foundingDate,
    identifier: {
      "@type": "PropertyValue",
      name: "EUID",
      value: LEGAL_ENTITY.euid,
    },
    legalName: LEGAL_ENTITY.legalName,
    logo: `${WEBSITE_URL}/logo.svg`,
    name: LEGAL_ENTITY.brandName,
    sameAs: [SOCIAL_LINKS.github, SOCIAL_LINKS.linkedin, SOCIAL_LINKS.reddit, SOCIAL_LINKS.x],
    url: WEBSITE_URL,
    vatID: LEGAL_ENTITY.vatId,
  };
}

export function buildWebsiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    name: "Bondery",
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    url: WEBSITE_URL,
  };
}

export function buildSoftwareApplicationSchema(): WithContext<SoftwareApplication> {
  return {
    "@context": "https://schema.org",
    "@id": SOFTWARE_APPLICATION_ID,
    "@type": "SoftwareApplication",
    applicationCategory: "SocialNetworkingApplication",
    applicationSubCategory: "Personal Relationship Manager",
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    name: "Bondery",
    offers: {
      "@type": "Offer",
      category: "Free",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Web",
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    url: WEBSITE_URL,
  };
}
