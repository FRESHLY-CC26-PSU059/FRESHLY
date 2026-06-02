import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE_PATH = 'e2e/.auth/prod-admin.json';
const PROD_API = 'https://freshly.web.id/api/v1';
const CLIENT_KEY = 'dGltY2Fwc3RvbmVtYW50YXBvaQ==';
const E2E_BYPASS = process.env.E2E_BYPASS_TOKEN || '';

/**
 * Production auth setup — three strategies (tried in order):
 *
 * 1. **API login + E2E bypass** (headless-safe, fastest): if E2E_BYPASS_TOKEN
 *    env var is set, calls POST /auth/login with x-e2e-bypass header to skip
 *    reCAPTCHA verification entirely.
 *
 * 2. **Token refresh** (headless-safe): if a previous storageState exists
 *    with a valid refresh token, calls POST /refresh-tokens (no reCAPTCHA).
 *
 * 3. **UI login** (headed fallback): fills the login form and submits.
 *    Requires headed mode since reCAPTCHA blocks automated browsers.
 *
 * Setup:
 *   1. Set E2E_BYPASS_TOKEN in backend .env + Vercel env vars
 *   2. Run: E2E_BYPASS_TOKEN=<token> npx playwright test --config=playwright.production.config.ts
 */
setup('authenticate as admin on production', async ({ page }) => {
  setup.slow();

  const stateFile = path.resolve(AUTH_STATE_PATH);

  // Helper: inject tokens into localStorage + save storageState
  async function injectTokens(accessToken: string, refreshToken: string, user: any) {
    await page.goto('https://freshly.web.id/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ({ at, rt, u }) => {
        localStorage.setItem('freshly_access_token', at);
        localStorage.setItem('freshly_refresh_token', rt);
        localStorage.setItem('user', JSON.stringify(u));
      },
      { at: accessToken, rt: refreshToken, u: user },
    );
    await page.context().storageState({ path: AUTH_STATE_PATH });
  }

  // Helper: fetch user profile with access token
  // Response shape: { status, data: { user: {...} } } — unwrap to plain user object
  async function fetchUser(accessToken: string) {
    const meRes = await page.request.get(`${PROD_API}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'x-client-key': CLIENT_KEY },
    });
    if (meRes.ok()) {
      const body = await meRes.json();
      return body.data?.user ?? body.data ?? body;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // Strategy 1 — API login (tries bypass header, then bare login)
  // ═══════════════════════════════════════════════════════════════
  const loginAttempts: Array<{ headers: Record<string, string>; data: Record<string, string> }> = [];
  if (E2E_BYPASS) {
    loginAttempts.push({
      headers: { 'Content-Type': 'application/json', 'x-client-key': CLIENT_KEY, 'x-e2e-bypass': E2E_BYPASS },
      data: { email: 'admin@freshly.id', password: 'Admin@1234', recaptchaToken: 'e2e-bypass' },
    });
  }
  // Try without recaptcha — some backends allow it for server-side calls
  loginAttempts.push({
    headers: { 'Content-Type': 'application/json', 'x-client-key': CLIENT_KEY },
    data: { email: 'admin@freshly.id', password: 'Admin@1234', recaptchaToken: '' },
  });

  for (const attempt of loginAttempts) {
    const res = await page.request.post(`${PROD_API}/auth/login`, { headers: attempt.headers, data: attempt.data });
    if (res.ok()) {
      const body = await res.json();
      const { access, refresh } = body.data.tokens;
      await injectTokens(access.token, refresh.token, body.data.user);
      return; // ✅ API login — done
    }
    const text = await res.text();
    console.warn(`API login attempt failed [${res.status()}]: ${text.slice(0, 200)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // Strategy 2 — Reuse existing tokens from saved state
  // ═══════════════════════════════════════════════════════════════
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      const freshlyOrigin = (state.origins || []).find(
        (o: any) => o.origin.includes('freshly.web.id'),
      );
      const ls: { name: string; value: string }[] = freshlyOrigin?.localStorage || [];

      const accessToken = ls.find(i => i.name === 'freshly_access_token')?.value;
      const refreshToken = ls.find(i => i.name === 'freshly_refresh_token')?.value;
      const existingUserStr = ls.find(i => i.name === 'user')?.value;

      // Decode JWT exp claim (no signature verification — just timing check)
      const isJwtValid = (jwt: string) => {
        try {
          const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
          // Add 60s buffer to avoid edge cases
          return payload.exp && payload.exp * 1000 > Date.now() + 60_000;
        } catch {
          return false;
        }
      };

      // 2a. Access token still valid → use as-is, no API call needed
      if (accessToken && isJwtValid(accessToken)) {
        const userObj = existingUserStr ? JSON.parse(existingUserStr) : {};
        await injectTokens(accessToken, refreshToken || '', userObj);
        return; // ✅ Existing token still valid
      }

      // 2b. Access token expired but refresh token still valid → refresh
      if (refreshToken && isJwtValid(refreshToken)) {
        const res = await page.request.post(`${PROD_API}/auth/refresh-tokens`, {
          headers: { 
            'Content-Type': 'application/json', 
            'x-client-key': CLIENT_KEY,
          },
          data: { refreshToken },
        });

        if (res.ok()) {
          const body = await res.json();
          const tokens = body.data?.tokens ?? body.tokens ?? body;
          const newAccessToken = tokens.access?.token;
          const newRefreshToken = tokens.refresh?.token;

          if (newAccessToken) {
            let userObj: any = existingUserStr ? JSON.parse(existingUserStr) : {};
            const freshUser = await fetchUser(newAccessToken);
            if (freshUser) userObj = freshUser;

            await injectTokens(newAccessToken, newRefreshToken || refreshToken, userObj);
            return; // ✅ Token refreshed
          }
          console.warn('Refresh succeeded but no access token in response:', JSON.stringify(body).slice(0, 300));
        } else {
          const errText = await res.text();
          console.warn(`Token refresh failed [${res.status()}]: ${errText.slice(0, 200)}`);
        }
      }
    } catch {
      // State corrupt — fall through
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Strategy 3 — UI login with reCAPTCHA mock (headless-safe)
  //
  // Mock grecaptcha on the page so the React component's
  // executeAsync() resolves with a fake token, then intercept
  // the login POST to add x-e2e-bypass header (if env is set)
  // or let the fake token go through (backend may accept it in
  // test mode).
  // ═══════════════════════════════════════════════════════════════

  // Before navigating, set up route interception for reCAPTCHA script
  // to prevent external reCAPTCHA from overwriting our mock
  await page.route('**/recaptcha/**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `
      window.grecaptcha = {
        ready: function(cb) { cb(); },
        execute: function() { return Promise.resolve('e2e-mock-token'); },
        render: function() { return 0; },
        reset: function() {},
        enterprise: {
          ready: function(cb) { cb(); },
          execute: function() { return Promise.resolve('e2e-mock-token'); },
          render: function() { return 0; },
          reset: function() {}
        }
      };
    `,
  }));

  // Intercept login POST to add E2E bypass header if available
  if (E2E_BYPASS) {
    await page.route('**/api/v1/auth/login', async (route, request) => {
      await route.continue({
        headers: { ...request.headers(), 'x-e2e-bypass': E2E_BYPASS },
      });
    });
  }

  await page.goto('/login', { waitUntil: 'networkidle' });

  // Also inject mock directly in case script loaded before route handler
  await page.evaluate(() => {
    const mock = {
      ready: (cb: () => void) => cb(),
      execute: () => Promise.resolve('e2e-mock-token'),
      render: () => 0,
      reset: () => {},
    };
    (window as any).grecaptcha = { ...mock, enterprise: { ...mock } };
  });

  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await page.getByPlaceholder(/email/i).fill('admin@freshly.id');

  const pwInput = page.locator('input[name="password"], input[type="password"]').first();
  await pwInput.fill('Admin@1234');

  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /masuk|sign in/i }).first().click();

  try {
    await page.waitForURL(/\/(admin\/dashboard|user\/dashboard|dashboard)/, { timeout: 30000 });
  } catch {
    throw new Error(
      'All login strategies failed.\n\n' +
      'Option A (recommended): Set E2E_BYPASS_TOKEN in production backend env,\n' +
      '  then run: E2E_BYPASS_TOKEN=<secret> npx playwright test --config=playwright.production.config.ts\n\n' +
      'Option B: Run ONCE in headed mode to bootstrap tokens:\n' +
      '  npx playwright test --config=playwright.production.config.ts --project=prod-setup --headed\n' +
      '  (subsequent headless runs will auto-refresh tokens for ~30 days)\n\n' +
      'Backend supports x-e2e-bypass header in recaptcha.middleware.js — just set the env var.',
    );
  }

  const hasToken = await page.evaluate(() => !!localStorage.getItem('freshly_access_token'));
  expect(hasToken).toBe(true);

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
