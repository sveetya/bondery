import { defineConfig } from "wxt";

const appUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3000";

const getOrigin = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/*`;
  } catch {
    return `${url}/*`;
  }
};

export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Bondery Social Integration",
    version: "0.5.6",
    description: "Import contacts from social media directly to Bondery",
    permissions: ["storage"],
    host_permissions: [
      "https://www.instagram.com/*",
      "https://www.linkedin.com/*",
      getOrigin(appUrl),
    ],
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  vite: () => ({
    envPrefix: ["VITE_", "WXT_", "NEXT_PUBLIC_"],
  }),
});
