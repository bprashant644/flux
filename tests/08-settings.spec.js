const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'Settings');
  });

  test('settings page renders sections', async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page.getByText(/notification|email digest/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('email digest toggle is clickable', async ({ page }) => {
    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.waitForTimeout(300);
    // Toggle is a styled div acting as a switch
    const toggle = page.locator('div[style*="border-radius: 12px"]').first()
      .or(page.locator('div[style*="border-radius:12px"]').first());
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(300);
      await toggle.click(); // restore
    }
  });

  test('currency section renders with INR/USD/GBP/EUR buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Currency & Display' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/currency/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('button', { name: /₹ INR/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /\$ USD/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /£ GBP/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /€ EUR/i }).first()).toBeVisible();
  });

  test('clicking USD currency button does not crash', async ({ page }) => {
    await page.getByRole('button', { name: 'Currency & Display' }).click();
    await page.waitForTimeout(300);
    const usd = page.getByRole('button', { name: /\$ USD/i }).first();
    await expect(usd).toBeVisible({ timeout: 5000 });
    await usd.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/error/i)).not.toBeVisible();
    // Reset to INR
    await page.getByRole('button', { name: /₹ INR/i }).first().click();
  });

  test('exchange rate inputs are editable', async ({ page }) => {
    // Rate inputs appear below "Exchange rates" heading
    const rateInputs = page.locator('input[type="number"]');
    const count = await rateInputs.count();
    if (count > 0) {
      const first = rateInputs.first();
      const original = await first.inputValue();
      await first.fill('85');
      await expect(first).toHaveValue('85');
      await first.fill(original); // restore
    }
  });

  test('custom contact fields section is visible for admin', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Fields' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/add extra fields that appear on every contact/i)).toBeVisible({ timeout: 6000 });
  });

  test('add a custom field then verify it appears', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Fields' }).click();
    await page.waitForTimeout(300);
    const addBtn = page.getByRole('button', { name: /new field|add field/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);
      await page.locator('input[placeholder*="label"], input[placeholder*="Label"]').first().fill('PW Custom Field');
      await page.getByRole('button', { name: /add field/i }).first().click();
      await page.waitForTimeout(800);
      await expect(page.getByText('PW Custom Field')).toBeVisible({ timeout: 5000 });
    }
  });

  test('save notification settings button works', async ({ page }) => {
    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.waitForTimeout(300);
    const saveBtn = page.getByRole('button', { name: /save settings/i });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/error|failed/i)).not.toBeVisible();
  });
});
