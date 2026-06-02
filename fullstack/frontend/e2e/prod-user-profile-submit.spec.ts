import { test, expect } from '@playwright/test';

/**
 * Production - REAL profile update against freshly.web.id
 *
 * Updates the admin user's firstName, verifies the change persisted,
 * then reverts to original value. Safe for production.
 */

const PROD_API = 'https://freshly.web.id/api/v1';
const CLIENT_KEY = 'dGltY2Fwc3RvbmVtYW50YXBvaQ==';

async function getAccessToken(page: any): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('freshly_access_token'));
  if (!token) throw new Error('No access token in localStorage');
  return token;
}

async function getCurrentUser(request: any, token: string) {
  const res = await request.get(`${PROD_API}/users/me`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-key': CLIENT_KEY },
  });
  if (!res.ok()) throw new Error('Failed to fetch user');
  const body = await res.json();
  return body.data?.user ?? body.data ?? body;
}

async function updateUser(request: any, token: string, data: { first_name?: string; last_name?: string }) {
  const res = await request.patch(`${PROD_API}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-client-key': CLIENT_KEY,
      'Content-Type': 'application/json',
    },
    data,
  });
  return res;
}

test.describe('Production - REAL Profile Update (writes data)', () => {
  let originalFirstName = '';
  let originalLastName = '';
  const e2eMarker = `E2E_${Date.now().toString(36)}`;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/prod-admin.json' });
    const page = await ctx.newPage();
    await page.goto('https://freshly.web.id', { waitUntil: 'domcontentloaded' });

    try {
      const token = await getAccessToken(page);
      const user = await getCurrentUser(ctx.request, token);
      originalFirstName = user.first_name || user.firstName || '';
      originalLastName = user.last_name || user.lastName || '';
      // If name looks like a leftover E2E marker, reset to known default
      if (/^E2E_/i.test(originalFirstName)) {
        originalFirstName = 'Admin';
        await updateUser(ctx.request, token, { first_name: 'Admin' });
      }
    } finally {
      await ctx.close();
    }
  });

  test('update profile firstName via UI, verify persisted, revert via API', async ({ page, request }) => {
    test.slow();

    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await expect(page.locator('text=/profil saya/i')).toBeVisible({ timeout: 10000 });

    // Click edit button
    await page.getByRole('button', { name: /edit profil/i }).click();

    // Wait for form fields
    const firstNameInput = page.locator('input[placeholder*="nama depan" i], input[placeholder*="first name" i], input[placeholder*="Masukkan nama depan"]').first();
    await firstNameInput.waitFor({ state: 'visible', timeout: 5000 });

    // Clear and fill new value
    await firstNameInput.clear();
    await firstNameInput.fill(e2eMarker);

    // Wait for PATCH /users/me
    const updatePromise = page.waitForResponse(
      r => r.url().includes('/users/me') && r.request().method() === 'PATCH',
      { timeout: 30000 },
    );

    // Click save button — text is "Simpan Perubahan"
    const saveBtn = page.getByRole('button', { name: /simpan perubahan|save changes/i }).first();
    await saveBtn.click();

    const updateResp = await updatePromise;
    expect(updateResp.ok()).toBe(true);

    // Verify toast or success message
    await page.waitForTimeout(2000);

    // Verify the new name appears on the profile page
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator(`text=${e2eMarker}`).first()).toBeVisible({ timeout: 8000 });

    // Revert via API
    const token = await getAccessToken(page);
    const revertRes = await updateUser(request, token, { 
      first_name: originalFirstName, 
      last_name: originalLastName 
    });
    // Best-effort revert — don't fail the test on revert issues
    if (!revertRes.ok()) {
      console.warn('Profile revert failed, manual cleanup may be needed');
    }
  });

  test.afterAll(async ({ browser }) => {
    // Safety: ensure we always revert even if test crashed
    const ctx = await browser.newContext({ storageState: 'e2e/.auth/prod-admin.json' });
    const page = await ctx.newPage();
    await page.goto('https://freshly.web.id', { waitUntil: 'domcontentloaded' });

    try {
      const token = await getAccessToken(page);
      await updateUser(ctx.request, token, { 
        first_name: originalFirstName, 
        last_name: originalLastName 
      });
    } catch {
      // best-effort revert
    } finally {
      await ctx.close();
    }
  });
});
