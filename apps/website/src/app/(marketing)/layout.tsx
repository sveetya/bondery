import { bonderyTheme } from "@bondery/mantine-next";
import { ColorSchemeScript, MantineProvider, v8CssVariablesResolver } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Footer, Header } from "@/components/landing";
import { JsonLd } from "@/lib/seo/json-ld";
import { getCspNonce } from "@/lib/seo/nonce";
import {
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebsiteSchema,
} from "@/lib/seo/schemas/site";

/**
 * Marketing / product-site chrome. Must not wrap `/docs` Fumadocs pages.
 */
export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = await getCspNonce();

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" nonce={nonce} />
      <JsonLd data={buildOrganizationSchema()} id="schema-organization" nonce={nonce} />
      <JsonLd data={buildWebsiteSchema()} id="schema-website" nonce={nonce} />
      <JsonLd
        data={buildSoftwareApplicationSchema()}
        id="schema-software-application"
        nonce={nonce}
      />
      <MantineProvider
        cssVariablesResolver={v8CssVariablesResolver}
        defaultColorScheme="dark"
        theme={bonderyTheme}
      >
        <Notifications autoClose={6000} position="top-center" />
        <Header />
        <main>{children}</main>
        <Footer />
      </MantineProvider>
    </>
  );
}
