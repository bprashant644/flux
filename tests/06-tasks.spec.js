const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'Tasks');
  });

  test('tasks view renders without error', async ({ page }) => {
    await page.waitForTimeout(600);
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/undefined/i)).not.toBeVisible();
  });

  test('shows task list or empty state', async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.textContent('body');
    expect(/task|no task|open|done/i.test(body)).toBeTruthy();
  });
});
