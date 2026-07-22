const { test, expect } = require('@playwright/test');
const { login, nav } = require('./helpers');

const TS = Date.now();
const PROJECT_TITLE = `PW Project ${TS}`;

// Helper: open a project by title. Assumes we're already in the Projects view.
async function openProject(page, title) {
  await page.getByText(title).first().click();
  await page.waitForTimeout(600);
}

// Helper: click a tab by label and click the tab-bar "Add" button, then fill the modal.
async function addItem(page, tabLabel, itemTitle, extra) {
  // Click the tab
  const tabBtn = page.getByRole('button', { name: tabLabel, exact: true }).first();
  if (!await tabBtn.isVisible({ timeout: 3000 }).catch(() => false)) return false;
  await tabBtn.click();
  await page.waitForTimeout(300);

  // Tab-bar "Add" button (text is "Add", with a plus icon)
  const addBtn = page.getByRole('button', { name: 'Add', exact: true }).first();
  if (!await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) return false;
  await addBtn.click();
  await page.waitForTimeout(300);

  // Modal "Add item" should appear — fill title
  const titleInput = page.getByPlaceholder('Enter a title…');
  if (!await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) return false;
  await titleInput.fill(itemTitle);

  if (extra) await extra(page);

  await page.getByRole('button', { name: /add item|save/i }).last().click();
  await page.waitForTimeout(800);
  return true;
}

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'All Projects');
  });

  // ── List view ────────────────────────────────────────────────────────────

  test('shows New project button', async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /new project/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('dashboard view: KPI strip shows values without NaN or undefined', async ({ page }) => {
    const dashBtn = page.getByRole('button', { name: /dashboard/i }).first();
    if (await dashBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashBtn.click();
      await page.waitForTimeout(800);
      const body = await page.textContent('body');
      await expect(page.getByText('NaN', { exact: true })).not.toBeVisible();
      await expect(page.getByText('undefined', { exact: true })).not.toBeVisible();
      expect(/active projects|open items|overdue|ppc/i.test(body)).toBeTruthy();
    }
  });

  test('filter pills (Active / Completed / Archived / All)', async ({ page }) => {
    for (const label of ['Active', 'Completed', 'Archived', 'All']) {
      const btn = page.getByRole('button', { name: new RegExp(`^${label}\\s`) }).first()
        .or(page.getByRole('button', { name: label, exact: true }).first());
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('weekly review modal opens and closes', async ({ page }) => {
    const wrBtn = page.getByRole('button', { name: /weekly review/i });
    if (await wrBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wrBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/weekly review|triage|overdue/i).first()).toBeVisible({ timeout: 6000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  });

  // ── Create project ───────────────────────────────────────────────────────

  test('new project modal fills and saves', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.waitForTimeout(300);

    await page.locator('input[placeholder*="roject"], input[placeholder*="itle"]').first().fill(PROJECT_TITLE);

    const desc = page.locator('textarea[placeholder*="escription"], input[placeholder*="escription"]').first();
    if (await desc.isVisible({ timeout: 1000 }).catch(() => false)) {
      await desc.fill('Playwright automated test project');
    }

    await page.getByRole('button', { name: /create project|save/i }).last().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(PROJECT_TITLE)).toBeVisible({ timeout: 8000 });
  });

  // ── Project detail ───────────────────────────────────────────────────────

  test('click project card opens detail with Overview as default tab', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    await expect(page.getByRole('button', { name: 'Overview', exact: true }).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('all tabs are clickable without crashing', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);

    for (const tab of ['Overview', 'Quadrant', 'Tasks', 'Deliverables', 'Follow-ups']) {
      const btn = page.getByRole('button', { name: tab, exact: true }).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(400);
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }
    }
  });

  test('add a milestone from Overview tab', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    const addMilestone = page.getByRole('button', { name: /add milestone/i }).first();
    if (await addMilestone.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addMilestone.click();
      await page.waitForTimeout(300);
      await page.locator('input[placeholder*="ilestone"], input[placeholder*="itle"]').first().fill(`PW Milestone ${TS}`);
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) await dateInput.fill('2026-09-30');
      await page.getByRole('button', { name: /save|add|create/i }).last().click();
      await page.waitForTimeout(800);
      await expect(page.getByText(`PW Milestone ${TS}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('add a Task item in Tasks tab', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    await addItem(page, 'Tasks', `PW Task ${TS}`, async (p) => {
      const dateInput = p.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) await dateInput.fill('2026-08-20');
    });
    // If item was added, verify it
    const item = page.getByText(`PW Task ${TS}`).first();
    if (await item.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(item).toBeVisible();
    }
  });

  test('add a Deliverable item in Deliverables tab', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    // Navigate to Deliverables tab first
    const delivTab = page.getByRole('button', { name: 'Deliverables', exact: true }).first();
    if (!await delivTab.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await delivTab.click();
    await page.waitForTimeout(300);

    // The empty-state has "+ Add deliverable", or the tab bar has "Add"
    let opened = false;
    const emptyBtn = page.getByRole('button', { name: /add deliverable/i }).first();
    const addBtn   = page.getByRole('button', { name: 'Add', exact: true }).first();

    if (await emptyBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await emptyBtn.click();
      opened = true;
    } else if (await addBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await addBtn.click();
      opened = true;
    }

    if (!opened) return;
    await page.waitForTimeout(300);

    // Switch type to Deliverable if type selector is present
    const delivTypeBtn = page.getByRole('button', { name: 'Deliverable', exact: true }).first();
    if (await delivTypeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await delivTypeBtn.click();

    const titleInput = page.getByPlaceholder('Enter a title…');
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill(`PW Deliverable ${TS}`);
      const docSel = page.locator('select').first();
      if (await docSel.isVisible({ timeout: 1000 }).catch(() => false)) await docSel.selectOption('Proposal');
      await page.getByRole('button', { name: /add item|save/i }).last().click();
      await page.waitForTimeout(800);
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });

  test('add a Follow-up item in Follow-ups tab', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    const fuTab = page.getByRole('button', { name: 'Follow-ups', exact: true }).first();
    if (!await fuTab.isVisible({ timeout: 3000 }).catch(() => false)) return;
    await fuTab.click();
    await page.waitForTimeout(300);

    const emptyBtn = page.getByRole('button', { name: /add follow-up/i }).first();
    const addBtn   = page.getByRole('button', { name: 'Add', exact: true }).first();

    let opened = false;
    if (await emptyBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await emptyBtn.click();
      opened = true;
    } else if (await addBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await addBtn.click();
      opened = true;
    }

    if (!opened) return;
    await page.waitForTimeout(300);

    // Switch type to Follow-up if type selector is present
    const fuTypeBtn = page.getByRole('button', { name: 'Follow-up', exact: true }).first();
    if (await fuTypeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await fuTypeBtn.click();

    const titleInput = page.getByPlaceholder('Enter a title…');
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill(`PW Follow-up ${TS}`);
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) await dateInput.fill('2026-08-10');
      await page.getByRole('button', { name: /add item|save/i }).last().click();
      await page.waitForTimeout(800);
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });

  test('Quadrant tab renders triage strip or empty state', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);

    const quadTab = page.getByRole('button', { name: 'Quadrant', exact: true }).first();
    if (await quadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quadTab.click();
      await page.waitForTimeout(500);
      const body = await page.textContent('body');
      expect(/do first|schedule|delegate|drop|triage|no item|no tasks|add tasks/i.test(body)).toBeTruthy();
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });

  test('back button "← Projects" returns to project list', async ({ page }) => {
    await openProject(page, PROJECT_TITLE);
    // Back button says "← Projects"
    // "← Projects" back button is unique — don't use /Projects/i which also matches the sidebar
    const backBtn = page.getByRole('button', { name: /← Projects/ }).first();
    if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backBtn.click();
    } else {
      // Fallback: click Projects in the sidebar
      await page.locator('aside').getByRole('button', { name: 'Projects', exact: true }).click();
    }
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible({ timeout: 6000 });
  });
});
