import { json } from '../_lib/http.js';
import { weddingDayState } from '../_lib/wedding-day.js';

export function onRequestGet({ env }) {
  const weddingDay = weddingDayState(env);
  return json({
    ok: true,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || '',
    weddingDay,
  });
}
