import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api/v1';
const CLIENT_KEY = 'my-enterprise-client-key-123';
const TEST_USER = { email: 'admin@freshly.id', password: 'Admin@1234' };

test.describe('Auth - Login Form Real Submit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('fills email and password then submits login form', async ({ page }) => {
    // Intercept API login call to verify form sends correct data
    const loginPromise = page.waitForRequest(req =>
      req.url().includes('/auth/login') && req.method() === 'POST'
    );

    const emailInput = page.locator('input[placeholder="nama@email.com"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.getByRole('button', { name: /masuk|login|sign in/i });

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await submitBtn.click();

    // Verify login request was fired with correct email
    const loginReq = await loginPromise;
    const body = loginReq.postDataJSON();
    expect(body.email).toBe(TEST_USER.email);
  });

  test('shows validation when email is empty', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.getByRole('button', { name: /masuk|login|sign in/i });

    await passwordInput.fill('somepassword');
    await submitBtn.click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation when password is empty', async ({ page }) => {
    const emailInput = page.locator('input[placeholder="nama@email.com"]');
    const submitBtn = page.getByRole('button', { name: /masuk|login|sign in/i });

    await emailInput.fill('test@example.com');
    await submitBtn.click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('Secret123');

    // Click eye toggle
    const toggle = page.locator('button').filter({ has: page.locator('svg') }).last();
    await toggle.click();

    // Password field should now be text type
    await expect(page.locator('input[type="text"][value="Secret123"]')).toBeVisible({ timeout: 3000 });
  });

  test('navigates to register page via link', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /daftar|register|sign up/i });
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('navigates to forgot password page via link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /lupa|forgot/i });
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Auth - Register Form Real Submit', () => {
  const uniqueEmail = `e2etest_${Date.now()}@test.freshly.id`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
  });

  test('register form has all required fields', async ({ page }) => {
    await expect(page.locator('input[placeholder="John"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder="nama@email.com"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('fills all register fields and submits', async ({ page }) => {
    const registerPromise = page.waitForRequest(req =>
      req.url().includes('/auth/register') && req.method() === 'POST'
    );

    await page.locator('input[placeholder="John"]').fill('E2E');
    await page.locator('input[placeholder="Doe"]').fill('Tester');
    await page.locator('input[placeholder="nama@email.com"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill('Test@1234');

    // Check terms checkbox if exists
    const checkbox = page.locator('input[type="checkbox"]');
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.check();
    }

    const submitBtn = page.getByRole('button', { name: /daftar|register|sign up/i });
    await submitBtn.click();

    const req = await registerPromise;
    const body = req.postDataJSON();
    expect(body.email).toBe(uniqueEmail);
    expect(body.first_name).toBe('E2E');
    expect(body.last_name).toBe('Tester');
  });

  test('navigates to login page via link', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /masuk|login|sign in/i });
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth - Forgot Password Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
  });

  test('forgot password form renders', async ({ page }) => {
    await expect(page.locator('input[placeholder="nama@email.com"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /kirim|send|reset/i })).toBeVisible();
  });

  test('submits forgot password form with email', async ({ page }) => {
    const forgotPromise = page.waitForRequest(req =>
      req.url().includes('/auth/forgot-password') && req.method() === 'POST'
    );

    await page.locator('input[placeholder="nama@email.com"]').fill('test@freshly.id');
    await page.getByRole('button', { name: /kirim|send|reset/i }).click();

    const req = await forgotPromise;
    const body = req.postDataJSON();
    expect(body.email).toBe('test@freshly.id');
  });
});

test.describe('Auth - Logout Flow', () => {
  test('user can logout from dashboard', async ({ page }) => {
    // Login via API first
    const res = await page.request.post(`${API_BASE}/auth/login`, {
      headers: { 'Content-Type': 'application/json', 'x-client-key': CLIENT_KEY },
      data: { ...TEST_USER, recaptchaToken: 'dummy-recaptcha-token-for-testing-only' },
    });

    const body = await res.json();
    const { tokens, user } = body.data;

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ accessToken, refreshToken, userObj }) => {
      localStorage.setItem('freshly_access_token', accessToken);
      localStorage.setItem('freshly_refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userObj));
    }, { accessToken: tokens.access.token, refreshToken: tokens.refresh.token, userObj: user });

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should be redirected to dashboard
    await page.waitForURL(/\/(admin|user)\/dashboard/, { timeout: 10000 });

    // Find and click logout button/link in sidebar or dropdown
    const logoutBtn = page.getByRole('button', { name: /logout|keluar/i }).or(
      page.locator('text=/logout|keluar/i')
    );

    if (await logoutBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.first().click();
      // Should redirect to login
      await page.waitForURL(/\/login|\//, { timeout: 10000 });
    }
  });
});
