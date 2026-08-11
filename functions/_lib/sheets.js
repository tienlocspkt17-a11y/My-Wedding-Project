import { getGoogleAccessToken } from './google-auth.js';
import { escapeSheetCell } from './validation.js';
import { listPendingBackupsForCollection, patchDocument, wishesCollection } from './firestore.js';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

async function appendRow(env, range, values) {
  if (!env.GOOGLE_SHEETS_ID) return false;
  const token = await getGoogleAccessToken(env, [SHEETS_SCOPE]);
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_ID)}/values/${encodeURIComponent(range)}:append`);
  url.searchParams.set('valueInputOption', 'RAW');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      majorDimension: 'ROWS',
      values: [values.map(escapeSheetCell)],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sheets append failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return true;
}

export async function readSheetRange(env, range) {
  if (!env.GOOGLE_SHEETS_ID) return [];
  const token = await getGoogleAccessToken(env, [SHEETS_SCOPE]);
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_ID)}/values/${encodeURIComponent(range)}`);
  url.searchParams.set('majorDimension', 'ROWS');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sheets read failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const payload = await response.json();
  return Array.isArray(payload.values) ? payload.values : [];
}

export async function updateSheetRows(env, updates) {
  if (!env.GOOGLE_SHEETS_ID || !updates.length) return false;
  const token = await getGoogleAccessToken(env, [SHEETS_SCOPE]);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_ID)}/values:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: updates.map(update => ({
        range: update.range,
        majorDimension: 'ROWS',
        values: [update.values.map(escapeSheetCell)],
      })),
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sheets batch update failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return true;
}

function appendWishToSheet(env, wish) {
  return appendRow(env, env.GOOGLE_SHEETS_RANGE || 'Wishes!A:G', [
    wish.createdAt || new Date().toISOString(), wish.name, wish.message, wish.source, wish.guestSlug, wish.id, 'published',
  ]);
}

function appendSongToSheet(env, song) {
  return appendRow(env, env.GOOGLE_SONGS_RANGE || 'Song Suggestions!A:G', [
    song.createdAt || new Date().toISOString(), song.title, song.artist, song.reason, song.guestSlug, song.id, song.status,
  ]);
}

function appendPhotoToSheet(env, photo) {
  return appendRow(env, env.GOOGLE_PHOTOS_RANGE || 'Photo Index!A:J', [
    photo.createdAt || new Date().toISOString(), photo.context, photo.senderName, photo.caption, photo.guestSlug,
    photo.id, photo.status, photo.objectKey, photo.contentType, photo.size,
  ]);
}

async function syncBackup(env, item, collection, append, label) {
  if (!env.GOOGLE_SHEETS_ID || !item?.id) return { synced: false, skipped: true };
  if (item.backupStatus === 'synced') return { synced: true, skipped: true };
  try {
    await append(env, item);
    await patchDocument(env, collection, item.id, { backupStatus: 'synced', backupSyncedAt: new Date(), backupError: '' });
    return { synced: true };
  } catch (error) {
    console.error(`${label} Google Sheets backup failed`, error);
    await patchDocument(env, collection, item.id, {
      backupStatus: 'pending',
      backupError: String(error?.message || error).slice(0, 300),
      backupAttemptedAt: new Date(),
    }).catch(patchError => console.error('Could not mark pending backup', patchError));
    return { synced: false, error: true };
  }
}

export async function syncWishBackup(env, wish) {
  return syncBackup(env, wish, wishesCollection(env), appendWishToSheet, 'Wish');
}

export function syncSongBackup(env, song) {
  return syncBackup(env, song, env.SONG_SUGGESTIONS_COLLECTION || 'songSuggestions', appendSongToSheet, 'Song');
}

export function syncPhotoBackup(env, photo) {
  return syncBackup(env, photo, env.PHOTOS_COLLECTION || 'photoSubmissions', appendPhotoToSheet, 'Photo');
}

export async function retryPendingBackups(env, limit = 10) {
  if (!env.GOOGLE_SHEETS_ID) return { attempted: 0, synced: 0 };
  const collections = [
    { name: wishesCollection(env), sync: syncWishBackup },
    { name: env.SONG_SUGGESTIONS_COLLECTION || 'songSuggestions', sync: syncSongBackup },
    { name: env.PHOTOS_COLLECTION || 'photoSubmissions', sync: syncPhotoBackup },
  ];
  const pending = [];
  for (const item of collections) {
    const documents = await listPendingBackupsForCollection(env, item.name, limit);
    documents.forEach(document => pending.push({ document, sync: item.sync }));
  }
  let synced = 0;
  for (const item of pending) {
    const result = await item.sync(env, item.document);
    if (result.synced) synced += 1;
  }
  return { attempted: pending.length, synced };
}
