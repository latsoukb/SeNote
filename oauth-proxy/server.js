/**
 * Échange OAuth Google (code → jeton) — le client_secret reste côté serveur.
 * Déployer sur Render (voir README).
 */
const http = require('http');

const PORT = Number(process.env.PORT || 3001);
const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://latsoukb.github.io')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOrigin = (origin) => {
  if (!origin) return ALLOWED_ORIGINS[0] || '*';
  if (ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o))) return origin;
  return null;
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });

const exchangeWithGoogle = async (params) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const server = http.createServer(async (req, res) => {
  const origin = corsOrigin(req.headers.origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, configured: Boolean(CLIENT_ID && CLIENT_SECRET) }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/google/token') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server_not_configured' }));
    return;
  }

  try {
    const body = await readBody(req);
    const params = new URLSearchParams();
    params.set('client_id', CLIENT_ID);
    params.set('client_secret', CLIENT_SECRET);

    if (body.grant_type === 'refresh_token') {
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', body.refresh_token || '');
    } else {
      params.set('grant_type', 'authorization_code');
      params.set('code', body.code || '');
      params.set('redirect_uri', body.redirect_uri || '');
      if (body.code_verifier) params.set('code_verifier', body.code_verifier);
    }

    const { status, data } = await exchangeWithGoogle(params);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message || 'bad_request' }));
  }
});

server.listen(PORT, () => {
  console.log(`SeNote OAuth proxy on :${PORT}`);
});
