import { ApiError } from '../_lib/http.js';
import { getGuest } from '../_lib/firestore.js';
import { normalizeSlug, publicGuest } from '../_lib/validation.js';

function errorPage(status, title, message) {
  return new Response(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#f5f0e9;color:#493d39;font:16px/1.6 system-ui,sans-serif}.card{width:min(34rem,calc(100% - 3rem));padding:3rem 2rem;text-align:center;border:1px solid #d8c7bc;border-radius:1.5rem;background:#fffaf5;box-shadow:0 1rem 4rem #6a4b3a18}h1{font-family:Georgia,serif;font-size:clamp(2rem,7vw,3.5rem);font-weight:500;margin:.4rem 0 1rem}p{color:#74645e}</style><main class="card"><small>L &amp; B · 20.10.2026</small><h1>${title}</h1><p>${message}</p></main></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}

export async function onRequest(context) {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  try {
    const slug = normalizeSlug(context.params.slug);
    const guest = publicGuest(await getGuest(context.env, slug));
    if (!guest) return errorPage(404, 'Tấm thiệp không tồn tại', 'Vui lòng kiểm tra lại đường dẫn được gửi cho bạn.');

    const assetUrl = new URL('/invitation.html', context.request.url);
    const asset = await context.env.ASSETS.fetch(assetUrl);
    if (!asset.ok) throw new ApiError(502, 'Không thể tải nội dung thiệp.', 'invitation_asset_failed');
    const bootstrap = JSON.stringify({ slug, guest }).replace(/</g, '\\u003c');
    const html = (await asset.text()).replace('</head>', `<script id="invite-bootstrap" type="application/json">${bootstrap}</script></head>`);
    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return new Response(html, { status: 200, headers });
  } catch (error) {
    console.error(error);
    if (error?.status === 400 || error?.status === 404) {
      return errorPage(404, 'Tấm thiệp không tồn tại', 'Vui lòng kiểm tra lại đường dẫn được gửi cho bạn.');
    }
    return errorPage(503, 'Tấm thiệp đang nghỉ một chút', 'Vui lòng mở lại đường dẫn sau ít phút.');
  }
}
