/** @type {import('lint-staged').Configuration} */
export default {
  "{apps/api/src/**/*.ts,packages/schemas/src/**/*.ts}": () => "pnpm --filter api run generate:openapi",
  "{packages/helpers/src/env/manifest.ts,scripts/env.ts}": () => "pnpm run env:examples -- --stage",
  "*": () => "pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true .",
};
