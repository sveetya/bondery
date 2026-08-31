import { BONDERY_PGP_PUBLIC_KEY } from "@bondery/helpers";

export function GET() {
  return new Response(BONDERY_PGP_PUBLIC_KEY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
