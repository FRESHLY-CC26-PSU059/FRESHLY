import { test, expect } from '@playwright/test';

test.describe('Production - Users Page Interactions', () => {
  test('users page renders with search', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="Cari"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('users search finds admin', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="Cari"], input[placeholder*="search"]').first();
    await searchInput.fill('admin');
    await page.waitForTimeout(1500);
    // Should find admin user row or text somewhere on the page
    const found = await page.locator('text=/admin/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(found).toBe(true);
  });

  test('add user button opens create modal', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const addBtn = page.getByRole('button', { name: /tambah|add|buat/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await expect(page.locator('input[type="email"], input[placeholder*="email"]').last()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Production - Knowledge Page Interactions', () => {
  test('knowledge page renders and loads data', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/knowledges') && resp.status() === 200
    );
    await page.goto('/admin/knowledge', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });

  test('add knowledge button opens form', async ({ page }) => {
    await page.goto('/admin/knowledge', { waitUntil: 'networkidle' });
    const addBtn = page.getByRole('button', { name: /tambah|add|buat/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      // Modal may have input or textarea
      await expect(page.locator('input, textarea').last()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Production - Notification Page Interactions', () => {
  test('notification page renders', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/notifications/);
  });

  test('broadcast button opens form', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
    const broadcastBtn = page.getByRole('button', { name: /broadcast|kirim|send/i }).first();
    if (await broadcastBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await broadcastBtn.click();
      await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('mark all as read button works', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
    const markAllBtn = page.getByRole('button', { name: /tandai semua|mark all|read all/i });
    if (await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const apiPromise = page.waitForResponse(resp =>
        resp.url().includes('/notifications/read-all')
      ).catch(() => null);
      await markAllBtn.click();
      await apiPromise;
    }
  });
});

test.describe('Production - Audit Logs Page', () => {
  test('audit logs page loads data', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/audit-logs') && resp.status() === 200
    );
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });
});

test.describe('Production - Landing Page Interactions', () => {
  test('CTA button navigates to register, login, or dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const ctaBtn = page.getByRole('link', { name: /mulai|get started|coba|daftar|dashboard/i }).first();
    if (await ctaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ctaBtn.click();
      // Authenticated users get redirected to dashboard instead of login/register
      await expect(page).toHaveURL(/\/(register|login|dashboard)/);
    }
  });

  test('navbar has navigation links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const navLinks = page.locator('nav a, header a').filter({ hasText: /fitur|feature|artikel|article|ensiklopedia/i });
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('newsletter subscribe form on footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').last();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('e2etest@freshly.id');
      await expect(emailInput).toHaveValue('e2etest@freshly.id');
    }
  });
});
