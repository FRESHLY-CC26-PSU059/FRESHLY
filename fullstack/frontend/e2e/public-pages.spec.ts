import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('Landing page loads with navigation and content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.locator('nav, header').first()).toBeVisible();
  });

  test('Landing page has CTA / login link', async ({ page }) => {
    await page.goto('/');
    // Should have at least one link to login or register
    const authLink = page.locator('a[href*="login"], a[href*="register"]').first();
    await expect(authLink).toBeVisible();
  });

  test('Landing page footer has copyright', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/freshly/i').first()).toBeVisible();
  });

  test('Landing page mentions buah and sayur', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toContain('buah');
    expect(body.toLowerCase()).toContain('sayur');
  });

  test('Ensiklopedia page loads and has content', async ({ page }) => {
    await page.goto('/ensiklopedia');
    await expect(page).toHaveURL(/\/ensiklopedia/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Verify Email page loads with no token (shows error/loading state)', async ({ page }) => {
    await page.goto('/verify-email');
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Unknown route redirects to home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    await expect(page).toHaveURL('/');
  });

  test('No console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    await page.waitForTimeout(2000);
    // Filter out known benign errors
    const realErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('recaptcha') &&
      !e.includes('favicon') &&
      !e.includes('service-worker') &&
      !e.includes('ServiceWorker') &&
      !e.includes('FCM') &&
      !e.includes('messaging') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Failed to load resource')
    );
    if (realErrors.length > 0) console.log('Console errors:', realErrors);
    expect(realErrors.length).toBe(0);
  });

  test('No broken images on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
        .filter(src => !src.includes('/src/assets/')); // dev-only paths excluded
    });
    expect(brokenImages).toEqual([]);
  });
});
