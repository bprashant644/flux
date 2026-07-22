const { test, expect } = require('@playwright/test');
const { TEST_ADMIN, login } = require('./helpers');

test.describe('Authentication', () => {
  test('login page renders with email + password fields and Sign in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(TEST_ADMIN.email);
    await page.locator('input[type="password"]').fill('wrongpassword!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Server uses bcrypt — allow up to 12s for the round-trip
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 12000 });
  });

  test('correct credentials log in and show sidebar', async ({ page }) => {
    await login(page);
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside').getByRole('button', { name: 'Contacts', exact: true })).toBeVisible();
  });

  test('logout button returns to /login', async ({ page }) => {
    await login(page);
    await page.locator('button[title="Sign out"]').click();
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });
});
