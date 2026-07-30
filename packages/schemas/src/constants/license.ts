/** SPDX license identifier for the Bondery project (see repo root LICENSE). */
export const PROJECT_LICENSE_SPDX = "AGPL-3.0" as const;

/** OpenAPI `info.license` object for the Bondery API. */
export const PROJECT_OPENAPI_LICENSE = {
  name: PROJECT_LICENSE_SPDX,
  url: "https://www.gnu.org/licenses/agpl-3.0.html",
} as const;
