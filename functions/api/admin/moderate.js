import { ApiError, apiErrorResponse, json, readJson } from '../../_lib/http.js';
import { getDocument, patchDocument } from '../../_lib/firestore.js';
import { cleanSingleLine } from '../../_lib/validation.js';

function authorize(request, env) {
  const expected = env.ADMIN_API_SECRET;
  if (!expected || request.headers.get('Authorization') !== `Bearer ${expected}`) {
    throw new ApiError(401, 'Không có quyền thực hiện thao tác này.', 'unauthorized');
  }
}

export async function onRequestPost({ request, env }) {
  try {
    authorize(request, env);
    const payload = await readJson(request, 8_000);
    const type = cleanSingleLine(payload.type, 20);
    const id = cleanSingleLine(payload.id, 80);
    const status = cleanSingleLine(payload.status, 20);
    if (!['song', 'photo'].includes(type) || !/^[a-zA-Z0-9_-]{8,80}$/.test(id) || !['published', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Yêu cầu duyệt không hợp lệ.', 'invalid_moderation_request');
    }
    const collection = type === 'song'
      ? (env.SONG_SUGGESTIONS_COLLECTION || 'songSuggestions')
      : (env.PHOTOS_COLLECTION || 'photoSubmissions');
    const existing = await getDocument(env, collection, id);
    if (!existing) throw new ApiError(404, 'Không tìm thấy nội dung cần duyệt.', 'submission_not_found');
    const updates = { status, updatedAt: new Date() };
    if (type === 'photo' && status === 'rejected' && existing.objectKey && env.PHOTO_BUCKET) {
      await env.PHOTO_BUCKET.delete(existing.objectKey);
      updates.objectKey = '';
    }
    const updated = await patchDocument(env, collection, id, updates);
    return json({ ok: true, item: { id: updated.id, type, status: updated.status } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
