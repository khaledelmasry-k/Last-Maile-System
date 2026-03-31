import { test, expect } from '@playwright/test';

test('auth lifecycle: login -> me -> refresh -> logout', async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    data: { email: 'dispatcher@express.com', password: 'Dispatch@123', role: 'Dispatcher' },
  });
  expect(login.ok()).toBeTruthy();
  const loginBody = await login.json();

  const me = await request.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${loginBody.accessToken}` },
  });
  expect(me.ok()).toBeTruthy();

  const refresh = await request.post('/api/auth/refresh', {
    data: { refreshToken: loginBody.refreshToken },
  });
  expect(refresh.ok()).toBeTruthy();
  const refreshBody = await refresh.json();

  const logout = await request.post('/api/auth/logout', {
    headers: { Authorization: `Bearer ${refreshBody.accessToken}` },
    data: { refreshToken: loginBody.refreshToken },
  });
  expect(logout.ok()).toBeTruthy();
});

test('admin can view audit logs endpoint', async ({ request }) => {
  const login = await request.post('/api/auth/login', {
    data: { email: 'admin@express.com', password: 'Admin@123', role: 'Admin' },
  });
  expect(login.ok()).toBeTruthy();
  const body = await login.json();

  const audit = await request.get('/api/audit-logs?limit=5', {
    headers: { Authorization: `Bearer ${body.accessToken}` },
  });
  expect(audit.ok()).toBeTruthy();
});
