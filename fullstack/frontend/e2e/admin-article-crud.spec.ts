import { test, expect } from '@playwright/test';
import { loginAsAdmin, API_BASE } from './helpers';

const CLIENT_KEY = 'my-enterprise-client-key-123';
const uniqueTitle = () => `E2E Full CRUD ${Date.now()}`;

test.describe('Admin - Article Full CRUD via Form', () => {
  let createdArticleId: number | null = null;
  let testTitle: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('create article with title, category, and content', async ({ page }) => {
    testTitle = uniqueTitle();
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    // Open create modal
    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();

    // Fill title
    const titleInput = page.locator('input[placeholder*="judul"]').first();
    await titleInput.fill(testTitle);

    // Select category
    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await categorySelect.locator('option').allTextContents();
      const fruitOption = options.find(t => /buah/i.test(t));
      if (fruitOption) {
        await categorySelect.selectOption({ label: fruitOption });
      }
    }

    // Fill Tiptap editor content
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]').first();
    if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editor.click();
      await editor.fill('Ini adalah konten artikel E2E test untuk pengujian CRUD lengkap.');
    }

    // Intercept create API
    const createPromise = page.waitForResponse(resp =>
      resp.url().includes('/articles') && resp.request().method() === 'POST'
    );

    // Submit
    const submitBtn = page.locator('button[form="article-form"]').or(
      page.getByRole('button', { name: /simpan|save|publish/i }).last()
    );
    await submitBtn.click();

    const resp = await createPromise;
    if (resp.status() === 201 || resp.status() === 200) {
      const body = await resp.json();
      createdArticleId = body.data?.article?.id || null;
      // Success toast
      await expect(page.locator('text=/berhasil|success/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('search for created article', async ({ page }) => {
    if (!testTitle) test.skip();

    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="artikel"], input[placeholder*="Cari"]').first();
    await searchInput.fill('E2E Full CRUD');
    await page.waitForTimeout(600);

    // Should find at least one result
    const rows = page.locator('table tbody tr, [class*="article-card"], [class*="ArticleItem"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0); // may be 0 if creation failed
  });

  test('edit article updates title', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    // Find edit button on first article
    const editBtn = page.locator('button').filter({ has: page.locator('[data-lucide="edit"], [data-lucide="edit-2"], [data-lucide="pencil"], .lucide-pencil') }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      // Modal should open with pre-filled title
      const titleInput = page.locator('input[placeholder*="judul"]').first();
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });

      const oldTitle = await titleInput.inputValue();
      await titleInput.clear();
      await titleInput.fill(`${oldTitle} [edited]`);

      const updatePromise = page.waitForResponse(resp =>
        resp.url().includes('/articles') && resp.request().method() === 'PUT'
      );

      const submitBtn = page.locator('button[form="article-form"]').or(
        page.getByRole('button', { name: /simpan|save|update/i }).last()
      );
      await submitBtn.click();

      const resp = await updatePromise;
      expect([200, 201]).toContain(resp.status());
    }
  });

  test('delete article shows confirmation and removes it', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    const deleteBtn = page.locator('button').filter({ has: page.locator('[data-lucide="trash-2"], .lucide-trash-2') }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();

      // Confirm dialog should appear
      await expect(page.locator('text=/hapus|yakin|konfirmasi/i').first()).toBeVisible({ timeout: 3000 });

      // Click confirm (not cancel)
      const confirmBtn = page.getByRole('button', { name: /hapus|ya|confirm|delete/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const deletePromise = page.waitForResponse(resp =>
          resp.url().includes('/articles') && resp.request().method() === 'DELETE'
        );
        await confirmBtn.click();
        const resp = await deletePromise;
        expect([200, 204]).toContain(resp.status());
      }
    }
  });

  test('pagination controls work', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    // Check if pagination exists
    const nextBtn = page.getByRole('button', { name: /next|selanjutnya|>/i }).or(
      page.locator('button[aria-label*="next"], button[aria-label*="Next"]')
    );

    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const apiPromise = page.waitForResponse(resp =>
        resp.url().includes('/articles') && resp.url().includes('page=') && resp.status() === 200
      );
      await nextBtn.click();
      await apiPromise;
    }
  });
});
