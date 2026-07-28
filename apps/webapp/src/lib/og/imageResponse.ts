import { OG_SIZE, ogFonts } from "@bondery/branding/og";
import type { ReactElement } from "react";
import { ImageResponse } from "takumi-js/response";

export const OG_IMAGE_CONTENT_TYPE = "image/webp";

export async function createOgImageResponse(element: ReactElement) {
  const fonts = await ogFonts();

  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts,
    format: "webp",
  });
}
