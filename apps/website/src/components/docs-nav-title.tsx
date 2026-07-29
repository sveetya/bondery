"use client";

import { BonderyDynamicLogotype } from "@bondery/branding/react";
import { useEffect, useState } from "react";

function useDocsColorScheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributeFilter: ["class"], attributes: true });
    return () => observer.disconnect();
  }, []);

  return theme;
}

/** Sidebar / nav title for Fumadocs — “Bondery Docs”. */
export function DocsNavTitle() {
  const theme = useDocsColorScheme();

  return <BonderyDynamicLogotype height={20} text="Bondery Docs" theme={theme} />;
}
