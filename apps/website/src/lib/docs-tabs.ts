import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import { BookOpen, Code, Server, Wrench } from "lucide-react";
import { createElement } from "react";
import { source } from "@/lib/source";

function matchesPrefix(url: string, prefix: string): boolean {
  return url === prefix || url.startsWith(`${prefix}/`);
}

/** Collect exact page URLs for tabs that span multiple folders (Fumadocs uses Set equality). */
function collectProductUrls(): Set<string> {
  const urls = new Set<string>();

  for (const page of source.getPages()) {
    if (page.type === "openapi") {
      continue;
    }
    const { url } = page;
    if (
      url === "/docs" ||
      matchesPrefix(url, "/docs/getting-started") ||
      matchesPrefix(url, "/docs/apps") ||
      matchesPrefix(url, "/docs/bondery") ||
      matchesPrefix(url, "/docs/concepts") ||
      matchesPrefix(url, "/docs/getting-help-and-troubleshooting") ||
      matchesPrefix(url, "/docs/changelog")
    ) {
      urls.add(url);
    }
  }

  return urls;
}

function collectSelfHostUrls(): Set<string> {
  const urls = new Set<string>();

  for (const page of source.getPages()) {
    if (page.type === "openapi") {
      continue;
    }
    const { url } = page;
    if (matchesPrefix(url, "/docs/deploy")) {
      urls.add(url);
    }
  }

  return urls;
}

function collectDevelopUrls(): Set<string> {
  const urls = new Set<string>();

  for (const page of source.getPages()) {
    if (page.type === "openapi") {
      continue;
    }
    const { url } = page;
    if (matchesPrefix(url, "/docs/contributing")) {
      urls.add(url);
    }
  }

  return urls;
}

export function getDocsLayoutTabs(): LayoutTab[] {
  return [
    {
      description: "Learn the product",
      icon: createElement(BookOpen, { className: "size-4" }),
      title: "How to use Bondery",
      url: "/docs",
      urls: collectProductUrls(),
    },
    {
      description: "Run Bondery on your own infrastructure",
      icon: createElement(Server, { className: "size-4" }),
      title: "Self-host",
      url: "/docs/deploy/requirements",
      urls: collectSelfHostUrls(),
    },
    {
      description: "Connect API & other integrations",
      icon: createElement(Code, { className: "size-4" }),
      title: "Integrate",
      url: "/docs/api",
    },
    {
      description: "Contribute to the repository",
      icon: createElement(Wrench, { className: "size-4" }),
      title: "Develop",
      url: "/docs/contributing",
      urls: collectDevelopUrls(),
    },
  ];
}
