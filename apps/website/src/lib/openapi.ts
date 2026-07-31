import { createRequire } from "node:module";
import { createOpenAPI } from "fumadocs-openapi/server";

const require = createRequire(import.meta.url);

export const openapi = createOpenAPI({
  input: [require.resolve("@bondery/openapi-spec/openapi.yaml")],
});
