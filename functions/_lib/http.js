export class ApiError extends Error {
  constructor(status, message, code = 'request_failed') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function apiErrorResponse(error) {
  const status = Number(error?.status) || 500;
  const isPublic = status >= 400 && status < 500;
  if (!isPublic) console.error(error);
  return json({
    ok: false,
    error: isPublic ? error.message : 'Máy chủ đang bận. Vui lòng thử lại sau.',
    code: isPublic ? (error.code || 'request_failed') : 'internal_error',
  }, { status });
}

export function assertSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return;
  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new ApiError(403, 'Nguồn gửi yêu cầu không hợp lệ.', 'invalid_origin');
  }
  if (originUrl.host !== new URL(request.url).host) {
    throw new ApiError(403, 'Yêu cầu khác nguồn đã bị từ chối.', 'invalid_origin');
  }
}

export async function readJson(request, maxBytes = 12_000) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.toLowerCase().includes('application/json')) {
    throw new ApiError(415, 'Dữ liệu gửi lên phải có định dạng JSON.', 'invalid_content_type');
  }
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > maxBytes) {
    throw new ApiError(413, 'Dữ liệu gửi lên quá lớn.', 'payload_too_large');
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new ApiError(413, 'Dữ liệu gửi lên quá lớn.', 'payload_too_large');
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new ApiError(400, 'JSON không hợp lệ.', 'invalid_json');
  }
}

export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || '';
}
