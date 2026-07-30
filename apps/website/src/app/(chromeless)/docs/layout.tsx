import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { DocsLayoutClient } from "@/components/docs-layout-client";
import { getDocsLayoutTabs } from "@/lib/docs-tabs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        options: {
          api: "/api/search",
        },
      }}
    >
      <DocsLayoutClient tabs={getDocsLayoutTabs()} tree={source.getPageTree()} {...baseOptions()}>
        {children}
      </DocsLayoutClient>
    </RootProvider>
  );
}
