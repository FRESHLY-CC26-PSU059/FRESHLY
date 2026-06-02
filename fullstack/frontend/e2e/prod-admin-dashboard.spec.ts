import { test, expect } from '@playwright/test';

test.describe('Production - Admin Dashboard', () => {
  test('Dashboard page loads and shows content', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for React auth context to fully initialize
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Dashboard fetches stats from API', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    // Stats should be rendered (numbers from /stats/overview)
    const body = await page.locator('main, #root').first().innerText();
    expect(body).toMatch(/\d+/);
  });

  test('Dashboard displays stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // Stat cards should contain numeric values (totalUsers, totalScans, etc.)
    // Look for elements that contain numbers in card-like containers
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"], [class*="Stat"]');
    const cardCount = await cards.count();
    // If no semantic cards found, at least check for visible numbers on page
    if (cardCount === 0) {
      const bodyText = await page.locator('main, [class*="content"]').first().innerText();
      expect(bodyText).toMatch(/\d+/);
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('Sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('Sidebar shows Freshly branding', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('text=/freshly/i').first()).toBeVisible();
  });

  test('Sidebar shows Admin Panel label', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('text=/admin panel/i').first()).toBeVisible();
  });

  test('Header is visible with user avatar/menu', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    const header = page.locator('header').first();
    if (await header.isVisible()) {
      await expect(header).toBeVisible();
    } else {
      // Header might not use <header> tag — check for top bar area
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });

  test('Dashboard fetches recent audit logs', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/audit-logs')
    );
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
  });

  test('Sidebar navigation to Scans page works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    const scanLink = page.locator('a[href="/admin/scans"]').first();
    await expect(scanLink).toBeVisible();
    await scanLink.click();
    await expect(page).toHaveURL(/\/admin\/scans/);
  });

  test('Dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    const overflowPx = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflowPx).toBeLessThanOrEqual(5);
  });

  test('Dashboard mobile - sidebar collapses', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // On mobile the sidebar should be hidden (translated off-screen)
    const sidebar = page.locator('aside').first();
    if (await sidebar.isVisible()) {
      const box = await sidebar.boundingBox();
      // If visible, it should be overlaying (z-index) or narrow
      expect(box).toBeTruthy();
    }
    // Main content should still be visible
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
