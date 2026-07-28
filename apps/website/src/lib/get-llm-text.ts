import type { source } from "@/lib/source";
import { WEBSITE_URL } from "@/lib/config";

const GITHUB_BLOB_BASE = "https://github.com/usebondery/bondery/blob/main/docs";

function docsFilePath(page: (typeof source)["$inferPage"]): string {
  const path = page.path;
  if (path.endsWith(".mdx") || path.endsWith(".md")) {
    return path;
  }
  return `${path}.mdx`;
}

function canonicalDocsUrl(page: (typeof source)["$inferPage"]): string {
  return new URL(page.url, WEBSITE_URL).href;
}

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const pageUrl = canonicalDocsUrl(page);
  const sourceUrl = `${GITHUB_BLOB_BASE}/${docsFilePath(page)}`;

  if (page.type === "openapi") {
    return `# ${page.data.title}\n\nURL: ${pageUrl}\n\nSee the OpenAPI reference at ${pageUrl}`;
  }

  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

URL: ${pageUrl}
Source: ${sourceUrl}

${page.data.description ?? ""}

${processed}`;
}

export function getDocsGithubUrl(page: (typeof source)["$inferPage"]): string {
  return `${GITHUB_BLOB_BASE}/${docsFilePath(page)}`;
}

export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]): string {
  return `${page.url}.md`;
}
