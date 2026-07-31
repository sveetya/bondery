// Verifies committed OpenAPI spec is fresh (run generate:openapi first) and meets doc quality rules.
//
// Usage: pnpm run check:openapi-spec -w api

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { createCheck } from "../../../scripts/check-report.mjs";

const check = createCheck("check:openapi-spec-drift");

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, "..");
const specPath = join(apiRoot, "openapi.yaml");

try {
  execSync("git diff --exit-code openapi.yaml", { cwd: apiRoot, stdio: "pipe" });
} catch {
  check.add("openapi.yaml is out of date. Run: pnpm run generate:openapi -w api");
  check.failIfNeeded();
}

const spec = parse(readFileSync(specPath, "utf8")) as {
  paths?: Record<
    string,
    Record<
      string,
      {
        requestBody?: {
          content?: Record<string, { schema?: unknown; example?: unknown }>;
        };
        responses?: Record<
          string,
          {
            description?: string;
            content?: Record<string, { schema?: unknown; example?: unknown }>;
          }
        >;
      }
    >
  >;
};

const violations: string[] = [];

function isEmptySchema(schema: unknown): boolean {
  return (
    schema === undefined ||
    (typeof schema === "object" &&
      schema !== null &&
      !Array.isArray(schema) &&
      Object.keys(schema).length === 0)
  );
}

for (const [path, methods] of Object.entries(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(methods)) {
    if (method === "parameters") {
      continue;
    }

    if (["post", "put", "patch"].includes(method)) {
      const requestJson = operation.requestBody?.content?.["application/json"];
      if (requestJson) {
        if (isEmptySchema(requestJson.schema)) {
          violations.push(
            `${method.toUpperCase()} ${path}: empty or missing application/json request schema`,
          );
        }
        if (requestJson.example === undefined) {
          violations.push(
            `${method.toUpperCase()} ${path}: missing application/json request example`,
          );
        }
      }
    }

    const responses = operation.responses ?? {};
    for (const [status, response] of Object.entries(responses)) {
      if (response.description === "Default Response") {
        violations.push(`${method.toUpperCase()} ${path} ${status}: Default Response`);
      }

      const statusCode = Number(status);
      if (!Number.isInteger(statusCode)) {
        continue;
      }

      const jsonContent = response.content?.["application/json"];
      if (!jsonContent) {
        continue;
      }

      const isSuccess = statusCode >= 200 && statusCode < 300;
      const isError = statusCode >= 400;

      if (!isSuccess && !isError) {
        continue;
      }

      if (isEmptySchema(jsonContent.schema)) {
        violations.push(
          `${method.toUpperCase()} ${path} ${status}: empty or missing application/json schema`,
        );
      }

      if (jsonContent.example === undefined) {
        violations.push(
          `${method.toUpperCase()} ${path} ${status}: missing application/json example`,
        );
      }
    }
  }
}

for (const violation of violations) {
  check.add(violation);
}

check.ok();
