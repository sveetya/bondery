# Chrome extension `lib/`

Shared runtime for the Bondery Chrome extension. Only the background service worker may call the Bondery HTTP API; popup and content scripts use typed `browser.runtime.sendMessage`.

Layer map, import policy, and how to add an API call: [bondery-chrome-extension](../../../../.agents/skills/bondery-chrome-extension/SKILL.md) → [architecture.md](../../../../.agents/skills/bondery-chrome-extension/references/architecture.md).
