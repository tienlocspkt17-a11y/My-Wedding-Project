import { ApiError, getClientIp } from './http.js';

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function enforceRateLimit(env, request, scope = 'request', limit = 5, bucketSeconds = 10 * 60) {
  if (!env.RATE_LIMIT || typeof env.RATE_LIMIT.get !== 'function') return;
  const ip = getClientIp(request) || 'unknown';
  const bucket = Math.floor(Date.now() / 1000 / bucketSeconds);
  const key = `${scope}:${await digest(`${env.RATE_LIMIT_SALT || 'wedding'}:${ip}`)}:${bucket}`;
  const current = Number(await env.RATE_LIMIT.get(key) || 0);
  if (current >= limit) {
    throw new ApiError(429, 'Bạn đã gửi hơi nhanh. Vui lòng thử lại sau ít phút.', 'rate_limited');
  }
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: bucketSeconds + 120 });
}

export function enforceWishRateLimit(env, request) {
  return enforceRateLimit(env, request, 'wish', 5, 10 * 60);
}

export async function verifyTurnstile(env, request, token) {
  if (!env.TURNSTILE_SECRET_KEY) return;
  if (!token) throw new ApiError(400, 'Vui lòng hoàn tất bước xác minh.', 'turnstile_required');
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', token);
  const ip = getClientIp(request);
  if (ip) form.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const result = await response.json().catch(() => ({}));
  if (!result.success) {
    throw new ApiError(400, 'Bước xác minh không thành công. Vui lòng thử lại.', 'turnstile_failed');
  }
}
