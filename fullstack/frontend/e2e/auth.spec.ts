import { test, expect } from '@playwright/test';

// ── Unauthenticated Auth Pages ──
test.describe('Auth Pages - UI & Navigation', () => {
  test('Login page renders all form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|sign in/i }).first()).toBeVisible();
    // Google sign-in button should exist
    await expect(page.getByRole('button', { name: /google/i }).first()).toBeVisible();
  });

  test('Register page renders all form elements', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Terms & privacy links should exist
    await expect(page.locator('text=/ketentuan|terms/i')).toBeVisible();
  });

  test('Forgot Password page renders correctly', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('Navigate Login → Register → Login roundtrip', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /daftar|register/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByRole('link', { name: /masuk|sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Navigate Login → Forgot Password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /lupa|forgot/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

// ── Route Guards ──
test.describe('Route Guards', () => {
  test('Unauthenticated → /user/dashboard redirects to /login', async ({ page }) => {
    await page.goto('/user/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Unauthenticated → /admin/dashboard redirects to /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Unauthenticated → /user/scans redirects to /login', async ({ page }) => {
    await page.goto('/user/scans');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Unauthenticated → /user/conversations redirects to /login', async ({ page }) => {
    await page.goto('/user/conversations');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Unauthenticated → /user/settings redirects to /login', async ({ page }) => {
    await page.goto('/user/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Login Form Validation ──
test.describe('Login Form Validation', () => {
  test('Empty email shows browser validation', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('SomePassword1!');
    // Try to submit with empty email — browser should block
    const submitBtn = page.getByRole('button', { name: /masuk|sign in/i }).first();
    await submitBtn.click();
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Password toggle visibility works', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('test123');
    // Find the toggle button near the password input
    const toggleBtn = page.locator('input[type="password"] ~ button, input[type="password"] + button, [class*="password"] button').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      // After toggle, input type should change to text
      await expect(page.locator('input[name="password"][type="text"]')).toBeVisible();
    }
  });
});

