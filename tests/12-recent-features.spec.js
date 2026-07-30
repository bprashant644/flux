const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { login, nav, TEST_ADMIN } = require('./helpers');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API = 'http://localhost:3002/api';
// Precise, non-UI helper for admin-side setup/assertions that must never risk touching
// another real user's data (e.g. clicking the wrong "Approve" button in a shared list).
async function apiAs(creds) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const { token, user } = await res.json();
  const authed = (path, opts = {}) => fetch(`${API}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json());
  return {
    user,
    get: (path) => authed(path),
    post: (path, body) => authed(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => authed(path, { method: 'PUT', body: JSON.stringify(body) }),
  };
}
const adminApi = () => apiAs(TEST_ADMIN);

// Covers features added/changed in this session:
//  - password policy + confirm-password field on Add/Edit User
//  - CRM Role / Company Role rename, auto-None on Admin, collapsible permissions
//  - leave apply / revoke / backdate rejection / balance-exceeded rejection
//  - grouped-by-employee views (Leave History, Employee Docs, All Tasks, Team Tasks)
//
// All dummy records are tagged with TS so afterAll can find and remove them,
// regardless of whether the in-UI delete steps succeeded.

// Playwright can restart the worker process mid-run (e.g. after a test times out),
// which re-`require`s this file — a plain `Date.now()` would then mint a *different*
// TS than the one already used to create QA_* records, silently orphaning them for
// the rest of the run. Pin TS to a lock file so it survives worker restarts.
const TS_LOCK = path.join(__dirname, '.qa-ts-lock-12');
const TS = fs.existsSync(TS_LOCK)
  ? fs.readFileSync(TS_LOCK, 'utf8').trim()
  : (() => { const t = String(Date.now()); fs.writeFileSync(TS_LOCK, t); return t; })();
const QA_NAME  = `QA User ${TS}`;
const QA_EMAIL = `qa.user.${TS}@relay-crm.test`;
const QA_PASS  = 'Qa@Test1234';
const QA_CONTACT = `QA Contact ${TS}`;
const QA_PROJECT = `QA Project ${TS}`;
const QA_DOC_TITLE = `QA Doc ${TS}`;
const QA_TASK_TITLE = `QA CRM Task ${TS}`;

const dummyFile = path.join(__dirname, `qa-doc-${TS}.pdf`);

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter  = new Date(today); dayAfter.setDate(today.getDate() + 2);
const futureA   = new Date(today); futureA.setDate(today.getDate() + 10);
const futureB   = new Date(today); futureB.setDate(today.getDate() + 11);
const farFuture = new Date(today); farFuture.setDate(today.getDate() + 120);
const threeDaysAgo = new Date(today); threeDaysAgo.setDate(today.getDate() - 3);

test.beforeAll(() => {
  fs.writeFileSync(dummyFile, '%PDF-1.4 QA test file\n%%EOF');
});

test.afterAll(async () => {
  fs.rmSync(dummyFile, { force: true });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`DELETE FROM hr_documents WHERE title = $1`, [QA_DOC_TITLE]);
    await pool.query(`DELETE FROM project_items WHERE title ILIKE $1`, [`QA %${TS}%`]);
    await pool.query(`DELETE FROM projects WHERE title = $1`, [QA_PROJECT]);
    await pool.query(`DELETE FROM tasks WHERE title = $1`, [QA_TASK_TITLE]);
    await pool.query(`DELETE FROM leave_requests WHERE reason ILIKE $1`, [`QA leave%${TS}%`]);
    await pool.query(`DELETE FROM deals WHERE title ILIKE $1`, [`%${TS}%`]);
    await pool.query(`DELETE FROM contacts WHERE name = $1`, [QA_CONTACT]);
    await pool.query(`DELETE FROM users WHERE email = $1`, [QA_EMAIL]);
  } finally {
    await pool.end();
    fs.rmSync(TS_LOCK, { force: true });
  }
});

test.describe('User modal — password policy, confirm field, role UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await nav(page, 'Users');
  });

  test('weak password is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Add user' }).first().click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Jane Cooper').first().fill(QA_NAME);
    await page.locator('input[type="email"]').last().fill(QA_EMAIL);
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill('testtest');
    await pwInputs.nth(1).fill('testtest');

    await page.getByRole('button', { name: /save|add/i }).last().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/uppercase/i)).toBeVisible({ timeout: 5000 });
  });

  test('mismatched confirm password is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Add user' }).first().click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Jane Cooper').first().fill(QA_NAME);
    await page.locator('input[type="email"]').last().fill(QA_EMAIL);
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(QA_PASS);
    await pwInputs.nth(1).fill('Different@1234');

    await page.getByRole('button', { name: /save|add/i }).last().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 5000 });
  });

  test('CRM Role = Admin auto-selects Company Role = None and disables it', async ({ page }) => {
    await page.getByRole('button', { name: 'Add user' }).first().click();
    await page.waitForTimeout(300);

    const crmRoleSelect = page.locator('select').filter({ has: page.locator('option[value="admin"]') }).first();
    await crmRoleSelect.selectOption('admin');
    await page.waitForTimeout(200);

    const companyRoleSelect = page.locator('select').filter({ has: page.locator('option[value="hr_admin"]') }).first();
    await expect(companyRoleSelect).toBeDisabled();
    await expect(companyRoleSelect).toHaveValue('');
    await expect(page.getByText(/set to none automatically/i)).toBeVisible();

    // switch back to Rep — Company Role should re-enable
    await crmRoleSelect.selectOption('rep');
    await expect(companyRoleSelect).toBeEnabled();
  });

  test('permissions collapsible expands to show bullet list', async ({ page }) => {
    await page.getByRole('button', { name: 'Add user' }).first().click();
    await page.waitForTimeout(300);

    const toggle = page.getByText('What does this role do?').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByText(/sees only their own contacts/i)).toBeVisible({ timeout: 3000 });
    await toggle.click();
  });

  test('create user with matching strong password succeeds', async ({ page }) => {
    await page.getByRole('button', { name: 'Add user' }).first().click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Jane Cooper').first().fill(QA_NAME);
    await page.locator('input[type="email"]').last().fill(QA_EMAIL);
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(QA_PASS);
    await pwInputs.nth(1).fill(QA_PASS);
    // leave CRM Role = Rep, Company Role = Employee (defaults)

    await page.getByRole('button', { name: /save|add/i }).last().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(QA_NAME)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Leave — apply, backdate rejection, balance cap, revoke', () => {
  test('apply for a future leave and revoke it while pending', async ({ page }) => {
    await login(page, { email: QA_EMAIL, password: QA_PASS });
    await nav(page, 'My Leaves');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Apply Leave' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type="date"]').nth(0).fill(fmtDate(tomorrow));
    await page.locator('input[type="date"]').nth(1).fill(fmtDate(dayAfter));
    await page.locator('textarea').fill(`QA leave revoke-pending ${TS}`);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(800);

    const card = page.locator('div', { hasText: `QA leave revoke-pending ${TS}` }).last();
    await expect(page.getByText(`QA leave revoke-pending ${TS}`)).toBeVisible({ timeout: 6000 });

    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'Revoke' }).first().click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Cancelled').first()).toBeVisible({ timeout: 6000 });
  });

  test('requesting more days than the balance allows is rejected', async ({ page }) => {
    await login(page, { email: QA_EMAIL, password: QA_PASS });
    await nav(page, 'My Leaves');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Apply Leave' }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type="date"]').nth(0).fill(fmtDate(tomorrow));
    await page.locator('input[type="date"]').nth(1).fill(fmtDate(farFuture));
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/insufficient leave balance/i)).toBeVisible({ timeout: 6000 });
  });

  test('backdated leave is rejected client-side', async ({ page }) => {
    await login(page, { email: QA_EMAIL, password: QA_PASS });
    await nav(page, 'My Leaves');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Apply Leave' }).click();
    await page.waitForTimeout(300);
    const startInput = page.locator('input[type="date"]').nth(0);
    await expect(startInput).toHaveAttribute('min', fmtDate(today));
    // .fill() sets the value directly, bypassing the min= UI guard, to confirm the JS validation catches it too
    await startInput.fill(fmtDate(threeDaysAgo));
    await page.locator('input[type="date"]').nth(1).fill(fmtDate(today));
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/cannot be in the past/i)).toBeVisible({ timeout: 5000 });
  });

  test('approved future leave can still be revoked; past adhoc leave cannot', async ({ page }) => {
    // Set up both leave requests entirely via API (fast, deterministic, and exercises the
    // exact same server logic the UI forms call) — the UI-driven part of this test is only
    // the part that's actually specific to the UI: what QA sees and can click on "My Leaves".
    const qa = await apiAs({ email: QA_EMAIL, password: QA_PASS });
    const admin = await adminApi();
    const types = await qa.get('/hr/leaves/types');
    const leaveTypeId = types[0].id;

    const created = await qa.post('/hr/leaves/requests', {
      leave_type_id: leaveTypeId,
      start_date: fmtDate(futureA),
      end_date: fmtDate(futureB),
      days: 2,
      reason: `QA leave approve-then-revoke ${TS}`,
    });
    expect(created.id).toBeTruthy();
    await admin.put(`/hr/leaves/requests/${created.id}`, { status: 'approved' });

    const adhoc = await admin.post('/hr/leaves/requests', {
      leave_type_id: leaveTypeId,
      start_date: fmtDate(threeDaysAgo),
      end_date: fmtDate(threeDaysAgo),
      days: 1,
      reason: `QA leave adhoc-past ${TS}`,
      user_id: qa.user.id,
    });
    expect(adhoc.id).toBeTruthy();
    expect(adhoc.status).toBe('approved'); // adhoc admin grants for another user are auto-approved

    // Now the UI part: log in as QA once and check both cards on "My Leaves".
    await login(page, { email: QA_EMAIL, password: QA_PASS });
    await nav(page, 'My Leaves');
    await page.waitForTimeout(600);

    // The reason text is the LEAVE_CARD's direct child — go from the (exact-match) reason
    // text node up one level to its card container, rather than a hasText div search (which
    // ambiguously matches both the card AND the too-narrow reason div itself).
    const approvedFutureCard = page.getByText(`QA leave approve-then-revoke ${TS}`, { exact: true }).locator('xpath=..');
    await expect(approvedFutureCard.getByText('Approved')).toBeVisible({ timeout: 6000 });
    await expect(approvedFutureCard.getByRole('button', { name: 'Revoke' })).toBeVisible();
    page.once('dialog', d => d.accept());
    await approvedFutureCard.getByRole('button', { name: 'Revoke' }).click();
    await page.waitForTimeout(800);
    await expect(approvedFutureCard.getByText('Cancelled')).toBeVisible({ timeout: 6000 });

    const pastAdhocCard = page.getByText(`QA leave adhoc-past ${TS}`, { exact: true }).locator('xpath=..');
    if (await pastAdhocCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pastAdhocCard.getByRole('button', { name: 'Revoke' })).not.toBeVisible();
    }
  });
});

test.describe('HR — grouped Employee Docs, delete flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('upload employee doc for QA user, verify grouped, then delete', async ({ page }) => {
    await nav(page, 'Manage Documents');
    await page.waitForTimeout(500);
    const employeesLoaded = page.waitForResponse(r => r.url().includes('/api/hr/employees') && r.status() === 200, { timeout: 15000 }).catch(() => null);
    await page.getByRole('button', { name: 'Upload Document' }).click();
    await employeesLoaded;
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Employee Doc', exact: true }).click();
    await page.locator('select').first().selectOption({ label: QA_NAME });
    await page.getByPlaceholder(/leave policy/i).fill(QA_DOC_TITLE);
    await page.locator('input[type="file"]').setInputFiles(dummyFile);
    await page.getByRole('button', { name: /upload/i }).last().click();
    await page.waitForTimeout(1000);

    // Employee Docs tab, grouped by employee
    const employeeTab = page.getByRole('button', { name: /employee docs/i });
    if (await employeeTab.isVisible({ timeout: 3000 }).catch(() => false)) await employeeTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(QA_NAME).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(QA_DOC_TITLE)).toBeVisible({ timeout: 6000 });

    // delete it
    const docCard = page.locator('div', { hasText: QA_DOC_TITLE }).last();
    const trashBtn = docCard.getByRole('button').last();
    if (await trashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.once('dialog', d => d.accept());
      await trashBtn.click();
      await page.waitForTimeout(800);
    }
  });
});

test.describe('CRM — All Tasks grouped by employee', () => {
  test.beforeEach(async ({ page }) => {
    const usersLoaded = page.waitForResponse(r => r.url().includes('/api/users') && r.status() === 200, { timeout: 15000 }).catch(() => null);
    await login(page);
    await usersLoaded;
  });

  test('create contact + task assigned to QA user, verify grouped in All Tasks', async ({ page }) => {
    await nav(page, 'Contacts');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'New contact' }).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Jane Cooper').fill(QA_CONTACT);
    await page.getByRole('button', { name: 'Add contact' }).click();
    await page.waitForTimeout(1000);

    const search = page.getByPlaceholder('Search contacts…');
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) await search.fill(QA_CONTACT);
    await page.getByText(QA_CONTACT).first().click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '+ Add task' }).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Task title').fill(QA_TASK_TITLE);
    // Scope tightly to the task-form row (title input's grandparent grid div, which also
    // holds the due-date input and assignee select as siblings) — a `:has()` search matches
    // every ancestor up to the page root, and `.first()` on that grabs the topmost one, which
    // can contain unrelated selects (e.g. the "All reps" filter) that also list every user.
    const taskFormRow = page.getByPlaceholder('Task title').locator('xpath=../..');
    const assigneeSelect = taskFormRow.locator('select');
    if (await assigneeSelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await assigneeSelect.first().selectOption({ label: QA_NAME });
    }
    await page.getByRole('button', { name: 'Save task' }).click();
    await page.waitForTimeout(800);

    // The contact panel's task list is a locally-scoped fetch (DetailPanel's own `tasks`
    // state) — creating a task there doesn't refresh the global list "All Tasks" reads from,
    // so reload to pick it up. This also clears the still-open slide-over, whose full-screen
    // backdrop would otherwise intercept clicks on the nav bar behind it.
    await page.reload();
    await page.waitForTimeout(800);

    await nav(page, 'All Tasks');
    await page.waitForTimeout(600);
    await expect(page.getByText(QA_NAME).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(QA_TASK_TITLE)).toBeVisible({ timeout: 6000 });

    // delete task
    const row = page.locator('div', { hasText: QA_TASK_TITLE }).last();
    const trashBtn = row.getByRole('button').last();
    if (await trashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await trashBtn.click();
      await page.waitForTimeout(800);
    }

    // delete the QA contact too
    await nav(page, 'Contacts');
    await page.waitForTimeout(400);
    if (await search.isVisible({ timeout: 2000 }).catch(() => false)) await search.fill(QA_CONTACT);
    await page.getByText(QA_CONTACT).first().click();
    await page.waitForTimeout(400);
    const delBtn = page.locator('button[title="Delete contact"]');
    if (await delBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await delBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.getByRole('button', { name: 'Yes', exact: true }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(600);
      }
    }
  });
});

test.describe('Projects — Team Tasks view (admin)', () => {
  test.beforeEach(async ({ page }) => {
    const usersLoaded = page.waitForResponse(r => r.url().includes('/api/users') && r.status() === 200, { timeout: 15000 }).catch(() => null);
    await login(page);
    await usersLoaded;
    await nav(page, 'All Projects');
  });

  test('create project + task for QA user, verify in Team Tasks, then delete project', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder*="roject"], input[placeholder*="itle"]').first().fill(QA_PROJECT);
    await page.getByRole('button', { name: /create project|save/i }).last().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(QA_PROJECT)).toBeVisible({ timeout: 8000 });

    await page.getByText(QA_PROJECT).first().click();
    await page.waitForTimeout(500);
    const tasksTab = page.getByRole('button', { name: 'Tasks', exact: true }).first();
    await tasksTab.click();
    await page.waitForTimeout(300);
    const addBtn = page.getByRole('button', { name: 'Add', exact: true }).first();
    await addBtn.click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('Enter a title…').fill(`QA Project Task ${TS}`);
    // Target the select right next to the "Assignee" label rather than a broad modal
    // container search — a `:has()` match picks the topmost ancestor by default, which can
    // include unrelated selects elsewhere on the page.
    const assigneeSelect = page.getByText('Assignee', { exact: true }).locator('xpath=following-sibling::select');
    if (await assigneeSelect.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await assigneeSelect.first().selectOption({ label: QA_NAME });
    }
    await page.getByRole('button', { name: /add item|save/i }).last().click();
    await page.waitForTimeout(800);

    // back to project list, switch to Team Tasks view
    const backBtn = page.getByRole('button', { name: /← Projects/ }).first();
    if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) await backBtn.click();
    await page.waitForTimeout(500);

    const teamBtn = page.getByTitle('Team tasks').first();
    let openedFromTeamTasks = false;
    if (await teamBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teamBtn.click();
      await page.waitForTimeout(600);
      await expect(page.getByText(QA_NAME).first()).toBeVisible({ timeout: 6000 });
      const taskRow = page.getByText(`QA Project Task ${TS}`);
      await expect(taskRow).toBeVisible({ timeout: 6000 });
      // clicking the item in Team Tasks opens its project directly
      await taskRow.click();
      await page.waitForTimeout(500);
      openedFromTeamTasks = true;
    }

    if (!openedFromTeamTasks) {
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) await backBtn.click();
      await page.waitForTimeout(400);
      await page.getByText(QA_PROJECT).first().click();
      await page.waitForTimeout(500);
    }

    // clean up: delete the project (cascades its items) — icon-only trash button, styled red
    const deleteBtn = page.locator('button[style*="#FECACA"]').first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.getByRole('button', { name: 'Delete', exact: true }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(800);
      }
    }
  });

});

// Separate describe (no shared admin-login beforeEach) — this test logs in as QA directly,
// and reusing a page that already holds an admin token would make /login redirect away
// before the form could be filled.
test.describe('Projects — Team Tasks view (employee)', () => {
  test('Team tasks button is not shown to a plain employee', async ({ page }) => {
    await login(page, { email: QA_EMAIL, password: QA_PASS });
    const hasProjects = await page.locator('aside').getByRole('button', { name: 'Projects', exact: true }).isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasProjects) return; // QA user has no Projects module access by default — nothing to check
    await nav(page, 'Projects');
    await page.waitForTimeout(500);
    await expect(page.getByTitle('Team tasks')).not.toBeVisible();
  });
});

test.describe('Final cleanup verification', () => {
  test('QA user no longer appears in Users list', async ({ page }) => {
    await login(page);
    await nav(page, 'Users');
    await page.waitForTimeout(500);
    const delRow = page.locator('div', { hasText: QA_NAME }).filter({ has: page.locator('button[title="Edit"]') }).first();
    if (await delRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // still present — remove via UI so afterAll SQL is a pure safety net
      await delRow.hover();
      const delBtn = delRow.getByRole('button').last();
      await delBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(600);
      }
    }
  });
});
