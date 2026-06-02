import { test as setup, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api/v1';
const CLIENT_KEY = 'my-enterprise-client-key-123';
const AUTH_STATE_PATH = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    headers: { 'Content-Type': 'application/json', 'x-client-key': CLIENT_KEY },
    data: {
      email: 'admin@freshly.id',
      password: 'Admin@1234',
      recaptchaToken: 'dummy-recaptcha-token-for-testing-only',
    },
  });

  if (!res.ok()) {
    const errorText = await res.text();
    throw new Error(`Login failed [${res.status()}]: ${errorText}`);
  }

  const body = await res.json();
  const { tokens, user } = body.data;

  // Navigate to app so we can access localStorage
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Set auth tokens in localStorage
  await page.evaluate(({ accessToken, refreshToken, userObj }) => {
    localStorage.setItem('freshly_access_token', accessToken);
    localStorage.setItem('freshly_refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userObj));
  }, {
    accessToken: tokens.access.token,
    refreshToken: tokens.refresh.token,
    userObj: user,
  });

  // Save storage state (includes localStorage) for reuse
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
