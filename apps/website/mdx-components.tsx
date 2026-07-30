import type { MDXComponents } from "mdx/types";
import { getMDXComponents } from "@/components/mdx";

/** Fumadocs docs MDX (`docs/`). Blog uses `@/components/blog-mdx` (Mantine). */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components);
}
