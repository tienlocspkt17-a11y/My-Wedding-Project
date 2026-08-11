import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { validateWish, validateSongSuggestion, validatePhotoMetadata, normalizeSlug, publicGuest, escapeSheetCell } from '../functions/_lib/validation.js';
import { onRequestPost as submitWish } from '../functions/api/wishes.js';
import { weddingDayState } from '../functions/_lib/wedding-day.js';
import { guestPresentation, normalizeGuestDelivery, createGuestSlug, invitationUrl } from '../functions/_lib/guest-schema.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test('personalized invitation uses root-relative static assets', async () => {
  const html = await readFile(new URL('../invitation.html', import.meta.url), 'utf8');
  assert.match(html, /href="\/style\.css"/);
  assert.match(html, /src="\/api-client\.js"/);
  assert.doesNotMatch(html, /(?:href|src)="(?:style\.css|api-client\.js|nhac_nen\.mp3|images\/|index\.html)/);
});

test('valid photos publish immediately and the client prefers WebP compression', async () => {
  const [photoApi, client, story, index, invitation] = await Promise.all([
    readFile(new URL('../functions/api/photos.js', import.meta.url), 'utf8'),
    readFile(new URL('../api-client.js', import.meta.url), 'utf8'),
    readFile(new URL('../script.js', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../invitation.html', import.meta.url), 'utf8'),
  ]);
  assert.match(photoApi, /const status = 'published'/);
  assert.doesNotMatch(photoApi, /status = 'pending'/);
  assert.match(client, /canvasBlob\(canvas, 'image\/webp'/);
  assert.match(client, /canvasBlob\(canvas, 'image\/jpeg'/);
  assert.match(client, /maxOutputBytes\) \|\| 1_200_000/);
  assert.match(client, /wedding:turnstile-ready/);
  assert.match(index, /id="photo-upload-preview" hidden/);
  assert.match(invitation, /id="invite-live-preview" hidden/);
  assert.match(story, /wedding:turnstile-ready[^]*submitPendingPhoto/);
  assert.doesNotMatch(story + invitation, /chọn lại ảnh/);
  assert.doesNotMatch(story, /Ảnh đang chờ duyệt|ảnh sẽ xuất hiện sau khi được duyệt/);
});

test('validation cleans and bounds public input', () => {
  const wish = validateWish({
    name: '  Nguyễn   Văn A  ',
    message: ' Chúc hai bạn\r\n\r\n\r\ntrăm năm hạnh phúc! ',
    source: 'story',
  });
  assert.equal(wish.name, 'Nguyễn Văn A');
  assert.equal(wish.message, 'Chúc hai bạn\n\ntrăm năm hạnh phúc!');
  assert.equal(normalizeSlug('Gia-Dinh-Anh-7K3P9'), 'gia-dinh-anh-7k3p9');
  assert.throws(() => normalizeSlug('../admin'));
  assert.throws(() => validateWish({ name: 'A', message: 'Hi' }));
});

test('guest response exposes only invitation fields', () => {
  assert.deepEqual(publicGuest({
    displayName: 'Gia đình anh Minh',
    salutation: 'Gia đình anh Minh',
    personalMessage: 'Rất mong được gặp cả nhà.',
    partySize: 4,
    internalNote: 'Không được lộ',
    active: true,
  }), {
    displayName: 'Gia đình anh Minh',
    salutation: 'Gia đình anh Minh',
    personalMessage: 'Rất mong được gặp cả nhà.',
    partySize: 4,
  });
  assert.equal(publicGuest({ displayName: 'Khách', active: false }), null);
});

test('guest Sheet schema maps the four invitation groups safely', () => {
  assert.deepEqual(guestPresentation('  Minh  ', 'Bạn bè'), {
    name: 'Minh',
    group: 'friend',
    displayName: 'Bạn Minh',
    salutation: 'bạn Minh',
  });
  assert.equal(guestPresentation('Huy', 'anh').displayName, 'Anh Huy');
  assert.equal(guestPresentation('Lan', 'chị').salutation, 'chị Lan');
  assert.equal(guestPresentation('An', 'em').displayName, 'Em An');
  assert.equal(normalizeGuestDelivery('physical'), 'physical');
  assert.throws(() => guestPresentation('Khách', 'nguoi-lon'));
  assert.match(createGuestSlug('Nguyễn Thị Ánh'), /^nguyen-thi-anh-[a-z0-9]{6}$/);
  assert.equal(invitationUrl('https://wedding.example/', 'anh-minh-ab1234'), 'https://wedding.example/invite/anh-minh-ab1234');
});

test('sheet cells cannot become spreadsheet formulas', () => {
  assert.equal(escapeSheetCell('=IMPORTXML("x")'), '\'=IMPORTXML("x")');
  assert.equal(escapeSheetCell('+SUM(A1:A2)'), "'+SUM(A1:A2)");
  assert.equal(escapeSheetCell('Lời chúc bình thường'), 'Lời chúc bình thường');
});

test('song and photo submissions normalize public metadata', () => {
  assert.deepEqual(validateSongSuggestion({
    title: '  Perfect  ',
    artist: ' Ed   Sheeran ',
    reason: 'Bài hát đầu tiên.',
    guestSlug: 'Anh-Minh-7K3P9',
  }), {
    title: 'Perfect',
    artist: 'Ed Sheeran',
    reason: 'Bài hát đầu tiên.',
    guestSlug: 'anh-minh-7k3p9',
    turnstileToken: '',
    clientRequestId: '',
  });
  const photo = validatePhotoMetadata({ context: 'wedding-day', caption: '  Một khoảnh khắc  ', guestSlug: 'anh-minh-7k3p9' });
  assert.equal(photo.context, 'wedding-day');
  assert.equal(photo.caption, 'Một khoảnh khắc');
  assert.throws(() => validatePhotoMetadata({ context: 'unknown' }));
});

test('wedding day mode uses an explicit server-side time window', () => {
  const env = {
    WEDDING_DAY_START: '2026-10-20T00:00:00+07:00',
    WEDDING_DAY_END: '2026-10-21T06:00:00+07:00',
  };
  assert.equal(weddingDayState(env, Date.parse('2026-10-20T12:00:00+07:00')).active, true);
  assert.equal(weddingDayState(env, Date.parse('2026-10-19T23:59:59+07:00')).active, false);
  assert.equal(weddingDayState(env, Date.parse('2026-10-21T06:00:01+07:00')).active, false);
});

test('wish endpoint authenticates and writes a typed Firestore document', async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const base64 = Buffer.from(pkcs8).toString('base64').match(/.{1,64}/g).join('\n');
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
  const originalFetch = globalThis.fetch;
  let firestoreBody;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') {
      const form = new URLSearchParams(init.body);
      assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
      assert.equal(form.get('assertion').split('.').length, 3);
      return Response.json({ access_token: 'test-token', expires_in: 3600 });
    }
    if (url.includes('firestore.googleapis.com') && init.method === 'POST') {
      assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer test-token');
      firestoreBody = JSON.parse(init.body);
      const id = new URL(url).searchParams.get('documentId');
      return Response.json({
        name: `projects/demo/databases/(default)/documents/wishes/${id}`,
        fields: firestoreBody.fields,
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const request = new Request('https://wedding.example/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://wedding.example' },
      body: JSON.stringify({
        name: 'Người bạn',
        message: 'Chúc hai bạn luôn hạnh phúc.',
        source: 'story',
        clientRequestId: 'wish_test_12345',
      }),
    });
    const response = await submitWish({
      request,
      env: {
        FIREBASE_PROJECT_ID: 'demo',
        FIREBASE_DATABASE_ID: '(default)',
        GOOGLE_SERVICE_ACCOUNT_EMAIL: 'worker@example.iam.gserviceaccount.com',
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey,
      },
      waitUntil() {},
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.equal(payload.wish.name, 'Người bạn');
    assert.equal(firestoreBody.fields.message.stringValue, 'Chúc hai bạn luôn hạnh phúc.');
    assert.equal(firestoreBody.fields.createdAt.timestampValue.length > 10, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
