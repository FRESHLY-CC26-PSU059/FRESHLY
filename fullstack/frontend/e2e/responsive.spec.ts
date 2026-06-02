import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

test.describe('Responsive Design', () => {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test(`Login page renders correctly on ${device}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: /freshly/i })).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      // No horizontal overflow
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflowX).toBe(false);
    });

    test(`Landing page renders correctly on ${device}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.locator('nav, header').first()).toBeVisible();
    });
  }

  test('Register form fields visible on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/register');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('Ensiklopedia page responsive on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/ensiklopedia');
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
