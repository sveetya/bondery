/**
 * Hop-down stays on the current URL. Product data owns skeleton / stale / inline error.
 * Kept as a no-op so leftover call sites cannot resurrect global outage chrome.
 */
export function handleApiUnavailable(): void {}

/** No-op retained for stale unavailable bookmarks during rollout. */
export function resetApiUnavailableNavigation(): void {}
