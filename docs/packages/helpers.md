# @bondery/helpers

Shared utility functions and constants used across all applications.

**Version:** 0.0.1
**Build:** `tsc`

## Exports

| Export path | Description |
|---|---|
| `@bondery/helpers` | Main utilities |
| `@bondery/helpers/globals/paths` | Global path and route constants |
| `@bondery/helpers/check-env` | Environment variable validation helpers |

## globals/paths

Centralized route and URL path constants used by the webapp, website, and API. This ensures route strings are defined in one place rather than scattered across applications.

## check-env

Utilities for validating environment variables at startup. Used by the API's `scripts/check-env.ts` to fail fast if required variables are missing.

## Dependencies

- `dotenv` (dev dependency for environment loading)
