import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const pages = source.getPages().filter((page) => page.type !== "openapi");
  const scanned = await Promise.all(pages.map(getLLMText));

  return new Response(scanned.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
