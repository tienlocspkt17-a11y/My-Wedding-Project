import { apiErrorResponse, ApiError, json } from '../../_lib/http.js';
import { getGuest } from '../../_lib/firestore.js';
import { normalizeSlug, publicGuest } from '../../_lib/validation.js';

export async function onRequestGet({ env, params }) {
  try {
    const slug = normalizeSlug(params.slug);
    const guest = publicGuest(await getGuest(env, slug));
    if (!guest) throw new ApiError(404, 'Không tìm thấy tấm thiệp này.', 'invitation_not_found');
    return json({ ok: true, slug, guest });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
