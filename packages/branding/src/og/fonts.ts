import type { FontSubset } from "@takumi-rs/helpers";
import { googleFonts } from "@takumi-rs/helpers";
import { OG_FONT_FAMILY } from "#og/constants.js";

let cachedFonts: FontSubset[] | undefined;

/**
 * Lexend font subsets for Takumi ImageResponse (matches the website body font).
 */
export async function ogFonts(): Promise<FontSubset[]> {
  if (!cachedFonts) {
    cachedFonts = await googleFonts([{ name: OG_FONT_FAMILY, weight: [400, 500, 600, 700] }]);
  }
  return cachedFonts;
}
