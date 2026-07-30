import type { ReactNode } from "react";

/**
 * Pages without marketing chrome (Header, Footer, Mantine shell).
 * Fumadocs lives in `(chromeless)/docs` and still serves `/docs/*` URLs.
 */
export default function ChromelessLayout({ children }: { children: ReactNode }) {
  return children;
}
