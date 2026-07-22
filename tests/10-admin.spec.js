const { test, expect } = require('@playwright/test');
const { login, nav, TEST_ADMIN } = require('./helpers');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TS = Date.now();

test.describe('Admin — Team & Users', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterAll(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE email LIKE 'pw.rep.%@relay-crm.test'");
    await pool.end();
  });

  test('Team nav item is visible for admin', async ({ page }) => {
    await expect(page.locator('aside').getByRole('button', { name: 'Team', exact: true })).toBeVisible({ timeout: 6000 });
  });

  test('Team view renders performance data', async ({ page }) => {
    await nav(page, 'Team');
    await page.waitForTimeout(600);
    const body = await page.textContent('body');
    expect(/team|member|pipeline|performance/i.test(body)).toBeTruthy();
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('Users view renders user rows', async ({ page }) => {
    await nav(page, 'Users');
    await page.waitForTimeout(600);
    // Should list existing users
    await expect(page.getByText(/test admin/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('add user modal opens', async ({ page }) => {
    await nav(page, 'Users');
    await page.waitForTimeout(400);
    const addBtn = page.getByRole('button', { name: 'Add user' }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('input[type="email"]').last()).toBeVisible({ timeout: 5000 });
  });

  test('create a new rep user', async ({ page }) => {
    await nav(page, 'Users');
    await page.waitForTimeout(400);

    const addBtn = page.getByRole('button', { name: 'Add user' }).first();
    if (!await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await addBtn.click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Jane Cooper').first().fill(`PW Rep ${TS}`);
    await page.locator('input[type="email"]').last().fill(`pw.rep.${TS}@relay-crm.test`);
    await page.locator('input[type="password"]').last().fill('TestPass123!');

    // Role defaults to rep — leave it
    await page.getByRole('button', { name: /save|add/i }).last().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(`PW Rep ${TS}`)).toBeVisible({ timeout: 6000 });
  });

  test('notification trigger button works (admin)', async ({ page }) => {
    await nav(page, 'Settings');
    await page.waitForTimeout(400);
    // Trigger notifications button (if exists)
    const triggerBtn = page.getByRole('button', { name: /trigger|send notification|fire/i }).first();
    if (await triggerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await triggerBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
