import createMDX from "@next/mdx";
import { createMDX as createFumadocsMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@tabler/icons-react",
      "@bondery/mantine-next",
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/notifications",
    ],
    useTypeScriptCli: true,
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Outbound redirects (status, help, docs, login, auth/callback, oauth/consent, app)
  // live in src/app/**/route.ts so they can import @bondery/helpers.
  // Public URLs: server reads BONDERY_PUBLIC_*; client leaves get them as RSC props.
  async redirects() {
    return [
      {
        destination: "/blog/updates",
        permanent: true,
        source: "/blog/product",
      },
      {
        destination: "/blog/updates/:slug",
        permanent: true,
        source: "/blog/product/:slug",
      },
    ];
  },
  serverExternalPackages: ["@takumi-rs/core"],
};

const withMDX = createMDX({
  options: {
    // String plugin names only — Turbopack requires serializable loader options.
    remarkPlugins: ["remark-gfm"],
  },
});
const withFumadocsMDX = createFumadocsMDX();
type WithMDXConfig = Parameters<typeof withMDX>[0];

// withMDX resolves NextConfig from root node_modules; cast avoids monorepo type mismatch
export default withFumadocsMDX(withMDX(nextConfig as WithMDXConfig));
