import { test, expect } from '@playwright/test';

test.describe('Production - Articles CRUD Interactions', () => {
  test('create article modal opens with form', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();

    // Title input
    await expect(page.locator('input[placeholder*="judul"]').first()).toBeVisible();

    // Category dropdown
    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await categorySelect.locator('option').allTextContents();
      expect(options.some(t => /buah/i.test(t))).toBe(true);
    }

    // Tiptap editor
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]').first();
    if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editor.click();
      await editor.fill('E2E test content');
    }

    // Close
    await page.getByRole('button', { name: /^batal$/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).not.toBeVisible();
  });

  test('search filters articles', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="artikel"], input[placeholder*="Cari"]').first();
    await searchInput.fill('zzznonexistentquery_xxx');
    await page.waitForTimeout(600);
    await expect(page.locator('text=/belum ada artikel/i')).toBeVisible({ timeout: 5000 });
  });

  test('edit article modal opens with pre-filled title', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    const editBtn = page.locator('button').filter({ has: page.locator('[data-lucide="pencil"], [data-lucide="edit"], .lucide-pencil') }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      const titleInput = page.locator('input[placeholder*="judul"]').first();
      await titleInput.waitFor({ state: 'visible', timeout: 5000 });
      const value = await titleInput.inputValue();
      expect(value.length).toBeGreaterThan(0);

      // Close
      await page.getByRole('button', { name: /^batal$/i }).click();
    }
  });

  test('delete article shows confirmation dialog', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });

    const deleteBtn = page.locator('button').filter({ has: page.locator('[data-lucide="trash-2"], .lucide-trash-2') }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.locator('text=/hapus|yakin|konfirmasi/i').first()).toBeVisible({ timeout: 3000 });

      // Cancel
      const cancelBtn = page.getByRole('button', { name: /batal|cancel|tidak/i });
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
      }
    }
  });

  test('articles list API loads on page visit', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/articles') && resp.status() === 200
    );
    await page.goto('/admin/articles', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });
});
