# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> manual GitHub login
- Location: e2e/auth.setup.ts:5:1

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: Timed out waiting for /app/ (last URL: https://github.com/login?client_id=Ov23libW6jHYAFTfCvxv&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3DOv23libW6jHYAFTfCvxv%26code_challenge%3DKQVGcXtArJWDeJHosCpHq2sMCjABTuELsw40yCKYoto%26code_challenge_method%3DS256%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A26631%252Fauth%252Fcallback%252Fgithub%26response_type%3Dcode%26scope%3Dread%253Auser%2Buser%253Aemail%26state%3DKP9QH2mrH4vxgWnKKRxD_eM5-vUt-66q). Finish GitHub sign-in in the Playwright window, or fix OAuth if stuck on login/github.
```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - link "Skip to content" [ref=f1e4] [cursor=pointer]:
      - /url: "#start-of-content"
    - banner [ref=f1e6]
  - main [ref=f1e9]:
    - generic [ref=f1e10]:
      - generic [ref=f1e12]:
        - img "Bondery (local development) logo" [ref=f1e14]
        - paragraph [ref=f1e15]:
          - text: Sign in to
          - strong [ref=f1e16]: GitHub
          - text: to continue to
          - strong [ref=f1e17]: Bondery (local development)
      - generic [ref=f1e18]:
        - generic [ref=f1e19]:
          - generic [ref=f1e20]:
            - generic [ref=f1e21]: Username or email address
            - textbox "Username or email address" [active] [ref=f1e22]
          - generic [ref=f1e23]:
            - generic [ref=f1e24]: Password
            - textbox "Password" [ref=f1e25]
            - link "Forgot password?" [ref=f1e26] [cursor=pointer]:
              - /url: /password_reset
          - button "Sign in" [ref=f1e28] [cursor=pointer]
        - generic [ref=f1e29]:
          - generic [ref=f1e30]: or
          - button "Continue with Google" [ref=f1e33] [cursor=pointer]
          - button "Continue with Apple" [ref=f1e37] [cursor=pointer]
      - generic [ref=f1e40]:
        - paragraph [ref=f1e42]:
          - text: New to GitHub?
          - link "Create an account" [ref=f1e43] [cursor=pointer]:
            - /url: /join?return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3DOv23libW6jHYAFTfCvxv%26code_challenge%3DKQVGcXtArJWDeJHosCpHq2sMCjABTuELsw40yCKYoto%26code_challenge_method%3DS256%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A26631%252Fauth%252Fcallback%252Fgithub%26response_type%3Dcode%26scope%3Dread%253Auser%2Buser%253Aemail%26state%3DKP9QH2mrH4vxgWnKKRxD_eM5-vUt-66q&source=oauth
        - paragraph [ref=f1e45]:
          - button "Sign in with a passkey" [ref=f1e46] [cursor=pointer]
  - contentinfo [ref=f1e49]:
    - list [ref=f1e50]:
      - listitem [ref=f1e51]:
        - link "Terms" [ref=f1e52] [cursor=pointer]:
          - /url: https://docs.github.com/site-policy/github-terms/github-terms-of-service
      - listitem [ref=f1e53]:
        - link "Privacy" [ref=f1e54] [cursor=pointer]:
          - /url: https://docs.github.com/site-policy/privacy-policies/github-privacy-statement
      - listitem [ref=f1e55]:
        - link "Docs" [ref=f1e56] [cursor=pointer]:
          - /url: https://docs.github.com
      - listitem [ref=f1e57]:
        - link "Contact GitHub Support" [ref=f1e58] [cursor=pointer]:
          - /url: https://support.github.com
      - listitem [ref=f1e59]:
        - button "Manage cookies" [ref=f1e61] [cursor=pointer]
      - listitem [ref=f1e62]:
        - button "Do not share my personal information" [ref=f1e64] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test as setup } from "@playwright/test";
  2  | 
  3  | const authFile = ".auth/user.json";
  4  | 
  5  | setup("manual GitHub login", async ({ page }) => {
  6  |   setup.setTimeout(300_000);
  7  | 
  8  |   await page.goto("/login");
  9  |   await page.getByTestId("login-github").click();
  10 | 
  11 |   // Complete GitHub sign-in in the Playwright browser window when prompted.
  12 |   try {
  13 |     await page.waitForURL(/\/app\//, { timeout: 300_000 });
  14 |   } catch (error) {
  15 |     const url = page.url();
  16 |     if (url.includes("error=oauth")) {
  17 |       throw new Error(
  18 |         `OAuth failed — landed on ${url}. ` +
  19 |           "Common fixes: align BONDERY_PUBLIC_*_URL with E2E_PUBLIC_HOST (localhost vs 127.0.0.1), " +
  20 |           "set GitHub callback to http://<host>:26631/auth/callback/github, " +
  21 |           "run `npm run provision-oauth-clients:dev -w api`, restart dev servers.",
  22 |         { cause: error },
  23 |       );
  24 |     }
  25 | 
> 26 |     throw new Error(
     |           ^ Error: Timed out waiting for /app/ (last URL: https://github.com/login?client_id=Ov23libW6jHYAFTfCvxv&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3DOv23libW6jHYAFTfCvxv%26code_challenge%3DKQVGcXtArJWDeJHosCpHq2sMCjABTuELsw40yCKYoto%26code_challenge_method%3DS256%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A26631%252Fauth%252Fcallback%252Fgithub%26response_type%3Dcode%26scope%3Dread%253Auser%2Buser%253Aemail%26state%3DKP9QH2mrH4vxgWnKKRxD_eM5-vUt-66q). Finish GitHub sign-in in the Playwright window, or fix OAuth if stuck on login/github.
  27 |       `Timed out waiting for /app/ (last URL: ${url}). ` +
  28 |         "Finish GitHub sign-in in the Playwright window, or fix OAuth if stuck on login/github.",
  29 |       { cause: error },
  30 |     );
  31 |   }
  32 | 
  33 |   await expect(page).not.toHaveURL(/error=oauth/);
  34 |   await page.context().storageState({ path: authFile });
  35 | });
  36 | 
```