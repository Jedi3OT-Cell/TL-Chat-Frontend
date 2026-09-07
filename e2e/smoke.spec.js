import { test, expect } from '@playwright/test';
import { mockBackendOk, mockBackendDown } from './mock-backend.js';

test.describe('Landing page', () => {
  test('renders brand and both entry points', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ThreatLocker Support/);
    await expect(page.getByText('THREATLOCKER', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /REQUEST SUPPORT/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /AGENT LOGIN/i })).toBeVisible();
  });

  test('REQUEST SUPPORT navigates to the customer intake form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /REQUEST SUPPORT/i }).click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByText(/Start a support session/i)).toBeVisible();
  });

  test('AGENT LOGIN navigates to the secure login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /AGENT LOGIN/i }).click();
    await expect(page).toHaveURL(/\/agent$/);
    await expect(page.getByText(/SECURE LOGIN/i)).toBeVisible();
  });
});

test.describe('Customer intake form', () => {
  test('rejects an empty submission without calling the backend', async ({ page }) => {
    const calls = await mockBackendOk(page);
    await page.goto('/chat');
    await page.getByRole('button', { name: /CONNECT TO SUPPORT/i }).click();
    await expect(page.getByText(/ALL FIELDS REQUIRED/i)).toBeVisible();
    expect(calls.session).toBe(0);
  });

  test('degrades gracefully when the backend is unreachable', async ({ page }) => {
    await mockBackendDown(page);
    await page.goto('/chat');
    await page.getByLabel('Full name').fill('Ada Lovelace');
    await page.getByLabel('Organization').fill('Analytical Engine Co');
    await page.getByRole('button', { name: 'Windows 11' }).click();
    await page.getByLabel(/Describe your issue/i).fill('Ringfencing is blocking Excel from opening a network share.');
    await page.getByRole('button', { name: /CONNECT TO SUPPORT/i }).click();
    await expect(page.getByText(/CONNECTION FAILED/i)).toBeVisible();
  });
});

test.describe('Agent login', () => {
  test('rejects an empty submission', async ({ page }) => {
    await page.goto('/agent');
    await page.getByRole('button', { name: /AUTHENTICATE/i }).click();
    await expect(page.getByText(/ALL FIELDS REQUIRED/i)).toBeVisible();
  });

  test('shows access denied on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401, body: '' }));
    await page.goto('/agent');
    await page.getByPlaceholder('Username').fill('wrong');
    await page.getByPlaceholder('Password').fill('creds');
    await page.getByRole('button', { name: /AUTHENTICATE/i }).click();
    await expect(page.getByText(/ACCESS DENIED/i)).toBeVisible();
  });

  test('valid credentials reach the support console with an empty queue', async ({ page }) => {
    await mockBackendOk(page);
    await page.goto('/agent');
    await page.getByPlaceholder('Username').fill('tillman');
    await page.getByPlaceholder('Password').fill('correct-horse');
    await page.getByRole('button', { name: /AUTHENTICATE/i }).click();
    await expect(page.getByText(/SUPPORT CONSOLE/i)).toBeVisible();
    await expect(page.getByText(/QUEUE CLEAR/i)).toBeVisible();
  });

  test('renders a queued session card and its E.D.I.T.H detail on select', async ({ page }) => {
    await mockBackendOk(page, {
      queue: [
        {
          sessionId: 'e2e-session-1',
          createdAt: '2026-09-07T16:00:00.000Z',
          customerName: 'Ada Lovelace',
          organizationName: 'Analytical Engine Co',
          osPlatform: 'Windows 11',
          issueDescription: 'Ringfencing is blocking Excel from opening a network share.',
          summary: {
            moduleClassification: 'Ringfencing',
            issueTypeClassification: 'Policy Misconfiguration',
            recommendedSteps: ['Check the Ringfencing policy scope', 'Add the share path to allowed storage'],
            suggestedKBArticles: ['Ringfencing network share access'],
            escalationRecommended: false,
            threatLevel: 'MEDIUM',
          },
        },
      ],
    });
    await page.goto('/agent');
    await page.getByPlaceholder('Username').fill('tillman');
    await page.getByPlaceholder('Password').fill('correct-horse');
    await page.getByRole('button', { name: /AUTHENTICATE/i }).click();
    await expect(page.getByText('ADA LOVELACE')).toBeVisible();
    await page.getByText('ADA LOVELACE').click();
    await expect(page.getByText(/CUSTOMER ISSUE/i)).toBeVisible();
    await expect(page.getByText(/ACCEPT SESSION/i)).toBeVisible();
    await expect(page.getByText('Policy Misconfiguration')).toBeVisible();
  });
});

test.describe('Analytics', () => {
  test('route renders the command analytics view', async ({ page }) => {
    await page.goto('/analytics');
    // Assert on a named control that only the analytics view renders, not a bare non-empty body.
    await expect(page.getByRole('button', { name: /BACK TO CONSOLE/i })).toBeVisible();
    // Agent names from the mock analytics dataset
    await expect(page.getByText(/Tillman/i).first()).toBeVisible();
  });
});
