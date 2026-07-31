/** @type {import('lint-staged').Configuration} */
export default {
  "{apps/api/src/**/*.ts,packages/schemas/src/**/*.ts}": () => "npm run generate:openapi -w api",
  "{packages/helpers/src/env/manifest.ts,scripts/env.ts}": () => "npm run env:examples -- --stage",
  "*": () => "npx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true .",
};
