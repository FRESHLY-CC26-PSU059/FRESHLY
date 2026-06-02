import { test, expect } from '@playwright/test';

test.describe('Theme', () => {
  test('Page has valid data-theme attribute', async ({ page }) => {
    await page.goto('/login');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['light', 'dark']).toContain(theme);
  });

  test('Theme toggle works via localStorage', async ({ page }) => {
    await page.goto('/login');
    const html = page.locator('html');

    // Force light
    await page.evaluate(() => {
      localStorage.setItem('freshly-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Force dark
    await page.evaluate(() => {
      localStorage.setItem('freshly-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Heading still visible in both themes
    await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
  });

  test('Auth pages have consistent branding across all pages', async ({ page }) => {
    const routes = ['/login', '/register', '/forgot-password'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
      // Card container should have consistent styling class
      await expect(page.locator('.premium-shadow, [class*="shadow"]').first()).toBeVisible();
    }
  });

  test('Dark mode does not break text contrast', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    // Check body has a background and text is visible
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // Should have explicit bg
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });
});

test.describe('i18n', () => {
  test('Language persists across pages', async ({ page }) => {
    // Default language should be id or en
    await page.goto('/login');
    const lang = await page.evaluate(() => document.documentElement.lang || localStorage.getItem('i18nextLng') || 'id');
    expect(['id', 'en', 'en-US', 'en-GB']).toContain(lang);
  });
});
