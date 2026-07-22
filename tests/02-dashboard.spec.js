const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'Dashboard');
  });

  test('renders without error', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
  });

  test('shows KPI/stat cards', async ({ page }) => {
    // Dashboard shows "Pipeline" or "Team pipeline" heading + numeric cards
    await expect(page.getByText(/pipeline|open|contacts/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('pipeline-by-stage bar chart renders stage labels', async ({ page }) => {
    await expect(page.getByText(/prospect/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('money values use correct Indian notation (no raw 8-digit numbers)', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    // Check there are no 8+ digit raw numbers directly after ₹ (they should be in L/Cr/k format)
    expect(body).not.toMatch(/₹\d{8}/);
  });

  test('no undefined/NaN visible anywhere', async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.textContent('body');
    expect(body).not.toContain('undefined');
    expect(body).not.toContain('NaN');
  });
});
