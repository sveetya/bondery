import "../marketing.css";
import { Footer, Header } from "@/components/landing";
import { MantineShell } from "@/components/mantine-shell";

/**
 * Marketing / product-site chrome. Must not wrap `/docs` Fumadocs pages.
 */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MantineShell>
      <Header />
      <main>{children}</main>
      <Footer />
    </MantineShell>
  );
}
