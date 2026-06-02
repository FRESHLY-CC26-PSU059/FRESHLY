import { test, expect } from '@playwright/test';

const getMeta = async (page: any, selector: string) =>
  page.locator(`meta[${selector}]`).first().getAttribute('content');

test.describe('SEO - meta tags & canonical', () => {
  test('Landing page has brand title and full meta set', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Freshly/i);

    const description = await getMeta(page, 'name="description"');
    expect(description).toMatch(/buah/i);
    expect(description).toMatch(/sayur/i);

    const ogTitle = await getMeta(page, 'property="og:title"');
    expect(ogTitle).toMatch(/Freshly/i);

    const ogImage = await getMeta(page, 'property="og:image"');
    expect(ogImage).toBeTruthy();

    const themeColor = await getMeta(page, 'name="theme-color"');
    expect(themeColor).toBe('#22c55e');

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toBeTruthy();
  });

  test('Indonesian ripeness terms present in landing copy', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/matang/i);
    expect(body).toMatch(/busuk/i);
  });

  test('Ensiklopedia page sets its own SEO title', async ({ page }) => {
    await page.goto('/ensiklopedia');
    await expect(page).toHaveTitle(/Ensiklopedia.*Freshly/i);
    const robots = await getMeta(page, 'name="robots"');
    expect(robots).toMatch(/index/i);
  });

  test('Login page is noindex', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Poll until react-helmet updates the meta tag (race condition w/ initial HTML)
    await expect.poll(
      () => getMeta(page, 'name="robots"'),
      { timeout: 5000 },
    ).toMatch(/noindex/i);
  });

  test('Register page is noindex', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await expect.poll(
      () => getMeta(page, 'name="robots"'),
      { timeout: 5000 },
    ).toMatch(/noindex/i);
  });

  test('robots.txt is served', async ({ page }) => {
    const resp = await page.request.get('/robots.txt');
    expect(resp.ok()).toBe(true);
    const body = await resp.text();
    expect(body).toMatch(/User-agent/);
    expect(body).toMatch(/Sitemap:/);
  });

  test('sitemap.xml is served', async ({ page }) => {
    const resp = await page.request.get('/sitemap.xml');
    expect(resp.ok()).toBe(true);
    const body = await resp.text();
    expect(body).toMatch(/<urlset/);
  });

  test('favicon.svg is served', async ({ page }) => {
    const resp = await page.request.get('/favicon.svg');
    expect(resp.ok()).toBe(true);
    expect(resp.headers()['content-type'] || '').toMatch(/svg/i);
  });

  test('og-image.svg is served', async ({ page }) => {
    const resp = await page.request.get('/og-image.svg');
    expect(resp.ok()).toBe(true);
  });

  test('Logo mark renders on landing navbar', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('svg[aria-label*="logo mark"]').first();
    await expect(logo).toBeVisible();
  });

  test('Landing footer shows unified tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/Scan Buah .* Sayur/i').first()).toBeVisible();
  });
});

test.describe('JSON-LD structured data', () => {
  test('WebApplication schema is present and well-formed', async ({ page }) => {
    await page.goto('/');
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toBeTruthy();
    const parsed = JSON.parse(ld!);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.name).toBe('Freshly');
  });
});
