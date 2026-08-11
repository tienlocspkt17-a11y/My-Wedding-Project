import { json } from '../_lib/http.js';

export function onRequestGet({ env }) {
  return json({
    ok: true,
    service: 'wedding-api',
    firestoreConfigured: Boolean(env.FIREBASE_PROJECT_ID && (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || env.FIREBASE_CLIENT_EMAIL)),
    sheetsConfigured: Boolean(env.GOOGLE_SHEETS_ID),
    photoStorageConfigured: Boolean(env.PHOTO_BUCKET),
    rateLimitConfigured: Boolean(env.RATE_LIMIT),
    turnstileConfigured: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY),
  });
}
