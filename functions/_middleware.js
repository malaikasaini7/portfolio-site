// Portfolio password gate - ported 1:1 from the Netlify edge-function build.
// Cookie-authed requests pass through to static assets; everything else gets gate.html.
const COOKIE_NAME = 'site_gate';
const SALT = 'msaini-portfolio-gate-v1';

// Password arrives via Pages secret/variable GATE_PASSWORD (fallback for preview only)
async function expectedToken(password) {
  const data = new TextEncoder().encode(SALT + ':' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hasAuthCookie(request, token) {
  const header = request.headers.get('Cookie') || '';
  return header.split(';').map(c => c.trim()).includes(COOKIE_NAME + '=' + token);
}

async function gateResponse(env, url, showError, status) {
  const res = await env.ASSETS.fetch(new URL('/gate.html', url.origin));
  let html = await res.text();
  if (showError) html = html.replace('</style>', '  .err { display: block !important; }\n</style>');
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const password = env.GATE_PASSWORD;
  // No password configured -> gate disabled (local preview / fork).
  if (!password) return next();
  const token = await expectedToken(password);

  if (hasAuthCookie(request, token)) return next();

  if (request.method === 'POST') {
    try {
      const form = await request.formData();
      if ((form.get('password') || '') === password) {
        return new Response(null, {
          status: 303,
          headers: {
            'Location': url.pathname === '/' ? '/' : url.pathname,
            'Set-Cookie': COOKIE_NAME + '=' + token + '; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax',
            'Cache-Control': 'no-store',
          },
        });
      }
    } catch (e) { /* fall through to error gate */ }
    return gateResponse(env, url, true, 401);
  }

  return gateResponse(env, url, false, 200);
}
