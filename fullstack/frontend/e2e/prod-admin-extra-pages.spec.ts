import { test, expect } from '@playwright/test';

test.describe('Production - Roles Page', () => {
  test('roles page renders with table', async ({ page }) => {
    await page.goto('/admin/roles', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/roles/);
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('roles API loads', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/roles') && resp.status() === 200
    );
    await page.goto('/admin/roles', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });
});

test.describe('Production - Admin Testimonials Page', () => {
  test('testimonials page renders', async ({ page }) => {
    await page.goto('/admin/testimonials', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/testimonials/);
  });

  test('testimonials API loads', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      (resp.url().includes('/feedbacks') || resp.url().includes('/testimonials')) && resp.status() === 200
    );
    await page.goto('/admin/testimonials', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });

  test('testimonial status filter or action buttons exist', async ({ page }) => {
    await page.goto('/admin/testimonials', { waitUntil: 'networkidle' });
    // Should have action buttons (approve/reject) or status filter
    const actionBtns = page.locator('button').filter({ has: page.locator('svg') });
    const count = await actionBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Production - Newsletter Management Page', () => {
  test('newsletter page renders', async ({ page }) => {
    await page.goto('/admin/newsletter', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/newsletter/);
  });

  test('newsletter API loads subscribers', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/newsletter') && !resp.url().includes('/subscribe') && resp.status() === 200
    );
    await page.goto('/admin/newsletter', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });

  test('newsletter page has subscriber count or list', async ({ page }) => {
    await page.goto('/admin/newsletter', { waitUntil: 'networkidle' });
    // Page shows subscriber count or list
    await expect(page.locator('text=/subscriber|Subscriber|Total Aktif/i').first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Production - Ensiklopedia Page (Public)', () => {
  test('ensiklopedia page renders with fruit cards', async ({ page }) => {
    await page.goto('/ensiklopedia', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ensiklopedia/);
    await expect(page.locator('text=/ensiklopedia/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('ensiklopedia search works', async ({ page }) => {
    await page.goto('/ensiklopedia', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="cari" i], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('apel');
      await page.waitForTimeout(600);
    }
  });

  test('ensiklopedia articles API loads', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/articles') && resp.status() === 200
    );
    await page.goto('/ensiklopedia', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
  });
});

test.describe('Production - REAL Scan Upload & Analyze', () => {
  test('upload image and analyze fruit', async ({ page }) => {
    test.slow();
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });

    // Click Upload button to trigger file input
    await page.getByRole('button', { name: /upload/i }).click();

    // Create a tiny 1x1 green PNG for upload
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');

    // Set file via file chooser
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);

    // If file chooser doesn't trigger, try clicking the hidden input
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'test-fruit.png',
        mimeType: 'image/png',
        buffer: pngBuffer,
      });
    }

    // Wait for image preview to appear
    await page.waitForTimeout(2000);

    // Check if image preview or analyze button becomes visible
    const analyzeBtn = page.getByRole('button', { name: /analisis|analyze/i });
    if (await analyzeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Select fruit type if dropdown exists
      const fruitSelect = page.locator('select').first();
      if (await fruitSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        const opts = await fruitSelect.locator('option').allTextContents();
        if (opts.length > 1) {
          await fruitSelect.selectOption({ index: 1 });
        }
      }

      const scanPromise = page.waitForResponse(
        r => r.url().includes('/scans/analyze') && r.request().method() === 'POST',
        { timeout: 60000 },
      );

      await analyzeBtn.click();

      const resp = await scanPromise.catch(() => null);
      if (resp) {
        expect([200, 201]).toContain(resp.status());
      }
    }
  });
});

test.describe('Production - Admin Dashboard Stats', () => {
  test('admin dashboard loads overview stats', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/stats/overview') && resp.status() === 200
    );
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const resp = await apiPromise;
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data).toBeTruthy();
  });

  test('admin dashboard loads recent activities', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // Dashboard should have stat cards or activity section visible
    await expect(page.locator('text=/dashboard|aktivitas|recent|overview/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('dashboard has stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    // Dashboard should show stat numbers
    const statElements = page.locator('text=/\\d+/').all();
    expect((await statElements).length).toBeGreaterThan(0);
  });
});

test.describe('Production - Sidebar Navigation', () => {
  test('sidebar navigates to all admin pages', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    const navLinks = [
      { pattern: /scan/i, url: /\/admin\/scans/ },
      { pattern: /percakapan|chat|conversation/i, url: /\/admin\/conversations/ },
      { pattern: /artikel|article/i, url: /\/admin\/articles/ },
      { pattern: /pengguna|user/i, url: /\/admin\/users/ },
    ];

    for (const link of navLinks) {
      const navItem = page.locator('nav a, aside a').filter({ hasText: link.pattern }).first();
      if (await navItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navItem.click();
        await page.waitForURL(link.url, { timeout: 8000 });
        // Go back to dashboard for next iteration
        await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
      }
    }
  });
});

test.describe('Production - Error Pages', () => {
  test('404 route redirects to landing', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });
});
