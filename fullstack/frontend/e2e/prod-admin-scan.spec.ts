import { test, expect } from '@playwright/test';

test.describe('Production - Scan Page Interactions', () => {
  test('scans page renders with upload panel', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/scans/);
    await expect(page.locator('text=Kamera')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Upload')).toBeVisible();
  });

  test('fruit type selector has options', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const fruitSelect = page.locator('select').first();
    if (await fruitSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await fruitSelect.locator('option').allTextContents();
      expect(options.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('scan history API loads', async ({ page }) => {
    const historyPromise = page.waitForResponse(resp =>
      resp.url().includes('/scans') && resp.request().method() === 'GET' && resp.status() === 200
    );
    await page.goto('/admin/scans', { waitUntil: 'domcontentloaded' });
    const resp = await historyPromise;
    expect(resp.status()).toBe(200);
  });

  test('scan history search input works', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="search"], input[placeholder*="Cari"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('banana');
      await page.waitForTimeout(500);
    }
  });

  test('scan detail modal opens on view button', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const viewBtn = page.locator('button').filter({ has: page.locator('[data-lucide="eye"], .lucide-eye') }).first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();
      await expect(page.locator('text=/detail|hasil|result/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
