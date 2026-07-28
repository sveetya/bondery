import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { DocsNavTitle } from "@/components/docs-nav-title";

const GITHUB_HTML_URL = "https://github.com/usebondery/bondery";

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: GITHUB_HTML_URL,
    nav: {
      title: <DocsNavTitle />,
      url: "/docs",
    },
  };
}
