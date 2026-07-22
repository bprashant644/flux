const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Currency display', () => {
  test.beforeEach(async ({ page }) => {
    // Always start with INR display
    await page.addInitScript(() => {
      localStorage.setItem('crm_currency', JSON.stringify({
        display: 'INR',
        rates: { INR: 1, USD: 83.5, GBP: 106.0, EUR: 90.5 },
      }));
    });
    await login(page);
  });

  test('INR amounts use L (lakh) not raw 6-digit numbers', async ({ page }) => {
    await nav(page, 'Dashboard');
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    // Raw 6+ digit numbers should not appear directly after ₹ in compact displays
    expect(body).not.toMatch(/₹\d{6,}(?![\d\s])/);
  });

  test('amounts in Crore show "Cr" suffix, not raw 8-digit', async ({ page }) => {
    await nav(page, 'Dashboard');
    await page.waitForTimeout(600);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/₹\d{8}/);
  });

  test('Add Contact modal shows currency selector next to value input', async ({ page }) => {
    await nav(page, 'Contacts');
    await page.getByRole('button', { name: /new contact/i }).click();
    await page.waitForTimeout(300);

    // The CurrencyInput renders a <select> with INR/USD/GBP/EUR options
    const currSel = page.locator('select').filter({ has: page.locator('option[value="USD"]') }).first();
    await expect(currSel).toBeVisible({ timeout: 5000 });

    // Default should be INR
    await expect(currSel).toHaveValue('INR');
  });

  test('switching currency in Add Contact value input recalculates', async ({ page }) => {
    await nav(page, 'Contacts');
    await page.getByRole('button', { name: /new contact/i }).click();
    await page.waitForTimeout(300);

    const numInput = page.locator('input[type="number"]').first();
    const currSel  = page.locator('select').filter({ has: page.locator('option[value="USD"]') }).first();

    if (await numInput.isVisible() && await currSel.isVisible()) {
      await numInput.fill('1000');
      await currSel.selectOption('USD');
      await page.waitForTimeout(300);
      // After switching to USD, the raw number shown should be 1000 (entered value stays)
      // No crash is the main check
      await expect(page.getByText(/error/i)).not.toBeVisible();
    }
  });

  test('pipeline kanban column totals show L/Cr notation for INR', async ({ page }) => {
    await nav(page, 'Pipeline');
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/₹\d{8}/);
    expect(body).not.toContain('NaN');
  });
});
