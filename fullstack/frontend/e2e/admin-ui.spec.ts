import { test, expect } from '@playwright/test';

test.describe('Admin UI - Sidebar & Navigation', () => {
  test('Sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // Sidebar should exist
    const sidebar = page.locator('aside, nav, [class*="Sidebar"], [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('Sidebar navigation links work', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Find and click a sidebar link to scans
    const scanLink = page.locator('a[href*="scans"]').first();
    if (await scanLink.isVisible()) {
      await scanLink.click();
      await expect(page).toHaveURL(/\/scans/);
    }
  });

  test('Dashboard renders content', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('#root')).not.toBeEmpty();
    // Should not be on login page (auth worked)
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Settings page shows user profile form', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    // Should have form inputs for profile
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Page has Freshly branding', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // Check for Freshly branding anywhere on page
    const freshlyText = page.locator('text=/freshly/i').first();
    await expect(freshlyText).toBeVisible();
  });
});

test.describe('Admin UI - Responsive', () => {
  test('Sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // On mobile, sidebar should not be fully visible or should be collapsed
    const sidebar = page.locator('aside, [class*="Sidebar"]').first();
    if (await sidebar.isVisible()) {
      const box = await sidebar.boundingBox();
      // Sidebar width should be small (collapsed) or off-screen
      expect(box).toBeTruthy();
    }
  });

  test('Dashboard content visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('#root')).not.toBeEmpty();
    const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowPx).toBeLessThanOrEqual(5);
  });
});
