import { Page } from '@playwright/test';

export const API_BASE = 'http://localhost:5000/api/v1';
const CLIENT_KEY = 'my-enterprise-client-key-123';

/**
 * Login via API and inject tokens into localStorage to bypass UI login.
 * Uses a two-step approach: navigate to app first, set localStorage, then reload.
 * Requires backend running at localhost:5000.
 */
export async function loginAsAdmin(page: Page) {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    headers: { 'Content-Type': 'application/json', 'x-client-key': CLIENT_KEY },
    data: {
      email: 'admin@freshly.id',
      password: 'Admin@1234',
      recaptchaToken: 'dummy-recaptcha-token-for-testing-only',
    },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  const body = await res.json();
  const { tokens, user } = body.data;

  // Step 1: Navigate to app to get a page context with localStorage access
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Step 2: Inject auth tokens into localStorage
  await page.evaluate(({ accessToken, refreshToken, userObj }) => {
    localStorage.setItem('freshly_access_token', accessToken);
    localStorage.setItem('freshly_refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userObj));
  }, {
    accessToken: tokens.access.token,
    refreshToken: tokens.refresh.token,
    userObj: user,
  });

  // Step 3: Reload so Redux store re-initializes from localStorage
  await page.reload({ waitUntil: 'domcontentloaded' });
}
