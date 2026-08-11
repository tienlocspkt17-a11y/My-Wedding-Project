import { ApiError, apiErrorResponse, json, readJson } from '../../_lib/http.js';
import { upsertGuest } from '../../_lib/firestore.js';
import { cleanMessage, cleanSingleLine, normalizeSlug } from '../../_lib/validation.js';

function authorize(request, env) {
  const expected = env.ADMIN_API_SECRET;
  if (!expected || request.headers.get('Authorization') !== `Bearer ${expected}`) {
    throw new ApiError(401, 'Không có quyền thực hiện thao tác này.', 'unauthorized');
  }
}

export async function onRequestPost({ request, env }) {
  try {
    authorize(request, env);
    const payload = await readJson(request, 50_000);
    if (!Array.isArray(payload.guests) || payload.guests.length < 1 || payload.guests.length > 20) {
      throw new ApiError(400, 'Mỗi lần cần gửi từ 1 đến 20 khách.', 'invalid_guest_batch');
    }
    const results = [];
    for (const item of payload.guests) {
      const slug = normalizeSlug(item.slug);
      const displayName = cleanSingleLine(item.displayName, 100);
      if (!displayName) throw new ApiError(400, `Khách ${slug} chưa có tên hiển thị.`, 'missing_guest_name');
      const guest = await upsertGuest(env, slug, {
        displayName,
        salutation: cleanSingleLine(item.salutation || displayName, 120),
        personalMessage: cleanMessage(item.personalMessage || '', 500),
        partySize: Math.max(1, Math.min(20, Number(item.partySize) || 1)),
        active: item.active !== false,
      });
      results.push({ slug, displayName: guest.displayName });
    }
    return json({ ok: true, guests: results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
