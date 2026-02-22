# @bondery/branding

Brand assets, SVG icons, and React icon components.

**Version:** 0.1.0
**Build:** `tsc`

## Exports

| Export path | Description |
|---|---|
| `@bondery/branding` | Main module (brand constants) |
| `@bondery/branding/icons` | React icon components |
| `@bondery/branding/react` | Same as `icons` |
| `@bondery/branding/icon-generator` | Icon generation script |

## Assets

- SVG source icons in `src/assets/`
- Platform-specific images (GitHub social preview, favicon, etc.) in `src/platforms/`

## React icon components

Auto-generated from SVGs using `@svgr/core`. Each SVG becomes a React component.

**Regenerate:**

```bash
cd packages/branding
npm run generate-react-icons
```

## Icon generation

The `icon-generator` export provides a script that generates platform-specific icons (different sizes, formats) from SVG source files using `sharp`.

## Dependencies

- `sharp` -- image processing for icon generation
- `@svgr/core` -- SVG to React component conversion (dev)
