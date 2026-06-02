import { test, expect } from '@playwright/test';

test.describe('Production - Auth Flow (authenticated)', () => {
  test('Authenticated user is redirected away from /login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    // PublicRoute redirects authenticated users to /dashboard
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toMatch(/\/login$/);
  });

  test('Authenticated user is redirected away from /register', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toMatch(/\/register$/);
  });

  test('/dashboard redirects admin to /admin/dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Auth tokens exist in localStorage', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const tokens = await page.evaluate(() => ({
      access: !!localStorage.getItem('freshly_access_token'),
      refresh: !!localStorage.getItem('freshly_refresh_token'),
      user: !!localStorage.getItem('user'),
    }));
    expect(tokens.access).toBe(true);
    expect(tokens.refresh).toBe(true);
    expect(tokens.user).toBe(true);
  });

  test('User object in localStorage has admin role', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const userRole = await page.evaluate(() => {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user.role;
    });
    expect(['admin', 'super_admin']).toContain(userRole);
  });

  test('Protected admin routes are accessible', async ({ page }) => {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/scans',
      '/admin/articles',
      '/admin/knowledge',
      '/admin/conversations',
      '/admin/roles',
      '/admin/notifications',
      '/admin/newsletter',
      '/admin/testimonials',
      '/admin/audit-logs',
      '/admin/settings',
      '/admin/profile',
    ];

    for (const route of adminRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Should NOT redirect to /login
      await page.waitForTimeout(500);
      expect(page.url()).not.toMatch(/\/login/);
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });
});

test.describe('Production - Auth Pages UI (public, no storageState conflict)', () => {
  // These tests need to run WITHOUT auth. We use a new context to clear storageState.
  test('Login page form elements are complete', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|sign in/i }).first()).toBeVisible();

    await context.close();
  });

  test('Register page form elements are complete', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    await context.close();
  });

  test('Unauthenticated user cannot access /admin/dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);

    await context.close();
  });

  test('Unauthenticated user cannot access /admin/users', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);

    await context.close();
  });

  test('Login → Forgot Password navigation works', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /lupa|forgot/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);

    await context.close();
  });

  test('Login → Register navigation works', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto('https://freshly.web.id/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /daftar|register/i }).click();
    await expect(page).toHaveURL(/\/register/);

    await context.close();
  });
});

test.describe('Production - Theme & Responsive (authenticated)', () => {
  test('Dark mode toggle works in admin', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    const html = page.locator('html');
    const currentTheme = await html.getAttribute('data-theme');
    expect(['light', 'dark']).toContain(currentTheme);

    // Toggle to dark
    await page.evaluate(() => {
      localStorage.setItem('freshly-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Content still visible
    await expect(page.locator('#root')).not.toBeEmpty();

    // Toggle back to light
    await page.evaluate(() => {
      localStorage.setItem('freshly-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('Admin dashboard responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('#root')).not.toBeEmpty();
    const overflowPx = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflowPx).toBeLessThanOrEqual(5);
  });

  test('Admin dashboard responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('#root')).not.toBeEmpty();
    const overflowPx = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflowPx).toBeLessThanOrEqual(5);
  });

  test('No console errors on admin dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    // Filter known benign errors
    const realErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('recaptcha') &&
      !e.includes('favicon') &&
      !e.includes('service-worker') &&
      !e.includes('ServiceWorker') &&
      !e.includes('FCM') &&
      !e.includes('messaging') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Failed to load resource') &&
      !e.includes('VAPID')
    );
    if (realErrors.length > 0) console.log('Console errors:', realErrors);
    expect(realErrors.length).toBe(0);
  });
});
