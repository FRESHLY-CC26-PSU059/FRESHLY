import { test, expect } from '@playwright/test';

// This file runs under the 'authenticated' project (storageState pre-loaded)

test.describe('Authenticated Admin Flow', () => {
  test('Admin can access dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Admin can access scans page', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/scans/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Admin can access settings page', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Admin can access conversations page', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/conversations/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Authenticated user accessing /login is redirected away', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toMatch(/\/login$/);
  });
});
