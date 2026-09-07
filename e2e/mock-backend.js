// e2e/mock-backend.js — stubs the TL-Chat-Backend REST surface via Playwright route
// interception so E2E can exercise the frontend without a live backend.
//
// NOTE: SignalR (/chathub) negotiates a WebSocket and cannot be meaningfully stubbed here.
// These helpers cover the REST calls and the graceful-failure paths; full chat messaging
// requires the real or a protocol-accurate mock hub (see docs/TESTING.md).

/** Install happy-path REST stubs. Returns a record of what was called. */
export async function mockBackendOk(page, overrides = {}) {
  const calls = { login: 0, session: 0, queue: 0, rating: 0 };

  await page.route('**/api/auth/login', async (route) => {
    calls.login++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ displayName: overrides.displayName || 'Demo Agent', token: 'e2e.jwt.token' }),
    });
  });

  await page.route('**/api/chat/session', async (route) => {
    calls.session++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 'e2e-session-1' }),
    });
  });

  await page.route('**/api/chat/queue', async (route) => {
    calls.queue++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.queue || []),
    });
  });

  await page.route('**/api/chat/session/*/rating', async (route) => {
    calls.rating++;
    await route.fulfill({ status: 204, body: '' });
  });

  // SignalR negotiate — fail fast so the SPA takes its catch path deterministically.
  await page.route('**/chathub/**', (route) => route.abort());

  return calls;
}

/** Make every backend call fail, to test graceful degradation. */
export async function mockBackendDown(page) {
  await page.route('**/api/**', (route) => route.abort());
  await page.route('**/chathub/**', (route) => route.abort());
}
