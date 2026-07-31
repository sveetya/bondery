/**
 * Validates OpenAPI fixture examples against their Zod schemas.
 *
 * Usage: pnpm exec tsx scripts/check-contracts-openapi-examples.ts
 */

import {
  getNamedSchemaExample,
  type OpenApiSchemaExampleEntry,
  REQUEST_SCHEMA_EXAMPLES,
  RESPONSE_SCHEMA_EXAMPLES,
} from "#openapi/schema-example-registry.js";

import { createCheck } from "../../../scripts/check-report.mjs";

const check = createCheck("check-contracts-openapi-examples");

function validateExamples(entries: OpenApiSchemaExampleEntry[]) {
  for (const { name, schema } of entries) {
    const example = getNamedSchemaExample(name, schema);
    if (example === undefined) {
      check.add(
        `${name}: missing OpenAPI example (add to example-fixtures.ts or .meta({ example }))`,
      );
      continue;
    }

    const result = schema.safeParse(example);
    if (!result.success) {
      check.add(`${name}: example failed validation — ${result.error.message}`);
    }
  }
}

validateExamples(RESPONSE_SCHEMA_EXAMPLES);
validateExamples(REQUEST_SCHEMA_EXAMPLES);

const total = RESPONSE_SCHEMA_EXAMPLES.length + REQUEST_SCHEMA_EXAMPLES.length;
check.ok(`${total} schemas`);
