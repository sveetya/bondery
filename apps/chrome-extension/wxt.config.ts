import { defineConfig } from "wxt";

const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3002";

const getOrigin = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/*`;
  } catch {
    return `${url}/*`;
  }
};

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: ".output",
  vite: () => ({
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  }),
  manifest: {
    name: "Bondery Social Integration",
    version: "0.5.6",
    description: "Import contacts from social media directly to Bondery",
    permissions: ["storage"],
    host_permissions: [
      "https://www.instagram.com/*",
      "https://www.linkedin.com/*",
      "https://www.facebook.com/*",
      getOrigin(WEBAPP_URL),
    ],
    icons: {
      16: "/icons/icon16.png",
      48: "/icons/icon48.png",
      128: "/icons/icon128.png",
    },
  },
});
