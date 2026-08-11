import { ApiError } from './http.js';

const tokenCache = new Map();
const encoder = new TextEncoder();

function base64Url(input) {
  const bytes = input instanceof Uint8Array ? input : encoder.encode(input);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodePem(privateKey) {
  const normalized = String(privateKey || '').replace(/\\n/g, '\n').trim();
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  if (!body) throw new ApiError(500, 'Thiếu khóa service account.', 'missing_google_credentials');
  const binary = atob(body);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function credentialsFromEnv(env) {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || env.FIREBASE_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new ApiError(500, 'Cloudflare chưa được cấu hình Google service account.', 'missing_google_credentials');
  }
  return { email, privateKey };
}

export async function getGoogleAccessToken(env, scopes) {
  const { email, privateKey } = credentialsFromEnv(env);
  const normalizedScopes = [...new Set(scopes)].sort().join(' ');
  const cacheKey = `${email}:${normalizedScopes}`;
  const cached = tokenCache.get(cacheKey);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 90) return cached.token;

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: email,
    scope: normalizedScopes,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    decodePem(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsignedToken));
  const assertion = `${unsignedToken}.${base64Url(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    console.error('Google OAuth error', response.status, payload?.error);
    throw new ApiError(502, 'Không thể xác thực dịch vụ lưu trữ.', 'google_auth_failed');
  }

  tokenCache.set(cacheKey, {
    token: payload.access_token,
    expiresAt: now + Math.max(300, Number(payload.expires_in) || 3600),
  });
  return payload.access_token;
}
