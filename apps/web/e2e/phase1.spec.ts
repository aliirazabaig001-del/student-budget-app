import { expect, test, type Page } from '@playwright/test';

/**
 * Phase 1 acceptance journey through the real UI and API:
 * sign in → (forced password change) → dashboard → settings + logo →
 * users → audit log → coming-soon module → sign out.
 */
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const NEW_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? 'E2e-admin-pass-2026';

/** A valid 1×1 PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC',
  'base64',
);

async function signIn(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email or username').fill(USERNAME);

  // First run uses the initial password and must change it; later runs use the new one.
  let signedIn = false;
  for (const password of [PASSWORD, NEW_PASSWORD]) {
    await page.getByLabel('Password', { exact: true }).fill(password);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login')),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ]);
    if (response.ok()) {
      signedIn = true;
      break;
    }
  }
  expect(signedIn, 'admin sign-in').toBe(true);
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));

  if (page.url().includes('/change-password')) {
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await page.getByLabel('Current password').fill(PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Change password' }).click();
  }
  await expect(page).toHaveURL('/');
}

test('Phase 1 journey', async ({ page }) => {
  test.skip(!PASSWORD, 'Set E2E_ADMIN_PASSWORD to the initial admin password.');

  await test.step('protected pages redirect to sign-in', async () => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Fees • Payroll • Inventory • Accounts').first()).toBeVisible();
  });

  await test.step('rejects a wrong password', async () => {
    await page.getByLabel('Email or username').fill(USERNAME);
    await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-1');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid email/username or password.');
  });

  await test.step('signs in', () => signIn(page));

  await test.step('dashboard shows unconnected placeholders only', async () => {
    await expect(page.getByText('Finance modules are not connected yet')).toBeVisible();
    for (const label of [
      'Fees Collected',
      'Outstanding Fees',
      'Salaries',
      'Expenses',
      'Inventory Value',
      'Cash Balance',
    ]) {
      await expect(page.getByLabel('Key figures').getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  });

  await test.step('saves school settings', async () => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByLabel('School name').fill('Iqra Public School');
    await page.getByLabel('Campus name').fill('Main Campus');
    await page.getByLabel('Academic session').fill('2026-2027');
    await page.getByLabel('IBAN').fill('PK36 SCBL 0000 0011 2345 6702');
    await page.getByLabel('JazzCash').fill('0300-1234567');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('School settings saved.')).toBeVisible();
    await expect(page.getByLabel('IBAN')).toHaveValue('PK36SCBL0000001123456702');
    await expect(page.locator('header').getByText('Iqra Public School')).toBeVisible();
  });

  await test.step('shows validation errors', async () => {
    await page.getByLabel('Email', { exact: true }).fill('not-an-email');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await page.getByRole('button', { name: 'Discard changes' }).click();
  });

  await test.step('uploads a logo', async () => {
    await page
      .getByTestId('logo-input')
      .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByText('Logo updated.')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Iqra Public School logo' })).toBeVisible();
  });

  const username = `e2e.${Date.now().toString(36)}`;
  await test.step('creates a user', async () => {
    await page.getByRole('link', { name: 'Users' }).click();
    await page.getByRole('button', { name: 'Add user' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Full name').fill('Ayesha Khan');
    await dialog.getByLabel('Email').fill(`${username}@example.com`);
    await dialog.getByLabel('Username').fill(username);
    await dialog.getByLabel('Temporary password').fill('Welcome-2026-pass');
    await dialog.getByLabel('Accountant').check();
    await dialog.getByRole('button', { name: 'Create user' }).click();
    await expect(page.getByText('User Ayesha Khan created.')).toBeVisible();
    await page.getByLabel('Search users').fill(username);
    await expect(page.getByRole('cell', { name: `Ayesha Khan @${username}` })).toBeVisible();
  });

  await test.step('audit log records the actions', async () => {
    await page.getByRole('link', { name: 'Audit Log' }).click();
    for (const label of [
      'Created user',
      'Uploaded school logo',
      'Updated school settings',
      'Signed in',
    ]) {
      await expect(page.getByRole('table').getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  await test.step('future modules say they are coming', async () => {
    await page.getByRole('link', { name: /Payroll/ }).click();
    await expect(page.getByRole('heading', { name: 'Coming in next milestone' })).toBeVisible();
  });

  await test.step('session survives a page reload', async () => {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Coming in next milestone' })).toBeVisible();
  });

  await test.step('signs out', async () => {
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
