import { buildSecurityTxt } from "@bondery/helpers";
import { WEBSITE_URL } from "@/lib/config";

export function GET() {
  return new Response(buildSecurityTxt({ disclosureOrigin: WEBSITE_URL, now: new Date() }), {
    headers: {
      "Cache-Control": "max-age=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
