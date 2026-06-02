import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Admin - Profile Edit Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('profile page renders user info', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Profil Saya')).toBeVisible();
    // Should show user name and email somewhere
    await expect(page.locator('text=admin@freshly.id')).toBeVisible({ timeout: 5000 });
  });

  test('edit profile button enables form mode', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    const editBtn = page.getByRole('button', { name: /edit profil/i });
    await editBtn.click();

    // Form fields should now be visible
    await expect(page.locator('input[placeholder="Masukkan nama depan"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Masukkan nama belakang"]')).toBeVisible();
  });

  test('edit profile form fills and submits', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /edit profil/i }).click();

    const firstNameInput = page.locator('input[placeholder="Masukkan nama depan"]');
    const lastNameInput = page.locator('input[placeholder="Masukkan nama belakang"]');
    const phoneInput = page.locator('input[placeholder="0812..."]');

    // Save original values
    const origFirstName = await firstNameInput.inputValue();
    const origLastName = await lastNameInput.inputValue();

    // Update values
    await firstNameInput.clear();
    await firstNameInput.fill('AdminE2E');
    await phoneInput.clear();
    await phoneInput.fill('081234567890');

    // Intercept PATCH request
    const updatePromise = page.waitForResponse(resp =>
      resp.url().includes('/users/me') && resp.request().method() === 'PATCH'
    );

    await page.getByRole('button', { name: /simpan perubahan/i }).click();

    const resp = await updatePromise;
    expect(resp.status()).toBe(200);

    // Toast should appear
    await expect(page.locator('text=/profil berhasil/i')).toBeVisible({ timeout: 5000 });

    // Revert: edit again and restore original name
    await page.getByRole('button', { name: /edit profil/i }).click();
    await firstNameInput.clear();
    await firstNameInput.fill(origFirstName || 'Admin');
    await lastNameInput.clear();
    await lastNameInput.fill(origLastName || 'Freshly');

    const revertPromise = page.waitForResponse(resp =>
      resp.url().includes('/users/me') && resp.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: /simpan perubahan/i }).click();
    await revertPromise;
  });

  test('cancel button exits edit mode without saving', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /edit profil/i }).click();
    await expect(page.locator('input[placeholder="Masukkan nama depan"]')).toBeVisible();

    await page.getByRole('button', { name: /^batal$/i }).click();

    // Form inputs should be gone, back to view mode
    await expect(page.locator('input[placeholder="Masukkan nama depan"]')).not.toBeVisible();
  });

  test('gender dropdown shows options', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /edit profil/i }).click();

    const genderSelect = page.locator('select').first();
    await expect(genderSelect).toBeVisible();

    const options = await genderSelect.locator('option').allTextContents();
    expect(options.some(t => /laki/i.test(t))).toBe(true);
    expect(options.some(t => /perempuan/i.test(t))).toBe(true);
  });
});

test.describe('Admin - Settings Page Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
  });

  test('settings page renders all sections', async ({ page }) => {
    // Appearance section
    await expect(page.locator('text=/appearance|tampilan/i').first()).toBeVisible();
    // Language section
    await expect(page.locator('text=/language|bahasa/i').first()).toBeVisible();
    // Security section
    await expect(page.locator('text=/security|keamanan/i').first()).toBeVisible();
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    // Get current theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Click the opposite theme button
    if (initialTheme === 'dark') {
      await page.locator('button').filter({ hasText: /light|terang/i }).click();
    } else {
      await page.locator('button').filter({ hasText: /dark|gelap/i }).click();
    }

    // Theme attribute should change
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).not.toBe(initialTheme);

    // Revert
    if (initialTheme === 'dark') {
      await page.locator('button').filter({ hasText: /dark|gelap/i }).click();
    } else {
      await page.locator('button').filter({ hasText: /light|terang/i }).click();
    }
  });

  test('language switcher changes to English and back', async ({ page }) => {
    // Click English button
    await page.locator('button').filter({ hasText: 'English' }).click();

    // Some text should change to English
    await expect(page.locator('text=/Settings|Appearance/i').first()).toBeVisible({ timeout: 3000 });

    // Switch back to Indonesian
    await page.locator('button').filter({ hasText: 'Indonesia' }).click();
    await expect(page.locator('text=/Pengaturan|Tampilan/i').first()).toBeVisible({ timeout: 3000 });
  });

  test('change password modal opens and has fields', async ({ page }) => {
    const changePwdBtn = page.getByRole('button', { name: /ubah password|change password|ganti password/i });
    await changePwdBtn.click();

    // Modal with 3 password fields should appear
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible({ timeout: 3000 });

    const count = await passwordInputs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Close modal
    const cancelBtn = page.getByRole('button', { name: /batal|cancel/i });
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });

  test('change password validates mismatch', async ({ page }) => {
    await page.getByRole('button', { name: /ubah password|change password|ganti password/i }).click();

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('OldPassword123');
    await passwordInputs.nth(1).fill('NewPassword123!');
    await passwordInputs.nth(2).fill('DifferentPassword!');

    // Submit
    const saveBtn = page.getByRole('button', { name: /simpan|save/i }).last();
    await saveBtn.click();

    // Should show mismatch error toast
    await expect(page.locator('text=/tidak cocok|mismatch|tidak sama/i')).toBeVisible({ timeout: 5000 });
  });

  test('newsletter toggle is clickable', async ({ page }) => {
    // Wait for newsletter status to load
    await page.waitForTimeout(1000);

    // Find the newsletter toggle (round button near "Newsletter" text)
    const newsletterSection = page.locator('text=Newsletter').locator('..');
    const toggle = newsletterSection.locator('button').or(
      page.locator('button[class*="rounded-full"]')
    );

    if (await toggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Just verify it's clickable without changing state
      await expect(toggle.first()).toBeEnabled();
    }
  });

  test('delete account dialog opens with password confirmation', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /hapus akun|delete account/i });
    await deleteBtn.click();

    // Confirm dialog should appear with password input
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 3000 });

    // Close without confirming
    const cancelBtn = page.getByRole('button', { name: /batal|cancel/i });
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });
});
