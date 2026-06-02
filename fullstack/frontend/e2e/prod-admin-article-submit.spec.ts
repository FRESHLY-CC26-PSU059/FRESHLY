import { test, expect } from '@playwright/test';

/**
 * Production - REAL article CRUD against freshly.web.id
 *
 * This test writes data to production. Each test creates a unique
 * article tagged with [E2E-DELETE-ME] in the title and cleans up
 * via API afterward. Even if the test fails, the afterAll hook
 * sweeps any leftover [E2E-DELETE-ME] articles.
 */

const PROD_API = 'https://freshly.web.id/api/v1';
const CLIENT_KEY = 'dGltY2Fwc3RvbmVtYW50YXBvaQ==';

const e2eMarker = () => `[E2E-DELETE-ME-${Date.now()}-${Math.random().toString(36).slice(2, 7)}]`;

async function getAccessToken(page: any): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('freshly_access_token'));
  if (!token) throw new Error('No access token in localStorage');
  return token;
}

async function deleteArticleById(request: any, token: string, id: string | number) {
  return request.delete(`${PROD_API}/articles/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
}

async function findE2EArticles(request: any, token: string) {
  const res = await request.get(`${PROD_API}/articles?page=1&limit=100`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
  if (!res.ok()) return [];
  const body = await res.json();
  const list = body.data?.articles ?? body.data ?? [];
  return list.filter((a: any) => /\[E2E-DELETE-ME/i.test(a.title || ''));
}

test.describe('Production - REAL Article CRUD (writes data)', () => {
  test('create article via UI, verify in list, delete via API', async ({ page, request }) => {
    test.slow();
    const marker = e2eMarker();
    const articleTitle = `${marker} Test Artikel`;

    await page.goto('/admin/articles', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /tambah artikel/i }).click();
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).toBeVisible();

    // Fill title
    const titleInput = page.locator('input[placeholder*="judul" i]').first();
    await titleInput.fill(articleTitle);

    // Pick first available category
    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      const opts = await categorySelect.locator('option').elementHandles();
      // Pick second option (first is usually placeholder)
      if (opts.length > 1) {
        const val = await opts[1].getAttribute('value');
        if (val) await categorySelect.selectOption(val);
      }
    }

    // Tiptap content
    const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 5000 });
    await editor.click();
    await page.keyboard.type('Konten artikel test E2E. Akan dihapus otomatis.');

    // Wait for POST /articles
    const createPromise = page.waitForResponse(
      r => r.url().includes('/articles') && r.request().method() === 'POST',
      { timeout: 30000 },
    );

    // Submit — primary save button (NOT "Batal")
    const saveBtn = page.locator('button[form="article-form"][type="submit"]').or(
      page.getByRole('button', { name: /publikasikan|simpan perubahan/i })
    ).first();
    await saveBtn.click();

    const createResp = await createPromise;
    expect([200, 201]).toContain(createResp.status());

    const created = await createResp.json();
    const newId = created.data?.article?.id ?? created.data?.id ?? created.id;
    expect(newId).toBeTruthy();

    // Modal closes after successful save
    await expect(page.getByRole('heading', { name: /tambah artikel/i })).not.toBeVisible({ timeout: 10000 });

    // Verify article appears in list (search by marker)
    const search = page.locator('input[placeholder*="artikel" i], input[placeholder*="cari" i]').first();
    await search.fill(marker);
    await page.waitForTimeout(800);
    await expect(page.locator(`text=${marker}`).first()).toBeVisible({ timeout: 8000 });

    // Cleanup via API
    const token = await getAccessToken(page);
    const delRes = await deleteArticleById(request, token, newId);
    expect([200, 204]).toContain(delRes.status());
  });

  test.afterAll(async ({ browser }) => {
    // Sweep any leftover [E2E-DELETE-ME] articles
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/prod-admin.json' });
    const page = await ctx.newPage();
    await page.goto('https://freshly.web.id', { waitUntil: 'domcontentloaded' });

    try {
      const token = await getAccessToken(page);
      const leftovers = await findE2EArticles(ctx.request, token);
      for (const a of leftovers) {
        await deleteArticleById(ctx.request, token, a.id);
      }
    } catch {
      // best-effort cleanup
    } finally {
      await ctx.close();
    }
  });
});
