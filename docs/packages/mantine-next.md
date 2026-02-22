# @bondery/mantine-next

Mantine UI theme configuration and integration for Next.js applications.

**Version:** 0.1.0
**Build:** None required (exports TypeScript source directly)

## Exports

| Export path | Description |
|---|---|
| `@bondery/mantine-next` | Main module (MantineProvider wrapper, ColorSchemeScript) |
| `@bondery/mantine-next/theme` | Mantine theme configuration object |
| `@bondery/mantine-next/styles` | CSS styles (`styles.css`) |

## Theme configuration

The theme object (`src/theme.ts`) configures:

- Brand colors using `@bondery/branding` palette
- Typography settings
- Component defaults
- Spacing and radius values

Both the webapp and website import this theme to ensure visual consistency.

## Usage

```tsx
import { MantineProvider } from "@bondery/mantine-next";
import { theme } from "@bondery/mantine-next/theme";
import "@bondery/mantine-next/styles";
```

## Peer dependencies

- `@mantine/core` >= 8.3
- `next` >= 16
- `react` >= 19
- `react-dom` >= 19

## Dependencies

- `@bondery/branding` -- brand color palette
