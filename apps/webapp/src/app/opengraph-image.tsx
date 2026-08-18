import { OG_DEFAULT_TAGLINE, OgMarketing } from "@bondery/branding/og";
import { createOgImageResponse, OG_IMAGE_CONTENT_TYPE } from "@/lib/og/imageResponse";

export const alt = "Bondery: The open-source personal CRM for building better bonds";
export const contentType = OG_IMAGE_CONTENT_TYPE;
export const size = { height: 630, width: 1200 };

export default async function Image() {
  return createOgImageResponse(<OgMarketing tagline={OG_DEFAULT_TAGLINE} />);
}
