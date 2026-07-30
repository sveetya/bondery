/**
 * Validates OpenAPI fixture examples against their Zod schemas.
 *
 * Usage: npx tsx scripts/check-openapi-examples.ts
 */

import {
  getNamedSchemaExample,
  type OpenApiSchemaExampleEntry,
  REQUEST_SCHEMA_EXAMPLES,
  RESPONSE_SCHEMA_EXAMPLES,
} from "#openapi/schema-example-registry.js";

function validateExamples(entries: OpenApiSchemaExampleEntry[], failures: string[]) {
  for (const { name, schema } of entries) {
    const example = getNamedSchemaExample(name, schema);
    if (example === undefined) {
      failures.push(
        `${name}: missing OpenAPI example (add to example-fixtures.ts or .meta({ example }))`,
      );
      continue;
    }

    const result = schema.safeParse(example);
    if (!result.success) {
      failures.push(`${name}: example failed validation — ${result.error.message}`);
    }
  }
}

function run() {
  const failures: string[] = [];

  validateExamples(RESPONSE_SCHEMA_EXAMPLES, failures);
  validateExamples(REQUEST_SCHEMA_EXAMPLES, failures);

  if (failures.length > 0) {
    console.error(
      `OpenAPI example validation failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`,
    );
    process.exit(1);
  }

  const total = RESPONSE_SCHEMA_EXAMPLES.length + REQUEST_SCHEMA_EXAMPLES.length;
  console.log(`check-openapi-examples: ok (${total} schemas)`);
}

run();
