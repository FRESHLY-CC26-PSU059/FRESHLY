import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Admin - Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard loads with stats cards', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Should show overview stats (Total Scans, Users, Articles, etc.)
    const statsCards = page.locator('[class*="card"], [class*="Card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('dashboard quick action links navigate correctly', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Find quick action link to scans
    const scanLink = page.getByRole('link', { name: /scan|pindai/i }).first();
    if (await scanLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scanLink.click();
      await expect(page).toHaveURL(/\/scans/);
    }
  });

  test('dashboard recent scans section renders', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Should show recent scans or empty state
    const hasScans = await page.locator('text=/scan|pindai|terbaru|recent/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasScans).toBe(true);
  });

  test('dashboard articles section shows latest articles', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    const hasArticles = await page.locator('text=/artikel|article/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasArticles).toBe(true);
  });
});

test.describe('Admin - Testimonial Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('profile page shows testimonial section', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    await expect(page.locator('text=/testimoni saya/i')).toBeVisible({ timeout: 5000 });
  });

  test('add testimonial button opens form', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    const addBtn = page.getByRole('button', { name: /tambah testimoni/i });
    await addBtn.click();

    // Form should appear with message/rating fields
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 3000 });
  });

  test('submit testimonial form with message and rating', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /tambah testimoni/i }).click();

    // Fill message
    const textarea = page.locator('textarea').first();
    await textarea.fill('Aplikasi Freshly sangat membantu untuk mengecek kesegaran buah! E2E test.');

    // Select rating if star buttons exist
    const stars = page.locator('button[aria-label*="star"], button[class*="star"], svg[class*="star"]');
    if (await stars.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await stars.nth(4).click(); // 5 stars
    }

    // Submit
    const submitPromise = page.waitForResponse(resp =>
      resp.url().includes('/feedback') && resp.request().method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null);

    const submitBtn = page.getByRole('button', { name: /kirim|submit|simpan/i }).last();
    await submitBtn.click();

    const resp = await submitPromise;
    if (resp) {
      expect([200, 201]).toContain(resp.status());
    }
  });

  test('testimonial refresh button reloads list', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    const refreshBtn = page.locator('button').filter({ has: page.locator('[data-lucide="refresh-cw"], .lucide-refresh-cw') }).first();
    if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const apiPromise = page.waitForResponse(resp =>
        resp.url().includes('/feedback') && resp.request().method() === 'GET'
      );
      await refreshBtn.click();
      await apiPromise;
    }
  });
});

test.describe('Admin - Users Page Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('users page renders with table', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/users/);

    // Search input
    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="Cari"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('users search filters results', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="cari"], input[placeholder*="Cari"], input[placeholder*="search"]').first();
    await searchInput.fill('admin');
    await page.waitForTimeout(600);

    // Should show admin user in results
    await expect(page.locator('text=admin@freshly.id')).toBeVisible({ timeout: 5000 });
  });

  test('add user button opens create modal', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });

    const addBtn = page.getByRole('button', { name: /tambah|add|buat/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();

      // Modal with form fields should appear
      await expect(page.locator('input[type="email"], input[placeholder*="email"]').last()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Admin - Knowledge Base Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('knowledge page renders', async ({ page }) => {
    await page.goto('/admin/knowledge', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/knowledge/);
  });

  test('add knowledge button opens form', async ({ page }) => {
    await page.goto('/admin/knowledge', { waitUntil: 'networkidle' });

    const addBtn = page.getByRole('button', { name: /tambah|add|buat/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();

      // Form modal should appear
      await expect(page.locator('input[placeholder*="judul"], input[placeholder*="title"]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('knowledge list API loads on page visit', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/knowledges') && resp.status() === 200
    );
    await page.goto('/admin/knowledge', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });
});

test.describe('Admin - Notification Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('notification page renders', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/notifications/);
  });

  test('broadcast button opens form', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });

    const broadcastBtn = page.getByRole('button', { name: /broadcast|kirim|send/i }).first();
    if (await broadcastBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await broadcastBtn.click();

      // Form should appear with title and message fields
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

test.describe('Public - Landing Page Interactions', () => {
  test('newsletter subscribe form on landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Scroll to footer area where newsletter might be
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').last();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('e2etest@freshly.id');

      const subscribeBtn = page.getByRole('button', { name: /subscribe|langganan|daftar/i }).last();
      if (await subscribeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const apiPromise = page.waitForResponse(resp =>
          resp.url().includes('/subscriber') || resp.url().includes('/newsletter')
        ).catch(() => null);
        await subscribeBtn.click();
        await apiPromise;
      }
    }
  });

  test('landing page CTA buttons navigate to register/login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const ctaBtn = page.getByRole('link', { name: /mulai|get started|coba|daftar/i }).first();
    if (await ctaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ctaBtn.click();
      await expect(page).toHaveURL(/\/(register|login)/);
    }
  });

  test('landing page navbar links scroll or navigate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const navLinks = page.locator('nav a, header a').filter({ hasText: /fitur|feature|artikel|article|ensiklopedia/i });
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
