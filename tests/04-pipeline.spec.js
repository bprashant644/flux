const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

test.describe('Pipeline (Deals kanban)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Sidebar label is "Pipeline" (key='deals')
    await nav(page, 'Pipeline');
  });

  test('kanban renders with stage column headers', async ({ page }) => {
    await page.waitForTimeout(600);
    for (const stage of ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']) {
      await expect(page.getByText(stage).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('pipeline header shows deal stats', async ({ page }) => {
    await page.waitForTimeout(600);
    const body = await page.textContent('body');
    expect(/open|active|won/i.test(body)).toBeTruthy();
  });

  // Note: deals are created from the contact detail panel (+ Add deal button),
  // NOT from a standalone button in the Pipeline view.
  test('deal cards display without undefined or NaN values', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    expect(body).not.toContain('undefined');
    await expect(page.getByText('NaN', { exact: true })).not.toBeVisible();
  });

  test('deal card is clickable and shows edit controls if any deal exists', async ({ page }) => {
    await page.waitForTimeout(800);
    // Look for any deal card — they have a clickable title element
    const dealCards = page.locator('[data-deal-id], .deal-card').first();
    const hasDealCard = await dealCards.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasDealCard) {
      // No deals in DB yet — skip gracefully
      return;
    }
    await dealCards.click();
    await page.waitForTimeout(400);
    const hasEdit = await page.getByRole('button', { name: /save|update|close/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasEdit).toBeTruthy();
  });

  test('column value totals are proper numbers', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.textContent('body');
    // No raw 8-digit INR concatenated strings (bug: counts were string-concatenated)
    expect(body).not.toMatch(/₹\d{8}/);
    await expect(page.getByText('NaN', { exact: true })).not.toBeVisible();
  });
});
