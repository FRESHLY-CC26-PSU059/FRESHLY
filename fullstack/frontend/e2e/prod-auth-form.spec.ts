import { test, expect } from '@playwright/test';

test.describe('Production - Login Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
  });

  test('login form has email and password fields', async ({ page }) => {
    await expect(page.locator('input[placeholder="nama@email.com"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('fills email and password fields correctly', async ({ page }) => {
    const emailInput = page.locator('input[placeholder="nama@email.com"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPassword123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('TestPassword123');
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('Secret123');

    // Find the toggle button near the password field
    const passwordContainer = passwordInput.locator('..');
    const toggleBtn = passwordContainer.locator('button').first();
    if (await toggleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleBtn.click();
      // Should switch to text type
      await expect(page.locator('input[value="Secret123"][type="text"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('submit with empty fields stays on login page', async ({ page }) => {
    const submitBtn = page.locator('form button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('navigate to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /daftar|register|sign up/i });
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('navigate to forgot password page', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /lupa|forgot/i });
    await forgotLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Production - Register Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });
  });

  test('register form has all required fields', async ({ page }) => {
    await expect(page.locator('input[placeholder="John"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder="nama@email.com"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('fills all register fields correctly', async ({ page }) => {
    await page.locator('input[placeholder="John"]').fill('E2E');
    await page.locator('input[placeholder="Doe"]').fill('Tester');
    await page.locator('input[placeholder="nama@email.com"]').fill('e2e@test.com');
    await page.locator('input[type="password"]').fill('Test@1234');

    await expect(page.locator('input[placeholder="John"]')).toHaveValue('E2E');
    await expect(page.locator('input[placeholder="Doe"]')).toHaveValue('Tester');
    await expect(page.locator('input[placeholder="nama@email.com"]')).toHaveValue('e2e@test.com');
  });

  test('navigate back to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /masuk|login|sign in/i });
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Production - Forgot Password Form', () => {
  test('forgot password form renders and accepts email', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'networkidle' });

    const emailInput = page.locator('input[placeholder="nama@email.com"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('test@freshly.id');
    await expect(emailInput).toHaveValue('test@freshly.id');

    await expect(page.getByRole('button', { name: /kirim|send|reset/i })).toBeVisible();
  });
});
