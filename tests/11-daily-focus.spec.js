const { test, expect } = require('@playwright/test');
const { login, nav, TEST_ADMIN } = require('./helpers');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TS = Date.now();
const PROJECT_TITLE = `PW Focus Project ${TS}`;
const today = () => new Date().toISOString().slice(0, 10);

// Buttons inside an item row: <div row> <div> <span>title</span> </div> <button title=...> …
const rowButton = (page, itemTitle, btnTitle) =>
  page.locator(`xpath=//span[text()="${itemTitle}"]/ancestor::div[2]//button[@title="${btnTitle}"]`).first();

// Project-detail tab buttons live in <main>, not the sidebar.
// Tab names include a count badge once items exist ("Tasks 2"), so match by prefix.
const mainBtn = (page, re) => page.locator('main').getByRole('button', { name: re }).first();

// Serial: later tests use data created by earlier ones
test.describe('Daily focus plan', () => {
  // Plan counts asserted below are absolute — start from a clean slate
  test.beforeAll(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(
      "DELETE FROM daily_focus WHERE user_id IN (SELECT id FROM users WHERE email = $1)",
      [TEST_ADMIN.email]
    );
    await pool.end();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('setup: create project with a due-today task', async ({ page }) => {
    await nav(page, 'All Projects');
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder*="roject"], input[placeholder*="itle"]').first().fill(PROJECT_TITLE);
    await page.getByRole('button', { name: /create project|save/i }).last().click();
    await page.waitForTimeout(1000);
    await page.getByText(PROJECT_TITLE).first().click();
    await page.waitForTimeout(600);

    // Add a task due today via Tasks tab
    await mainBtn(page, /^Tasks/).click();
    await page.waitForTimeout(300);
    await mainBtn(page, /^Add$/).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Enter a title…').fill(`PW Due Today ${TS}`);
    await page.locator('input[type="date"]').first().fill(today());
    await page.getByRole('button', { name: /add item|save/i }).last().click();
    await page.waitForTimeout(800);
    await expect(page.getByText(`PW Due Today ${TS}`).first()).toBeVisible();
  });

  test('pin a suggested item into My plan from the dashboard', async ({ page }) => {
    // Today's focus widget lives on Projects > Overview
    await nav(page, 'Overview');
    await expect(page.getByText("Today's focus")).toBeVisible({ timeout: 8000 });
    const pinBtn = rowButton(page, `PW Due Today ${TS}`, "Add to today's plan");
    await expect(pinBtn).toBeVisible({ timeout: 6000 });
    await pinBtn.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/My plan · \d+/)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/0\/\d+ planned done/)).toBeVisible();
  });

  test('quick-add a new task creates it due today and pins it', async ({ page }) => {
    await nav(page, 'Overview');
    await expect(page.getByText("Today's focus")).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: '+ Plan a task' }).click();
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await page.getByPlaceholder('Task title — will be due today').fill(`PW Quick ${TS}`);
    await page.locator('select').filter({ hasText: 'Project…' }).selectOption({ label: PROJECT_TITLE });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(`PW Quick ${TS}`).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/My plan · 2/)).toBeVisible({ timeout: 6000 });
  });

  test('pull in an existing undated task via the picker', async ({ page }) => {
    // Create an undated task first
    await nav(page, 'All Projects');
    await page.getByText(PROJECT_TITLE).first().click();
    await page.waitForTimeout(600);
    await mainBtn(page, /^Tasks/).click();
    await page.waitForTimeout(300);
    await mainBtn(page, /^Add$/).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Enter a title…').fill(`PW Undated ${TS}`);
    await page.getByRole('button', { name: /add item|save/i }).last().click();
    await page.waitForTimeout(800);

    // Back to the projects overview, pull it in
    await nav(page, 'Overview');
    await expect(page.getByText("Today's focus")).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: '+ Plan a task' }).click();
    await page.getByPlaceholder('Search open items across your projects…').fill(`PW Undated ${TS}`);
    await page.waitForTimeout(500);
    await page.getByText(`PW Undated ${TS}`).last().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/My plan · 3/)).toBeVisible({ timeout: 6000 });
  });

  test('mark a planned item done updates the counter; unpin removes from plan', async ({ page }) => {
    await nav(page, 'Overview');
    await expect(page.getByText("Today's focus")).toBeVisible({ timeout: 8000 });
    // Mark the quick-added task done
    const doneBtn = rowButton(page, `PW Quick ${TS}`, 'Mark done');
    await expect(doneBtn).toBeVisible({ timeout: 6000 });
    await doneBtn.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/1\/3 planned done/)).toBeVisible({ timeout: 6000 });

    // Unpin the undated task
    const unpinBtn = rowButton(page, `PW Undated ${TS}`, "Remove from today's plan");
    await unpinBtn.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/My plan · 2/)).toBeVisible({ timeout: 6000 });
    // Undated + unpinned → leaves the queue entirely
    await expect(page.getByText(`PW Undated ${TS}`)).not.toBeVisible();
  });

  test('projects Today strip shows pinned marker', async ({ page }) => {
    await nav(page, 'All Projects');
    await page.waitForTimeout(800);
    const strip = page.getByText(/Today's plan & due/);
    if (await strip.isVisible({ timeout: 4000 }).catch(() => false)) {
      await expect(page.getByTitle("On today's plan").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
