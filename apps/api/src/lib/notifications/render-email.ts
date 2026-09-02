import { render, toPlainText } from "@react-email/render";
import type { ReactNode } from "react";

/**
 * HTML plus plaintext for `multipart/alternative`.
 * @see https://react.email/docs/utilities/render#4-convert-to-plain-text
 */
export async function renderEmailParts(
  element: ReactNode,
): Promise<{ html: string; text: string }> {
  const html = await render(element);
  return { html, text: toPlainText(html) };
}
