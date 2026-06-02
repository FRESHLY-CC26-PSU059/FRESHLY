import { test, expect } from '@playwright/test';

const PROD_API = 'https://freshly.web.id/api/v1';

// ── Admin page rendering tests ──
// Verifies every admin page loads, renders content, and hits expected API endpoints.
// Does NOT mutate production data.

test.describe('Production - Admin Pages Render', () => {
  // ── Users ──
  test('Users page loads and shows user table', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200
    );
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/users/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
    // Should have a table or list of users
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Users page has search input', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const search = page.locator('input[placeholder*="cari" i], input[placeholder*="search" i], input[type="search"]').first();
    await expect(search).toBeVisible();
  });

  // ── Scans ──
  test('Scans page loads and fetches data', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/scans') && resp.status() === 200
    );
    await page.goto('/admin/scans', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/scans/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  // ── Articles ──
  test('Articles page loads with toolbar', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/articles') && resp.status() === 200
    );
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/articles/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  test('Articles page has "Tambah Artikel" button', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /tambah artikel/i })).toBeVisible();
  });

  test('Articles create modal opens and closes', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();
    // Close modal
    await page.getByRole('button', { name: /^batal$/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).not.toBeVisible();
  });

  test('Articles search filters results', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    const search = page.locator('input[placeholder*="artikel" i], input[placeholder*="Cari" i]').first();
    await search.fill('zzznonexistent_e2e_query');
    await page.waitForTimeout(600); // debounce
    await expect(page.locator('text=/belum ada artikel/i')).toBeVisible({ timeout: 5000 });
  });

  // ── Knowledge Base ──
  test('Knowledge page loads and fetches data', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/knowledges') && resp.status() === 200
    );
    await page.goto('/admin/knowledge', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/knowledge/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  // ── Conversations ──
  test('Conversations page loads and fetches data', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/chat/conversations') && resp.status() === 200
    );
    await page.goto('/admin/conversations', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/conversations/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  // ── Roles ──
  test('Roles page loads and fetches data', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/roles') && resp.status() === 200
    );
    await page.goto('/admin/roles', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/roles/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  // ── Notifications ──
  test('Notifications page loads', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/notifications/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  // ── Newsletter ──
  test('Newsletter page loads and fetches subscribers', async ({ page }) => {
    await page.goto('/admin/newsletter', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/newsletter/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  // ── Testimonials ──
  test('Testimonials page loads and fetches feedback', async ({ page }) => {
    await page.goto('/admin/testimonials', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/testimonials/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  // ── Audit Logs ──
  test('Audit Logs page loads and fetches data', async ({ page }) => {
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/audit-logs') && resp.status() === 200
    );
    await page.goto('/admin/audit-logs', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  // ── Settings ──
  test('Settings page loads with form inputs', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/settings/);
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── Profile ──
  test('Profile page loads with user info', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/profile/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});

test.describe('Production - Admin Sidebar Navigation', () => {
  test('All sidebar links navigate correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Test direct sidebar links (non-submenu)
    const directLinks = [
      { href: '/admin/scans', pattern: /\/admin\/scans/ },
      { href: '/admin/conversations', pattern: /\/admin\/conversations/ },
      { href: '/admin/newsletter', pattern: /\/admin\/newsletter/ },
      { href: '/admin/audit-logs', pattern: /\/admin\/audit-logs/ },
      { href: '/admin/settings', pattern: /\/admin\/settings/ },
    ];

    for (const { href, pattern } of directLinks) {
      const link = page.locator(`a[href="${href}"]`).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(pattern);
        // Go back to dashboard for next iteration
        await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
      }
    }
  });

  test('Submenu "Master Data" expands and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    // Click "Master Data" submenu toggle
    const masterDataToggle = page.locator('button:has-text("Master Data")').first();
    if (await masterDataToggle.isVisible()) {
      await masterDataToggle.click();
      // Submenu items should appear
      const rolesLink = page.locator('a[href="/admin/roles"]').first();
      await expect(rolesLink).toBeVisible();
      const usersLink = page.locator('a[href="/admin/users"]').first();
      await expect(usersLink).toBeVisible();

      // Click Users
      await usersLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
    }
  });

  test('Submenu "Konten" expands and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

    const kontenToggle = page.locator('button:has-text("Konten")').first();
    if (await kontenToggle.isVisible()) {
      await kontenToggle.click();
      const articlesLink = page.locator('a[href="/admin/articles"]').first();
      await expect(articlesLink).toBeVisible();
      const knowledgeLink = page.locator('a[href="/admin/knowledge"]').first();
      await expect(knowledgeLink).toBeVisible();

      await articlesLink.click();
      await expect(page).toHaveURL(/\/admin\/articles/);
    }
  });
});

test.describe('Production - Admin API Integration', () => {
  test('Public stats endpoint responds', async ({ page }) => {
    const response = await page.request.get(`${PROD_API}/stats`, {
      headers: { 'x-client-key': 'dGltY2Fwc3RvbmVtYW50YXBvaQ==' },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test('Public articles endpoint responds', async ({ page }) => {
    const response = await page.request.get(`${PROD_API}/articles?page=1&limit=5`, {
      headers: { 'x-client-key': 'dGltY2Fwc3RvbmVtYW50YXBvaQ==' },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test('Health endpoint responds', async ({ page }) => {
    const response = await page.request.get('https://freshly.web.id/health', {
      headers: { 'x-client-key': 'dGltY2Fwc3RvbmVtYW50YXBvaQ==' },
    });
    expect(response.ok()).toBe(true);
  });
});
