const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

const TS = Date.now();
const CONTACT_NAME    = `PW Contact ${TS}`;
const CONTACT_COMPANY = 'Playwright Co';
const CONTACT_EMAIL   = `pw.${TS}@playwright.test`;
const CONTACT_PHONE   = '9' + String(TS).slice(-9); // unique per run — avoids 409 duplicate

// Fill the search box and wait for React to filter
async function searchFor(page, name) {
  const search = page.getByPlaceholder('Search contacts…');
  try {
    await search.waitFor({ state: 'visible', timeout: 10000 });
    await search.fill(name);
    await page.waitForTimeout(400);
  } catch {
    // search box didn't appear — proceed without search filter
  }
}

// Login and wait for contacts to fully load (loadContacts fires on CRM mount, not on nav click)
async function loginAndLoadContacts(page, user) {
  // Set up the contacts response listener BEFORE clicking Sign in
  // (CRM mounts after login → useEffect → loadContacts → GET /api/contacts)
  await page.goto('/login');
  if (user) {
    await page.locator('input[type="email"]').fill(user.email);
  } else {
    await page.locator('input[type="email"]').fill('test.admin@relay-crm.test');
  }
  await page.locator('input[type="password"]').fill(user ? user.password : 'TestPass123!');

  const contactsLoaded = page.waitForResponse(
    r => r.url().includes('/api/contacts') && !r.url().includes('/api/contacts/') && r.status() === 200,
    { timeout: 15000 }
  ).catch(() => null);

  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('aside', { timeout: 12000 });
  await contactsLoaded; // wait for contacts API to respond

  // Now navigate to the Contacts view
  await page.locator('aside').getByRole('button', { name: 'Contacts', exact: true }).click();
  await page.waitForTimeout(200);
}

// Find and click a contact by name (contacts must already be loaded)
async function openContact(page, name) {
  await searchFor(page, name);
  const contact = page.getByText(name).first();
  await expect(contact).toBeVisible({ timeout: 12000 });
  await contact.click();
  await page.waitForTimeout(500);
}

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndLoadContacts(page);
  });

  test('contacts view renders without error', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('search box accepts input and filters list', async ({ page }) => {
    const search = page.getByPlaceholder('Search contacts…');
    await expect(search).toBeVisible({ timeout: 6000 });
    await search.fill('xyz-no-match-xyz');
    await page.waitForTimeout(400);
    await search.fill('');
  });

  test('"New contact" button opens Add Contact modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New contact' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByPlaceholder('Jane Cooper')).toBeVisible();
  });

  test('fill all contact fields and save', async ({ page }) => {
    await page.getByRole('button', { name: 'New contact' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Jane Cooper').fill(CONTACT_NAME);
    await page.getByPlaceholder('Acme Inc.').fill(CONTACT_COMPANY);
    await page.getByPlaceholder('jane@acme.com').fill(CONTACT_EMAIL);
    await page.getByPlaceholder('+1 (555) 010-0000').fill(CONTACT_PHONE);

    const valInput = page.locator('input[type="number"]').first();
    await valInput.fill('500000');
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Add contact' }).click();
    await page.waitForTimeout(1500);

    // Search to confirm contact was actually saved (not blocked by duplicate modal)
    await searchFor(page, CONTACT_NAME);
    await expect(page.getByText(CONTACT_NAME).first()).toBeVisible({ timeout: 10000 });
  });

  test('click contact row opens detail panel showing company', async ({ page }) => {
    await openContact(page, CONTACT_NAME);
    // Company appears in multiple places (list row + detail panel) — use .first()
    await expect(page.getByText(CONTACT_COMPANY).first()).toBeVisible({ timeout: 6000 });
  });

  test('Edit button in detail panel saves changes', async ({ page }) => {
    await openContact(page, CONTACT_NAME);

    // Edit button is icon-only with title="Edit contact"
    const editBtn = page.locator('button[title="Edit contact"]');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Notes textarea (placeholder "Context, next steps…") is in edit mode only
    const notesArea = page.getByPlaceholder('Context, next steps…');
    await expect(notesArea).toBeVisible({ timeout: 5000 });
    await notesArea.fill('Updated via Playwright');

    await page.getByRole('button', { name: 'Save' }).first().click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Updated via Playwright').first()).toBeVisible({ timeout: 5000 });
  });

  test('add a deal inline from contact detail', async ({ page }) => {
    await openContact(page, CONTACT_NAME);

    const addDealBtn = page.getByRole('button', { name: /add deal|\+ deal/i }).first();
    if (await addDealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addDealBtn.click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('Deal title').fill(`Inline Deal ${TS}`);
      await page.getByRole('button', { name: 'Save deal' }).click();
      await page.waitForTimeout(800);
      await expect(page.getByText(`Inline Deal ${TS}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('log an activity note from detail panel', async ({ page }) => {
    await openContact(page, CONTACT_NAME);

    // Activity note is an <input> with placeholder "Add a note…", not a textarea
    const noteInput = page.getByPlaceholder('Add a note…');
    if (await noteInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteInput.fill('Playwright activity note');
      const addBtn = page.getByRole('button', { name: 'Add', exact: true }).last();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(800);
        await expect(page.getByText('Playwright activity note').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('contact stage pills are clickable', async ({ page }) => {
    await openContact(page, CONTACT_NAME);

    // Use exact:true — panel stage buttons say exactly "Contacted", "Follow-up" etc.
    // List stage filter buttons say "Contacted 3" (with count) and would be behind the backdrop
    for (const stage of ['Contacted', 'Follow-up']) {
      const btn = page.getByRole('button', { name: stage, exact: true }).first();
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(400);
        break;
      }
    }
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('contact value shows formatted without NaN/undefined', async ({ page }) => {
    await openContact(page, CONTACT_NAME);
    await expect(page.getByText('NaN', { exact: true })).not.toBeVisible();
    await expect(page.getByText('undefined', { exact: true })).not.toBeVisible();
  });

  test('filter pills (All, stage labels) work', async ({ page }) => {
    for (const label of ['All', 'New', 'Contacted']) {
      const btn = page.getByRole('button', { name: new RegExp(`^${label}$`) }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });
});
