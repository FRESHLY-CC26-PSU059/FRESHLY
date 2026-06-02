import { test, expect } from '@playwright/test';
import { API_BASE } from './helpers';

test.describe('API Integration Tests (via browser)', () => {
  test('Dashboard makes API call to /stats/overview', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/stats/overview') && resp.status() === 200
    );
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('Scans page loads scan data via API', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/scans') && resp.status() === 200
    );
    await page.goto('/admin/scans', { waitUntil: 'domcontentloaded' });
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('Conversations page loads via API', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/chat/conversations') && resp.status() === 200
    );
    await page.goto('/admin/conversations', { waitUntil: 'domcontentloaded' });
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('Settings page renders with user data', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    // Settings page should show profile form with inputs
    await expect(page).toHaveURL(/\/admin\/settings/);
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Public API endpoints (no auth)', () => {
  test('Stats endpoint returns scan stats', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/stats`, {
      headers: { 'x-client-key': 'my-enterprise-client-key-123' },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test('Articles endpoint returns data', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/articles?page=1&limit=5`, {
      headers: { 'x-client-key': 'my-enterprise-client-key-123' },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test('Health endpoint returns OK', async ({ page }) => {
    const response = await page.request.get('http://localhost:5000/health', {
      headers: { 'x-client-key': 'my-enterprise-client-key-123' },
    });
    expect(response.ok()).toBe(true);
  });
});
