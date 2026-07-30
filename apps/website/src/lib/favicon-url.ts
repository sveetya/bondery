/** DuckDuckGo favicon service — client-side only; requires CSP img-src allowance. */
export function getFaviconUrl(host: string): string {
  const normalized = host.toLowerCase().replace(/^www\./, "");
  return `https://icons.duckduckgo.com/ip3/${normalized}.ico`;
}
