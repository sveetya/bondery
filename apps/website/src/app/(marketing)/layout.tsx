import "../marketing.css";
import { Footer, Header } from "@/components/landing";
import { MantineShell } from "@/components/mantine-shell";

/**
 * Marketing site chrome (Header, Footer, Mantine). Docs are in `(chromeless)/docs`.
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
