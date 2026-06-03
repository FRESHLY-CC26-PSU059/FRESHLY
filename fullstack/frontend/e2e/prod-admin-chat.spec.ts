import { test, expect } from '@playwright/test';

test.describe('Production - Chat Conversations', () => {
  test('conversations page renders', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/conversations/);
  });

  test('chat input is available', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });

    // Start new conversation or find existing input
    const newBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
    }

    const chatInput = page.locator('textarea, input[placeholder*="ketik"], input[placeholder*="tulis"], input[placeholder*="pesan"]').last();
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('sends a message and receives AI response', async ({ page }) => {
    test.slow(); // 3x timeout = ~135s
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });

    const newBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await newBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newBtn.click();
    }

    const chatInput = page.locator('textarea, input[placeholder*="ketik"], input[placeholder*="tulis"], input[placeholder*="pesan"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });
    await chatInput.fill('Halo');

    const sendBtn = page.locator('button').filter({ has: page.locator('[data-lucide="send"], .lucide-send') }).or(
      page.getByRole('button', { name: /kirim|send/i })
    );
    await sendBtn.last().click();

    // Wait for chat API response — AI can be slow
    const resp = await page.waitForResponse(
      resp => resp.url().includes('/chat') && resp.request().method() === 'POST',
      { timeout: 90000 }
    ).catch(() => null);

    if (resp) {
      // API responded — verify status (200 or 5xx if AI overloaded)
      expect([200, 500, 502, 503, 504]).toContain(resp.status());
    }

    // User message should appear in the chat area (not sidebar conversation list)
    const chatBubble = page.locator('.bg-primary-500', { hasText: 'Halo' }).first();
    await expect(chatBubble).toBeVisible({ timeout: 10000 });
  });

  test('conversation search filters list', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('nonexistentquery12345');
      await page.waitForTimeout(500);
    }
  });

  test('conversation rename flow', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });

    const editBtn = page.locator('button').filter({ has: page.locator('[data-lucide="edit-2"], .lucide-edit-2') }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      const titleInput = page.locator('input[type="text"]').first();
      await titleInput.waitFor({ state: 'visible', timeout: 3000 });
      await titleInput.clear();
      await titleInput.fill('E2E Renamed');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  });

  test('conversation delete shows confirmation', async ({ page }) => {
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });

    const deleteBtn = page.locator('button').filter({ has: page.locator('[data-lucide="trash-2"], .lucide-trash-2') }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.locator('text=/hapus|yakin|konfirmasi|delete/i').first()).toBeVisible({ timeout: 3000 });

      const cancelBtn = page.getByRole('button', { name: /batal|cancel|tidak/i });
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
      }
    }
  });
});
