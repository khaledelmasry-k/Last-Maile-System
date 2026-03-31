const base = process.env.API_BASE || 'http://localhost:3000';

async function j(url, options = {}) {
  const res = await fetch(`${base}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${url} -> ${res.status}: ${data.error || 'failed'}`);
  }
  return data;
}

async function run() {
  const login = await j('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@express.com', password: 'Admin@123', role: 'Admin' }),
  });

  const access = login.accessToken;
  const refresh = login.refreshToken;

  await j('/api/auth/me', { headers: { Authorization: `Bearer ${access}` } });
  await j('/api/shipments?page=1&limit=2', { headers: { Authorization: `Bearer ${access}` } });
  await j('/api/audit-logs?limit=5', { headers: { Authorization: `Bearer ${access}` } });

  const refreshed = await j('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  await j('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshed.accessToken}` },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  console.log('API smoke passed');
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
