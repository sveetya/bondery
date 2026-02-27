# Bondery Chrome Extension

A Chrome extension built with **React**, **TypeScript**, and **[WXT](https://wxt.dev/)** to enhance the Bondery experience.

## Development

### Prerequisites

Copy the example env file and fill in the values:

```bash
cp .env.development.example .env.development.local
```

### Start dev server

```bash
npm run dev
```

This runs `wxt` which starts a dev server with HMR for the extension. Load the `dist/chrome-mv3-dev` folder as an unpacked extension in Chrome.

## Build

```bash
npm run build
```

This runs `wxt build` which generates the production extension in `dist/chrome-mv3`.

## Zip

```bash
npm run zip
```

Creates a distributable `.zip` of the built extension.

## Type checking

```bash
npm run check-types
```
