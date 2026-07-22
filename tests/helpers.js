// Shared helpers — selectors match the actual Flux UI

const TEST_ADMIN = { email: 'test.admin@relay-crm.test', password: 'TestPass123!' };

async function login(page, user = TEST_ADMIN) {
  await page.goto('/login');
  // Login inputs: type=email and type=password (no placeholder to match)
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for the sidebar <aside> to appear — signals successful login
  await page.waitForSelector('aside', { timeout: 12000 });
}

// Click a sidebar or header nav button by its label.
// data-navitem excludes collapsible group-header buttons; .and() matches accessible
// name (text or title attribute) so icon-only buttons like Settings work too.
// Note: Settings lives in <header>, not <aside>, hence no aside scope here.
async function nav(page, label) {
  await page.locator('button[data-navitem]')
    .and(page.getByRole('button', { name: label, exact: true }))
    .first()
    .click();
  await page.waitForTimeout(500);
}

module.exports = { TEST_ADMIN, login, nav };
