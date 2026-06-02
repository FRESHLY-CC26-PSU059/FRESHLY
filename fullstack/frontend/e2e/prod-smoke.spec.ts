import { test, expect } from '@playwright/test';

const BASE = 'https://freshly.web.id';

const getMeta = (page: any, attr: string, val: string) =>
  page.locator(`meta[${attr}="${val}"]`).first().getAttribute('content');

test.describe('Production smoke - freshly.web.id', () => {
  test('Landing page loads and shows Freshly branding', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Freshly/i);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Favicon.svg returns 200', async ({ page }) => {
    const res = await page.request.get(`${BASE}/favicon.svg`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/svg|image/i);
  });

  test('og-image.svg returns 200', async ({ page }) => {
    const res = await page.request.get(`${BASE}/og-image.svg`);
    expect(res.status()).toBe(200);
  });

  test('robots.txt is served and references freshly.web.id', async ({ page }) => {
    const res = await page.request.get(`${BASE}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/freshly\.web\.id/);
  });

  test('sitemap.xml is served with correct domain', async ({ page }) => {
    const res = await page.request.get(`${BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/freshly\.web\.id/);
    expect(body).toMatch(/<urlset/);
  });

  test('SEO meta tags present on landing', async ({ page }) => {
    await page.goto(BASE);
    const desc = await getMeta(page, 'name', 'description');
    expect(desc).toBeTruthy();
    expect(desc).toMatch(/buah|sayur/i);

    const ogTitle = await getMeta(page, 'property', 'og:title');
    expect(ogTitle).toMatch(/Freshly/i);

    const ogImage = await getMeta(page, 'property', 'og:image');
    expect(ogImage).toMatch(/freshly\.web\.id/);

    const canonical = page.locator('link[rel="canonical"]').first();
    const href = await canonical.getAttribute('href');
    expect(href).toMatch(/freshly\.web\.id/);
  });

  test('No em-dash in visible page title', async ({ page }) => {
    await page.goto(BASE);
    const title = await page.title();
    expect(title).not.toContain('—');
  });

  test('Indonesian ripeness terms visible on landing', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Wait for React to hydrate and render
    await page.waitForSelector('h1', { timeout: 10000 });
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/matang/i);
    expect(body).toMatch(/busuk/i);
  });

  test('Hero CTA links exist and correct href', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    // Links may be hidden in mobile hamburger menu — check existence in DOM only
    await expect.poll(
      () => page.locator('a[href="/register"]').count(),
      { timeout: 5000 },
    ).toBeGreaterThan(0);
    const loginCount = await page.locator('a[href="/login"]').count();
    expect(loginCount).toBeGreaterThan(0);
  });

  test('Ensiklopedia page loads on production', async ({ page }) => {
    await page.goto(`${BASE}/ensiklopedia`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Ensiklopedia.*Freshly|Freshly.*Ensiklopedia/i);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('Login page renders and is noindex', async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const robots = await getMeta(page, 'name', 'robots');
    expect(robots).toMatch(/noindex/i);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Register page renders', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('404 page does not show blank white screen', async ({ page }) => {
    await page.goto(`${BASE}/page-that-does-not-exist-xyz`, { waitUntil: 'domcontentloaded' });
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('Mobile - hero visible on 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    // Hero CTA - target by visible text, not href (navbar register link is hidden on mobile)
    const heroRegisterLink = page.getByRole('link', { name: /mulai scan gratis/i });
    await expect(heroRegisterLink).toBeVisible();
  });

  test('JSON-LD structured data is valid', async ({ page }) => {
    await page.goto(BASE);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toBeTruthy();
    const parsed = JSON.parse(ld!);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.name).toBe('Freshly');
    expect(parsed.url).toMatch(/freshly\.web\.id/);
  });
});
