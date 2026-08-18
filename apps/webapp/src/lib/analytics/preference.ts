/** Client-side product analytics preference and DNT state. */

let productAnalyticsEnabled = true;
let browserDntEnabled = false;

export function isBrowserDntEnabled(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.doNotTrack === "1" || navigator.doNotTrack === "yes";
}

export function syncBrowserDntState(): void {
  browserDntEnabled = isBrowserDntEnabled();
}

export function isProductAnalyticsPreferenceEnabled(): boolean {
  return productAnalyticsEnabled;
}

export function setProductAnalyticsPreference(enabled: boolean): void {
  productAnalyticsEnabled = enabled;
}

export function isAnalyticsCaptureAllowed(): boolean {
  if (browserDntEnabled) {
    return false;
  }

  return productAnalyticsEnabled;
}
