import { json } from './functions/_lib/http.js';
import { onRequestGet as getConfig } from './functions/api/config.js';
import { onRequestGet as getHealth } from './functions/api/health.js';
import { onRequestGet as getWishes, onRequestPost as postWish } from './functions/api/wishes.js';
import { onRequestGet as getSongs, onRequestPost as postSong } from './functions/api/song-suggestions.js';
import { onRequestContent as getPhotoContent, onRequestGet as getPhotos, onRequestPost as postPhoto } from './functions/api/photos.js';
import { onRequestGet as getInvitation } from './functions/api/invitations/[slug].js';
import { onRequestPost as retryBackups } from './functions/api/admin/retry-backups.js';
import { onRequestPost as upsertGuests } from './functions/api/admin/guests.js';
import { onRequestPost as moderateSubmission } from './functions/api/admin/moderate.js';
import { onRequest as renderInvitation } from './functions/invite/[slug].js';

function functionContext(request, env, executionContext, params = {}) {
  return {
    request,
    env,
    params,
    waitUntil(promise) { executionContext.waitUntil(promise); },
    passThroughOnException() { executionContext.passThroughOnException?.(); },
  };
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function methodNotAllowed(allowed) {
  return json({ ok: false, error: 'Phương thức không được hỗ trợ.', code: 'method_not_allowed' }, {
    status: 405,
    headers: { Allow: allowed.join(', ') },
  });
}

async function routeApi(request, env, executionContext, url) {
  const context = functionContext(request, env, executionContext);
  if (url.pathname === '/api/config') {
    return request.method === 'GET' ? getConfig(context) : methodNotAllowed(['GET']);
  }
  if (url.pathname === '/api/health') {
    return request.method === 'GET' ? getHealth(context) : methodNotAllowed(['GET']);
  }
  if (url.pathname === '/api/wishes') {
    if (request.method === 'GET') return getWishes(context);
    if (request.method === 'POST') return postWish(context);
    return methodNotAllowed(['GET', 'POST']);
  }
  if (url.pathname === '/api/song-suggestions') {
    if (request.method === 'GET') return getSongs(context);
    if (request.method === 'POST') return postSong(context);
    return methodNotAllowed(['GET', 'POST']);
  }
  if (url.pathname === '/api/photos') {
    if (request.method === 'GET') return getPhotos(context);
    if (request.method === 'POST') return postPhoto(context);
    return methodNotAllowed(['GET', 'POST']);
  }
  const photoContentMatch = url.pathname.match(/^\/api\/photos\/([a-zA-Z0-9_-]{8,80})\/content\/?$/);
  if (photoContentMatch) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed(['GET', 'HEAD']);
    return getPhotoContent(functionContext(request, env, executionContext, { id: photoContentMatch[1] }));
  }

  const invitationMatch = url.pathname.match(/^\/api\/invitations\/([^/]+)\/?$/);
  if (invitationMatch) {
    if (request.method !== 'GET') return methodNotAllowed(['GET']);
    return getInvitation(functionContext(request, env, executionContext, { slug: decodeURIComponent(invitationMatch[1]) }));
  }
  if (url.pathname === '/api/admin/retry-backups') {
    return request.method === 'POST' ? retryBackups(context) : methodNotAllowed(['POST']);
  }
  if (url.pathname === '/api/admin/guests') {
    return request.method === 'POST' ? upsertGuests(context) : methodNotAllowed(['POST']);
  }
  if (url.pathname === '/api/admin/moderate') {
    return request.method === 'POST' ? moderateSubmission(context) : methodNotAllowed(['POST']);
  }
  return json({ ok: false, error: 'Không tìm thấy API.', code: 'not_found' }, { status: 404 });
}

export default {
  async fetch(request, env, executionContext) {
    const url = new URL(request.url);
    let response;

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      response = new Response(null, {
        status: 204,
        headers: { Allow: 'GET, HEAD, POST, OPTIONS', 'Cache-Control': 'no-store' },
      });
    } else if (url.pathname.startsWith('/api/')) {
      response = await routeApi(request, env, executionContext, url);
    } else {
      const inviteMatch = url.pathname.match(/^\/invite\/([^/]+)\/?$/);
      if (inviteMatch) {
        response = await renderInvitation(functionContext(request, env, executionContext, {
          slug: decodeURIComponent(inviteMatch[1]),
        }));
      } else {
        response = await env.ASSETS.fetch(request);
      }
    }

    return withSecurityHeaders(response);
  },
};
