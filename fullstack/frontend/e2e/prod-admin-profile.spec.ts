import { test, expect } from '@playwright/test';

test.describe('Production - Profile Page Interactions', () => {
  test('profile page renders user info', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Profil Saya')).toBeVisible({ timeout: 10000 });
  });

  test('edit profile button enables form mode', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    const editBtn = page.getByRole('button', { name: /edit profil/i });
    await editBtn.click();

    await expect(page.locator('input[placeholder="Masukkan nama depan"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Masukkan nama belakang"]')).toBeVisible();
  });

  test('edit profile fills fields and cancel reverts', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /edit profil/i }).click();

    const firstNameInput = page.locator('input[placeholder="Masukkan nama depan"]');
    await firstNameInput.clear();
    await firstNameInput.fill('TestEdit');

    // Cancel should revert
    await page.getByRole('button', { name: /^batal$/i }).click();
    await expect(page.locator('input[placeholder="Masukkan nama depan"]')).not.toBeVisible();
  });

  test('gender dropdown has correct options', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /edit profil/i }).click();

    const genderSelect = page.locator('select').first();
    await expect(genderSelect).toBeVisible();

    const options = await genderSelect.locator('option').allTextContents();
    expect(options.some(t => /laki/i.test(t))).toBe(true);
    expect(options.some(t => /perempuan/i.test(t))).toBe(true);
  });

  test('testimonial section is visible', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });
    await expect(page.locator('text=/testimoni saya/i')).toBeVisible({ timeout: 10000 });
  });

  test('add testimonial button opens form', async ({ page }) => {
    await page.goto('/admin/profile', { waitUntil: 'networkidle' });

    const addBtn = page.getByRole('button', { name: /tambah testimoni/i });
    await addBtn.click();

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Production - Settings Page Interactions', () => {
  test('settings page renders all sections', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    await expect(page.locator('text=/appearance|tampilan/i').first()).toBeVisible();
    await expect(page.locator('text=/language|bahasa/i').first()).toBeVisible();
    await expect(page.locator('text=/security|keamanan/i').first()).toBeVisible();
  });

  test('theme toggle switches mode', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    if (initialTheme === 'dark') {
      await page.locator('button').filter({ hasText: /light|terang/i }).click();
    } else {
      await page.locator('button').filter({ hasText: /dark|gelap/i }).click();
    }

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

  test('language switcher works', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    await page.locator('button').filter({ hasText: 'English' }).click();
    await expect(page.locator('text=/Settings|Appearance/i').first()).toBeVisible({ timeout: 3000 });

    await page.locator('button').filter({ hasText: 'Indonesia' }).click();
    await expect(page.locator('text=/Pengaturan|Tampilan/i').first()).toBeVisible({ timeout: 3000 });
  });

  test('change password modal opens with fields', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /ubah password|change password|ganti password/i }).click();

    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible({ timeout: 3000 });
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Close
    const cancelBtn = page.getByRole('button', { name: /batal|cancel/i });
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });

  test('change password validates mismatch', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /ubah password|change password|ganti password/i }).click();
    await page.waitForTimeout(1000);

    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible({ timeout: 5000 });

    await passwordInputs.nth(0).fill('OldPassword123');
    await passwordInputs.nth(1).fill('NewPassword123!');
    await passwordInputs.nth(2).fill('DifferentPassword!');

    // Submit — find any submit-like button inside the visible modal
    const saveBtn = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /simpan|save/i }).last()
    );
    await saveBtn.first().click();

    // Toast or inline error for mismatch
    await expect(
      page.locator('[data-sonner-toast]').or(
        page.locator('text=/tidak cocok|mismatch|tidak sama|don.*match/i')
      )
    ).toBeVisible({ timeout: 8000 });
  });

  test('delete account dialog opens', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });

    // Button text: "Hapus Akun Saya" or "Delete My Account"
    await page.getByRole('button', { name: /hapus akun|delete.*account/i }).click();
    await page.waitForTimeout(1500);

    // Locate the password input inside the visible delete account dialog
    const deleteDialog = page.locator('[role="dialog"]').filter({ hasText: /hapus|delete/i });
    const pwInput = deleteDialog.locator('input[type="password"]');
    await expect(pwInput).toBeVisible({ timeout: 8000 });

    const cancelBtn = page.getByRole('button', { name: /batal|cancel/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });
});
