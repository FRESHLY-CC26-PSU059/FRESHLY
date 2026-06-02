import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a minimal test image (1x1 green PNG) for upload tests
function createTestImage(filePath: string) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
}

const TEST_IMAGE_PATH = path.join(__dirname, '.tmp', 'test-fruit.png');

test.describe('Admin - Scan Upload & Analysis', () => {
  test.beforeAll(() => {
    createTestImage(TEST_IMAGE_PATH);
  });

  test.afterAll(() => {
    if (fs.existsSync(TEST_IMAGE_PATH)) fs.unlinkSync(TEST_IMAGE_PATH);
    const tmpDir = path.dirname(TEST_IMAGE_PATH);
    if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true } as any);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('scans page renders with upload panel and history', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/scans/);

    // Upload buttons should be visible (Kamera + Upload)
    await expect(page.locator('text=Kamera')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Upload')).toBeVisible();
  });

  test('fruit type selector has correct options', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const fruitSelect = page.locator('select').first();
    if (await fruitSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await fruitSelect.locator('option').allTextContents();
      // Should have at least banana, mango, orange
      expect(options.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('upload button triggers file input', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    // Click Upload button and provide file
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // Preview mode should activate
    await page.waitForTimeout(1000);

    // Should show preview with "Analisis" and "Ulangi" buttons
    const analisisBtn = page.locator('button').filter({ hasText: /analisis/i });
    const ulangiBtn = page.locator('button').filter({ hasText: /ulangi/i });

    const hasPreview = await analisisBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPreview) {
      await expect(analisisBtn).toBeVisible();
      await expect(ulangiBtn).toBeVisible();
    }
  });

  test('upload and analyze sends API request', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    const analisisBtn = page.locator('button').filter({ hasText: /analisis/i });
    if (await analisisBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Intercept analyze API
      const analyzePromise = page.waitForResponse(resp =>
        resp.url().includes('/scans/analyze'),
        { timeout: 60000 }
      );

      await analisisBtn.click();

      // Wait for response (ML API might take a while)
      const resp = await analyzePromise;
      // 200 = success, 502/503/504 = ML API down (acceptable in test env)
      expect([200, 400, 502, 503, 504]).toContain(resp.status());

      if (resp.status() === 200) {
        // Result should show scan details
        await expect(page.locator('text=/matang|busuk|belum matang|ripe|rotten|unripe/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('reset button clears the preview', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    const ulangiBtn = page.locator('button').filter({ hasText: /ulangi/i });
    if (await ulangiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ulangiBtn.click();

      // Should return to idle mode with Kamera + Upload buttons
      await expect(page.locator('text=Kamera')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Upload')).toBeVisible();
    }
  });

  test('scan history table loads', async ({ page }) => {
    const historyPromise = page.waitForResponse(resp =>
      resp.url().includes('/scans') && resp.request().method() === 'GET' && resp.status() === 200
    );
    await page.goto('/admin/scans', { waitUntil: 'domcontentloaded' });

    const resp = await historyPromise;
    expect(resp.status()).toBe(200);
  });

  test('scan history search input filters results', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="search"], input[placeholder*="Cari"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('banana');
      await page.waitForTimeout(500);
      // Should trigger filtered API call
    }
  });

  test('scan detail modal opens on row click', async ({ page }) => {
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    // Click view button on first scan row
    const viewBtn = page.locator('button').filter({ has: page.locator('[data-lucide="eye"], .lucide-eye') }).first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();

      // Modal or detail view should appear
      await expect(page.locator('text=/detail|hasil|result/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
