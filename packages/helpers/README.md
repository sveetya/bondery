# @bondee/helpers

Shared helper functions and utilities for the Bondee monorepo.

## Features

- Environment variable validation
- Build-time checks for required configuration

## Usage

```typescript
import { checkEnvVariables } from '@bondee/helpers';

checkEnvVariables({
  environment: 'production',
  appPath: __dirname,
  requiredVars: ['API_URL', 'API_KEY']
});
```
