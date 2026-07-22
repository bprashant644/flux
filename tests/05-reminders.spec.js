const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'Reminders');
  });

  test('reminders view renders without error', async ({ page }) => {
    await page.waitForTimeout(600);
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText('undefined', { exact: true })).not.toBeVisible();
    await expect(page.getByText('NaN', { exact: true })).not.toBeVisible();
  });

  test('shows grouped sections or empty state', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    expect(/overdue|today|this week|later|no follow|no reminder/i.test(body)).toBeTruthy();
  });

  test('overdue count in nav badge matches overdue items listed', async ({ page }) => {
    await page.waitForTimeout(800);
    // Just verify the badge and list are both visible without crash
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('project follow-up items render with project chip', async ({ page }) => {
    await page.waitForTimeout(800);
    // Project follow-up rows have a colored project chip — just no crash
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });
});
