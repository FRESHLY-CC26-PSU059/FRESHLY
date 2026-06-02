import { test, expect } from '@playwright/test';

const uniqueTitle = () => `E2E Test Article ${Date.now()}`;

test.describe('Admin - Articles (authenticated)', () => {
  test('Articles page renders table and toolbar', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/articles/);

    // Search input
    await expect(page.locator('input[placeholder*="artikel"], input[placeholder*="Cari"]').first()).toBeVisible();
    // Add button
    await expect(page.getByRole('button', { name: /tambah artikel/i })).toBeVisible();
  });

  test('Search filters articles via debounced query', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    const search = page.locator('input[placeholder*="artikel"], input[placeholder*="Cari"]').first();
    await search.fill('zzznonexistentquery_xxx');
    await page.waitForTimeout(500);
    // Empty state should appear
    await expect(page.locator('text=/belum ada artikel/i')).toBeVisible({ timeout: 5000 });
  });

  test('Create article modal opens and validates required content', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();

    // Title input is visible
    await expect(page.locator('input[placeholder*="judul"]').first()).toBeVisible();

    // Submitting without content should toast "Konten artikel tidak boleh kosong"
    await page.locator('input[placeholder*="judul"]').first().fill(uniqueTitle());
    await page.locator('button[form="article-form"]').click();

    // Toast appears
    await expect(page.locator('text=/konten artikel tidak boleh kosong/i')).toBeVisible({ timeout: 5000 });
  });

  test('Category dropdown shows fruit and vegetable options', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /tambah artikel/i }).click();

    const select = page.locator('select').first();
    await expect(select).toBeVisible();

    const optionTexts = await select.locator('option').allTextContents();
    expect(optionTexts.some(t => /buah/i.test(t))).toBe(true);
    expect(optionTexts.some(t => /sayur/i.test(t))).toBe(true);
  });

  test('Modal close button restores page state', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();

    await page.getByRole('button', { name: /^batal$/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).not.toBeVisible();
  });

  test('Articles list API is hit on page load', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/articles') && resp.status() === 200
    );
    await page.goto('/admin/articles', { waitUntil: 'domcontentloaded' });
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});
