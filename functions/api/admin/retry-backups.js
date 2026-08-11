import { ApiError, apiErrorResponse, json } from '../../_lib/http.js';
import { retryPendingBackups } from '../../_lib/sheets.js';

function authorize(request, env) {
  const expected = env.BACKUP_CRON_SECRET;
  const provided = request.headers.get('Authorization') || '';
  if (!expected || provided !== `Bearer ${expected}`) {
    throw new ApiError(401, 'Không có quyền thực hiện thao tác này.', 'unauthorized');
  }
}
export async function onRequestPost({ request, env }) {
  try {
    authorize(request, env);
    const result = await retryPendingBackups(env, 20);
    return json({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
