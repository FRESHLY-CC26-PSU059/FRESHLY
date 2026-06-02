import { test, expect } from '@playwright/test';

/**
 * Production - REAL knowledge CRUD against freshly.web.id
 *
 * Creates knowledge entries with [E2E-DELETE-ME] marker,
 * verifies creation, and cleans up via API.
 */

const PROD_API = 'https://freshly.web.id/api/v1';
const CLIENT_KEY = 'dGltY2Fwc3RvbmVtYW50YXBvaQ==';

const e2eMarker = () => `[E2E-DELETE-ME-${Date.now()}-${Math.random().toString(36).slice(2, 7)}]`;

async function getAccessToken(page: any): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('freshly_access_token'));
  if (!token) throw new Error('No access token in localStorage');
  return token;
}

async function deleteKnowledgeById(request: any, token: string, id: string | number) {
  return request.delete(`${PROD_API}/knowledges/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
}

async function findE2EKnowledge(request: any, token: string) {
  const res = await request.get(`${PROD_API}/knowledges?page=1&limit=100`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
  if (!res.ok()) return [];
  const body = await res.json();
  const list = body.data?.knowledges ?? body.data ?? [];
  return list.filter((k: any) => /\[E2E-DELETE-ME/i.test(k.question || k.title || ''));
}

test.describe('Production - REAL Knowledge CRUD (writes data)', () => {
  test('create knowledge via UI, verify in list, delete via API', async ({ page, request }) => {
    test.slow();
    const marker = e2eMarker();
    const question = `${marker} Apa itu buah naga?`;
    const answer = 'Buah naga adalah buah tropis yang kaya antioksidan. Test E2E.';

    await page.goto('/admin/knowledge', { waitUntil: 'networkidle' });
    
    // Click add button
    const addBtn = page.getByRole('button', { name: /tambah|add|buat/i }).first();
    await addBtn.click();

    // Wait for modal/form
    await page.waitForTimeout(1000);

    // Fill title field — placeholder: "Contoh: Cara Menyimpan Apel"
    const titleField = page.locator('input[placeholder*="Contoh"], input[placeholder*="judul" i]').first();
    await titleField.waitFor({ state: 'visible', timeout: 5000 });
    await titleField.fill(question);

    // Fill content textarea
    const contentField = page.locator('textarea').first();
    if (await contentField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contentField.fill(answer);
    }

    // Wait for POST /knowledges
    const createPromise = page.waitForResponse(
      r => r.url().includes('/knowledges') && r.request().method() === 'POST',
      { timeout: 30000 },
    );

    // Submit
    const saveBtn = page.locator('button[form="knowledge-form"][type="submit"]').or(
      page.getByRole('button', { name: /^simpan$/i })
    ).first();
    await saveBtn.click();

    const createResp = await createPromise;
    expect([200, 201]).toContain(createResp.status());

    const created = await createResp.json();
    const newId = created.data?.knowledge?.id ?? created.data?.id ?? created.id;
    expect(newId).toBeTruthy();

    // Verify appears in list
    await page.waitForTimeout(1500);
    await expect(page.locator(`text=${marker}`).first()).toBeVisible({ timeout: 8000 });

    // Cleanup via API
    const token = await getAccessToken(page);
    const delRes = await deleteKnowledgeById(request, token, newId);
    expect([200, 204]).toContain(delRes.status());
  });

  test.afterAll(async ({ browser }) => {
    // Sweep any leftover [E2E-DELETE-ME] knowledge entries
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/prod-admin.json' });
    const page = await ctx.newPage();
    await page.goto('https://freshly.web.id', { waitUntil: 'domcontentloaded' });

    try {
      const token = await getAccessToken(page);
      const leftovers = await findE2EKnowledge(ctx.request, token);
      for (const k of leftovers) {
        await deleteKnowledgeById(ctx.request, token, k.id);
      }
    } catch {
      // best-effort cleanup
    } finally {
      await ctx.close();
    }
  });
});
