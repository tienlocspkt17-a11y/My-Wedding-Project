import { apiErrorResponse, ApiError, json } from '../../_lib/http.js';
import { syncGuestsFromSheet } from '../../_lib/guest-sync.js';

function authorize(request, env) {
  const expected = env.ADMIN_API_SECRET;
  if (!expected || request.headers.get('Authorization') !== `Bearer ${expected}`) {
    throw new ApiError(401, 'Không có quyền thực hiện thao tác này.', 'unauthorized');
  }
}

export async function onRequestPost({ request, env }) {
  try {
    authorize(request, env);
    const result = await syncGuestsFromSheet(env);
    return json({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
