import { apiErrorResponse, assertSameOrigin, json, readJson } from '../_lib/http.js';
import { createWish, listWishes } from '../_lib/firestore.js';
import { enforceWishRateLimit, verifyTurnstile } from '../_lib/security.js';
import { retryPendingBackups, syncWishBackup } from '../_lib/sheets.js';
import { validateWish } from '../_lib/validation.js';

export async function onRequestGet({ request, env }) {
  try {
    const limit = Number(new URL(request.url).searchParams.get('limit') || 40);
    const items = await listWishes(env, limit);
    return json({ ok: true, items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    assertSameOrigin(request);
    const payload = validateWish(await readJson(request));
    await verifyTurnstile(env, request, payload.turnstileToken);
    await enforceWishRateLimit(env, request);
    const wish = await createWish(env, payload);

    if (env.GOOGLE_SHEETS_ID) {
      context.waitUntil((async () => {
        await syncWishBackup(env, wish);
        await retryPendingBackups(env, 2);
      })());
    }

    return json({
      ok: true,
      wish: {
        id: wish.id,
        name: wish.name,
        text: wish.message,
        createdAt: wish.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
