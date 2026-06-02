import { test, expect } from '@playwright/test';

/**
 * Production - REAL newsletter subscription against freshly.web.id
 *
 * Footer structure:
 *   <input type="email" placeholder="Alamat Email" />
 *   <button type="button" onClick={handleSubscribe}>Subscribe</button>
 *   API: POST /newsletter/subscribe { email }
 */

const PROD_API = 'https://freshly.web.id/api/v1';
const CLIENT_KEY = 'dGltY2Fwc3RvbmVtYW50YXBvaQ==';

const e2eEmail = () => `e2e_${Date.now().toString(36)}@test.freshly.id`;

async function getAccessToken(page: any): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('freshly_access_token'));
  if (!token) throw new Error('No access token in localStorage');
  return token;
}

async function findSubscriberByEmail(request: any, token: string, email: string) {
  // Try /newsletter first (admin endpoint), fallback to /subscribers
  for (const endpoint of ['/newsletter', '/subscribers?page=1&limit=100']) {
    const res = await request.get(`${PROD_API}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
    });
    if (!res.ok()) continue;
    const body = await res.json();
    const list = body.data?.subscribers ?? body.data ?? [];
    const found = list.find((s: any) => s.email === email);
    if (found) return found;
  }
  return null;
}

async function deleteSubscriber(request: any, token: string, id: string | number) {
  // Try both endpoints
  const res1 = await request.delete(`${PROD_API}/subscribers/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
  if (res1.ok()) return res1;
  return request.delete(`${PROD_API}/newsletter/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
}

test.describe('Production - REAL Newsletter Subscription (writes data)', () => {
  let createdEmail = '';

  test('subscribe via footer form, verify API response, cleanup', async ({ page, request }) => {
    test.slow();
    createdEmail = e2eEmail();

    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const emailInput = page.locator('input[placeholder="Alamat Email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 8000 });
    await emailInput.fill(createdEmail);

    const subscribePromise = page.waitForResponse(
      (r: any) => r.url().includes('/newsletter/subscribe') && r.request().method() === 'POST',
      { timeout: 30000 },
    );

    const subscribeBtn = page.getByRole('button', { name: /subscribe/i }).first();
    await subscribeBtn.click();

    const subResp = await subscribePromise;
    expect([200, 201]).toContain(subResp.status());

    await expect(
      page.locator('text=/berhasil berlangganan|subscribed|success/i').first()
    ).toBeVisible({ timeout: 8000 });

    // Cleanup — best-effort, don't fail test if cleanup has issues
    try {
      const token = await getAccessToken(page);
      const found = await findSubscriberByEmail(request, token, createdEmail);
      if (found?.id) {
        await deleteSubscriber(request, token, found.id);
      }
    } catch {
      // cleanup is best-effort
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!createdEmail) return;
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/prod-admin.json' });
    const page = await ctx.newPage();
    await page.goto('https://freshly.web.id', { waitUntil: 'domcontentloaded' });
    try {
      const token = await getAccessToken(page);
      const found = await findSubscriberByEmail(ctx.request, token, createdEmail);
      if (found?.id) await deleteSubscriber(ctx.request, token, found.id);
    } catch { /* best-effort */ } finally {
      await ctx.close();
    }
  });
});
