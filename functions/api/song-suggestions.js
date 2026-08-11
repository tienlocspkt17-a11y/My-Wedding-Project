import { ApiError, apiErrorResponse, assertSameOrigin, json, readJson } from '../_lib/http.js';
import { createDocument, getDocument, runQuery } from '../_lib/firestore.js';
import { enforceRateLimit, verifyTurnstile } from '../_lib/security.js';
import { validateSongSuggestion } from '../_lib/validation.js';
import { syncSongBackup } from '../_lib/sheets.js';

function collection(env) {
  return env.SONG_SUGGESTIONS_COLLECTION || 'songSuggestions';
}

function publicSong(item) {
  return { id: item.id, title: item.title, artist: item.artist, reason: item.reason || '', createdAt: item.createdAt };
}

export async function onRequestGet({ request, env }) {
  try {
    const limit = Math.max(1, Math.min(30, Number(new URL(request.url).searchParams.get('limit')) || 12));
    const documents = await runQuery(env, {
      from: [{ collectionId: collection(env) }],
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      limit: limit * 3,
    });
    return json({ ok: true, items: documents.filter(item => item.status === 'published').slice(0, limit).map(publicSong) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    assertSameOrigin(request);
    const payload = validateSongSuggestion(await readJson(request));
    await verifyTurnstile(env, request, payload.turnstileToken);
    await enforceRateLimit(env, request, 'song', 4, 30 * 60);
    const id = payload.clientRequestId || crypto.randomUUID();
    let song;
    try {
      song = await createDocument(env, collection(env), id, {
        title: payload.title,
        artist: payload.artist,
        reason: payload.reason,
        guestSlug: payload.guestSlug,
        status: 'pending',
        backupStatus: env.GOOGLE_SHEETS_ID ? 'pending' : 'disabled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error?.code !== 'document_exists' || !payload.clientRequestId) throw error;
      song = await getDocument(env, collection(env), id);
      if (!song) throw new ApiError(409, 'Gợi ý này đã tồn tại.', 'document_exists');
    }
    if (env.GOOGLE_SHEETS_ID) context.waitUntil(syncSongBackup(env, song));
    return json({ ok: true, suggestion: { ...publicSong(song), status: song.status } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
