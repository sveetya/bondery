import { OgTitled } from "@bondery/branding/og";
import { API_ERROR_CODES, isApiErrorCode } from "@bondery/schemas/errors";
import { notFound } from "next/navigation";
import { createOgImageResponse } from "@/lib/og/imageResponse";

export const revalidate = false;

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { code } = await context.params;
  if (!isApiErrorCode(code)) {
    notFound();
  }

  return createOgImageResponse(<OgTitled subtype="Docs" title={`${code} — API error`} />);
}

export function generateStaticParams() {
  return API_ERROR_CODES.map((code) => ({ code }));
}
