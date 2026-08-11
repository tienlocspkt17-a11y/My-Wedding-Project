import { ApiError, apiErrorResponse, assertSameOrigin, json } from '../_lib/http.js';
import { createDocument, getDocument, getGuest, runQuery } from '../_lib/firestore.js';
import { enforceRateLimit, verifyTurnstile } from '../_lib/security.js';
import { normalizePhotoContext, validatePhotoMetadata } from '../_lib/validation.js';
import { weddingDayState } from '../_lib/wedding-day.js';
import { syncPhotoBackup } from '../_lib/sheets.js';

const MAX_PHOTO_BYTES = 2_500_000;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', { extension: 'jpg', signature: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ['image/png', { extension: 'png', signature: bytes => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 }],
  ['image/webp', { extension: 'webp', signature: bytes => String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' }],
]);

function collection(env) {
  return env.PHOTOS_COLLECTION || 'photoSubmissions';
}

function publicPhoto(item) {
  return {
    id: item.id,
    context: item.context,
    senderName: item.senderName || '',
    caption: item.caption || '',
    createdAt: item.createdAt,
    url: `/api/photos/${encodeURIComponent(item.id)}/content`,
  };
}

function ensurePhotoBucket(env) {
  if (!env.PHOTO_BUCKET || typeof env.PHOTO_BUCKET.put !== 'function') {
    throw new ApiError(503, 'Kho ảnh chưa sẵn sàng.', 'photo_storage_unavailable');
  }
}

async function validWeddingGuest(env, slug) {
  if (!slug) return false;
  const guest = await getGuest(env, slug);
  return Boolean(guest && guest.active !== false && guest.displayName);
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const context = normalizePhotoContext(url.searchParams.get('context') || 'story');
    const limit = Math.max(1, Math.min(40, Number(url.searchParams.get('limit')) || 16));
    const documents = await runQuery(env, {
      from: [{ collectionId: collection(env) }],
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      limit: limit * 3,
    });
    const items = documents.filter(item => item.status === 'published' && item.context === context).slice(0, limit).map(publicPhoto);
    return json({ ok: true, items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let objectKey = '';
  try {
    assertSameOrigin(request);
    ensurePhotoBucket(env);
    const declaredLength = Number(request.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_PHOTO_BYTES + 120_000) throw new ApiError(413, 'Ảnh vượt quá dung lượng cho phép.', 'photo_too_large');
    const type = request.headers.get('Content-Type') || '';
    if (!type.toLowerCase().includes('multipart/form-data')) throw new ApiError(415, 'Ảnh phải được gửi bằng multipart form.', 'invalid_content_type');
    const form = await request.formData();
    const payload = validatePhotoMetadata(Object.fromEntries(form.entries()));
    const file = form.get('photo');
    if (!file || typeof file.arrayBuffer !== 'function') throw new ApiError(400, 'Vui lòng chọn một ảnh.', 'missing_photo');
    if (!file.size || file.size > MAX_PHOTO_BYTES) throw new ApiError(413, 'Ảnh cần nhỏ hơn 2,5 MB.', 'photo_too_large');
    const format = ALLOWED_TYPES.get(String(file.type || '').toLowerCase());
    if (!format) throw new ApiError(415, 'Chỉ hỗ trợ JPG, PNG hoặc WebP.', 'unsupported_photo_type');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!format.signature(bytes)) throw new ApiError(415, 'Nội dung tệp không đúng định dạng ảnh.', 'invalid_photo_signature');
    await verifyTurnstile(env, request, payload.turnstileToken);
    await enforceRateLimit(env, request, `photo-${payload.context}`, payload.context === 'wedding-day' ? 8 : 3, 60 * 60);

    const status = 'published';
    if (payload.context === 'wedding-day') {
      if (!weddingDayState(env).active) throw new ApiError(403, 'Live Photo chỉ mở trong ngày cưới.', 'wedding_day_closed');
      if (!(await validWeddingGuest(env, payload.guestSlug))) throw new ApiError(403, 'Đường dẫn thiệp chưa được xác thực.', 'invitation_required');
    }

    const id = crypto.randomUUID();
    const date = new Date().toISOString().slice(0, 7);
    objectKey = `${payload.context}/${date}/${id}.${format.extension}`;
    await env.PHOTO_BUCKET.put(objectKey, bytes, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { context: payload.context, submissionId: id },
      sha256: await crypto.subtle.digest('SHA-256', bytes),
    });
    const document = await createDocument(env, collection(env), id, {
      context: payload.context,
      senderName: payload.senderName,
      caption: payload.caption,
      guestSlug: payload.guestSlug,
      status,
      objectKey,
      contentType: file.type,
      size: file.size,
      backupStatus: env.GOOGLE_SHEETS_ID ? 'pending' : 'disabled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (env.GOOGLE_SHEETS_ID) context.waitUntil(syncPhotoBackup(env, document));
    return json({ ok: true, photo: { ...publicPhoto(document), status } }, { status: 201 });
  } catch (error) {
    if (objectKey) await env.PHOTO_BUCKET.delete(objectKey).catch(() => {});
    return apiErrorResponse(error);
  }
}

export async function onRequestContent({ params, env }) {
  try {
    ensurePhotoBucket(env);
    const id = String(params.id || '');
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) throw new ApiError(404, 'Không tìm thấy ảnh.', 'photo_not_found');
    const document = await getDocument(env, collection(env), id);
    if (!document || document.status !== 'published' || !document.objectKey) throw new ApiError(404, 'Không tìm thấy ảnh.', 'photo_not_found');
    const object = await env.PHOTO_BUCKET.get(document.objectKey);
    if (!object) throw new ApiError(404, 'Không tìm thấy ảnh.', 'photo_not_found');
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(object.body, { headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
