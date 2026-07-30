import "../../../marketing.css";
import type { ReactNode } from "react";
import { MantineShell } from "@/components/mantine-shell";

/** API error reference pages use Mantine; keep Mantine scoped away from Fumadocs MDX pages. */
export default function DocsApiLayout({ children }: { children: ReactNode }) {
  return <MantineShell>{children}</MantineShell>;
}
