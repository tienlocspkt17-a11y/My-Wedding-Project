import { ApiError } from './http.js';
import { getGoogleAccessToken } from './google-auth.js';

const DATASTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

function config(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new ApiError(500, 'Thiếu FIREBASE_PROJECT_ID.', 'missing_firebase_project');
  return {
    projectId,
    databaseId: env.FIREBASE_DATABASE_ID || '(default)',
    wishesCollection: env.WISHES_COLLECTION || 'wishes',
    guestsCollection: env.GUESTS_COLLECTION || 'guests',
  };
}

function documentRoot(env) {
  const { projectId, databaseId } = config(env);
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
}

function objectToFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') return { mapValue: { fields: objectToFields(value) } };
  return { stringValue: String(value) };
}

function fromFirestoreValue(value = {}) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return fieldsToObject(value.mapValue.fields || {});
  return null;
}

function fieldsToObject(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function parseDocument(document) {
  if (!document) return null;
  return {
    id: document.name?.split('/').pop() || '',
    ...fieldsToObject(document.fields || {}),
  };
}

async function firestoreFetch(env, path, init = {}) {
  const token = await getGoogleAccessToken(env, [DATASTORE_SCOPE]);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json; charset=utf-8');
  const response = await fetch(`${documentRoot(env)}${path}`, { ...init, headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text();
    console.error('Firestore error', response.status, detail.slice(0, 500));
    if (response.status === 409) {
      throw new ApiError(409, 'Dữ liệu này đã tồn tại.', 'document_exists');
    }
    throw new ApiError(502, 'Không thể truy cập cơ sở dữ liệu.', 'firestore_failed');
  }
  if (response.status === 204) return {};
  return response.json();
}

export async function getDocument(env, collection, id) {
  const payload = await firestoreFetch(env, `/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
  return parseDocument(payload);
}

export async function createDocument(env, collection, id, data) {
  const query = new URLSearchParams({ documentId: id });
  const payload = await firestoreFetch(env, `/${encodeURIComponent(collection)}?${query}`, {
    method: 'POST',
    body: JSON.stringify({ fields: objectToFields(data) }),
  });
  return parseDocument(payload);
}

export async function patchDocument(env, collection, id, data) {
  const query = new URLSearchParams();
  Object.keys(data).forEach(field => query.append('updateMask.fieldPaths', field));
  const payload = await firestoreFetch(env, `/${encodeURIComponent(collection)}/${encodeURIComponent(id)}?${query}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: objectToFields(data) }),
  });
  return parseDocument(payload);
}

export async function runQuery(env, structuredQuery) {
  const payload = await firestoreFetch(env, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({ structuredQuery }),
  });
  return (payload || []).map(row => parseDocument(row.document)).filter(Boolean);
}

export async function listWishes(env, requestedLimit = 40) {
  const { wishesCollection } = config(env);
  const envLimit = Math.max(1, Math.min(100, Number(env.MAX_WISHES) || 40));
  const limit = Math.max(1, Math.min(envLimit, Number(requestedLimit) || envLimit));
  const documents = await runQuery(env, {
    from: [{ collectionId: wishesCollection }],
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
    limit: limit * 2,
  });
  return documents
    .filter(item => item.status === 'published')
    .slice(0, limit)
    .map(item => ({ id: item.id, name: item.name, text: item.message, createdAt: item.createdAt }));
}

export async function createWish(env, wish) {
  const { wishesCollection } = config(env);
  const id = wish.clientRequestId || crypto.randomUUID();
  const now = new Date();
  try {
    return await createDocument(env, wishesCollection, id, {
      name: wish.name,
      message: wish.message,
      source: wish.source,
      guestSlug: wish.guestSlug,
      status: 'published',
      backupStatus: env.GOOGLE_SHEETS_ID ? 'pending' : 'disabled',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Client giữ nguyên request ID khi retry, nên một POST mất response không tạo trùng lời chúc.
    if (error?.code === 'document_exists' && wish.clientRequestId) {
      const existing = await getDocument(env, wishesCollection, id);
      if (existing) return existing;
    }
    throw error;
  }
}

export async function getGuest(env, slug) {
  const { guestsCollection } = config(env);
  return getDocument(env, guestsCollection, slug);
}

export async function upsertGuest(env, slug, guest) {
  const { guestsCollection } = config(env);
  return patchDocument(env, guestsCollection, slug, {
    ...guest,
    updatedAt: new Date(),
  });
}

export async function listPendingBackups(env, limit = 10) {
  const { wishesCollection } = config(env);
  return listPendingBackupsForCollection(env, wishesCollection, limit);
}

export async function listPendingBackupsForCollection(env, collection, limit = 10) {
  return runQuery(env, {
    from: [{ collectionId: collection }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'backupStatus' },
        op: 'EQUAL',
        value: { stringValue: 'pending' },
      },
    },
    limit: Math.max(1, Math.min(25, Number(limit) || 10)),
  });
}

export function wishesCollection(env) {
  return config(env).wishesCollection;
}
