# Flaky tests

Strategies for identifying, fixing, and quarantining unstable E2E specs.

## Identify flakiness

```bash
# Repeat a spec many times locally
npx playwright test -c apps/webapp/e2e/playwright.config.mjs login.unauth --repeat-each=10

# With retries to see pass-after-retry
npx playwright test -c apps/webapp/e2e/playwright.config.mjs --retries=3
```

If a test passes inconsistently, treat it as flaky — do not merge until fixed or quarantined.

## Quarantine

```typescript
test('flaky: logout clears session', async ({ page }) => {
  test.fixme(true, 'Flaky — Plane BON-123')
  // ...
})

// Or skip only in CI while investigating
test('conditional', async ({ page }) => {
  test.skip(Boolean(process.env.CI), 'Flaky in CI — Plane BON-123')
})
```

Always link a tracking issue. Remove quarantine in the same PR that fixes root cause.

## Common causes in Bondery

### Race conditions

```typescript
// Bad
await page.click('[data-testid="login-github"]')

// Good — Playwright auto-waits
await page.getByTestId('login-github').click()
```

### Arbitrary timeouts

```typescript
// Bad
await page.waitForTimeout(5000)

// Good
await page.waitForURL(/\/app\//, { timeout: 300_000 })
await expect(page.getByTestId('login-github')).toBeVisible()
```

### OAuth / external redirects

GitHub login is inherently slow and environment-dependent. Use:

- `github-login` project with extended timeout (`300_000` ms in config)
- `auth` project with pre-saved `storageState` for specs that don't need to test OAuth itself
- `E2E_REUSE_SERVER=1` to avoid port races during local dev

### Port conflicts

`global-setup.mjs` kills 26631/26632 unless `E2E_REUSE_SERVER=1`. If tests fail with "port in use", run `npm run kill:dev` or set reuse flag.

### Stale auth state

`login.authenticated.spec.ts` skips when `.auth/user.json` is missing. Re-run:

```bash
npm run test:e2e:auth-setup -w webapp -- --headed
```

## Retries

Webapp config: `retries: process.env.CI ? 1 : 0`. Retries mask flakiness — use for CI stability, not as a substitute for fixing tests.

## Flaky test checklist

- [ ] Root cause identified (not just "added retry")
- [ ] `test.fixme` or `test.skip` has issue link if not fixed in same PR
- [ ] No new `waitForTimeout` introduced
- [ ] OAuth-dependent specs use correct project and timeout
- [ ] Auth storage refreshed when session specs fail consistently
