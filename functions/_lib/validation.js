import { ApiError } from './http.js';

function normalizeString(value) {
  return typeof value === 'string' ? value.normalize('NFKC') : '';
}

function removeControlCharacters(value, preserveNewlines = false) {
  const pattern = preserveNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, '');
}

export function cleanSingleLine(value, maxLength) {
  return removeControlCharacters(normalizeString(value))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function cleanMessage(value, maxLength) {
  return removeControlCharacters(normalizeString(value), true)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function normalizeSlug(value) {
  const slug = cleanSingleLine(value, 80).toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])?$/.test(slug)) {
    throw new ApiError(400, 'Mã thiệp không hợp lệ.', 'invalid_invitation_slug');
  }
  return slug;
}

export function validateWish(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Dữ liệu lời chúc không hợp lệ.', 'invalid_wish');
  }
  if (cleanSingleLine(payload.website, 120)) {
    throw new ApiError(400, 'Không thể gửi lời chúc này.', 'spam_detected');
  }

  const name = cleanSingleLine(payload.name, 80);
  const message = cleanMessage(payload.message, 600);
  if (name.length < 2) {
    throw new ApiError(400, 'Tên người gửi cần có ít nhất 2 ký tự.', 'name_too_short');
  }
  if (message.length < 5) {
    throw new ApiError(400, 'Lời chúc cần có ít nhất 5 ký tự.', 'message_too_short');
  }

  const source = ['story', 'invitation'].includes(payload.source) ? payload.source : 'story';
  let guestSlug = '';
  if (payload.guestSlug) guestSlug = normalizeSlug(payload.guestSlug);

  return {
    name,
    message,
    source,
    guestSlug,
    website: '',
    turnstileToken: cleanSingleLine(payload.turnstileToken, 2048),
    clientRequestId: /^[a-zA-Z0-9_-]{8,80}$/.test(payload.clientRequestId || '') ? payload.clientRequestId : '',
  };
}

export function validateSongSuggestion(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Dữ liệu bài hát không hợp lệ.', 'invalid_song_suggestion');
  }
  if (cleanSingleLine(payload.website, 120)) {
    throw new ApiError(400, 'Không thể gửi gợi ý này.', 'spam_detected');
  }
  const title = cleanSingleLine(payload.title, 120);
  const artist = cleanSingleLine(payload.artist, 100);
  const reason = cleanMessage(payload.reason || '', 400);
  if (title.length < 2) throw new ApiError(400, 'Tên bài hát cần có ít nhất 2 ký tự.', 'song_title_too_short');
  if (artist.length < 2) throw new ApiError(400, 'Tên nghệ sĩ cần có ít nhất 2 ký tự.', 'song_artist_too_short');
  let guestSlug = '';
  if (payload.guestSlug) guestSlug = normalizeSlug(payload.guestSlug);
  return {
    title,
    artist,
    reason,
    guestSlug,
    turnstileToken: cleanSingleLine(payload.turnstileToken, 2048),
    clientRequestId: /^[a-zA-Z0-9_-]{8,80}$/.test(payload.clientRequestId || '') ? payload.clientRequestId : '',
  };
}

export function normalizePhotoContext(value) {
  const context = cleanSingleLine(value, 24).toLowerCase();
  if (!['story', 'wedding-day'].includes(context)) {
    throw new ApiError(400, 'Không gian ảnh không hợp lệ.', 'invalid_photo_context');
  }
  return context;
}

export function validatePhotoMetadata(payload) {
  if (cleanSingleLine(payload.website, 120)) {
    throw new ApiError(400, 'Không thể gửi ảnh này.', 'spam_detected');
  }
  const context = normalizePhotoContext(payload.context);
  const senderName = cleanSingleLine(payload.senderName || '', 80);
  const caption = cleanMessage(payload.caption || '', 300);
  let guestSlug = '';
  if (payload.guestSlug) guestSlug = normalizeSlug(payload.guestSlug);
  return {
    context,
    senderName,
    caption,
    guestSlug,
    turnstileToken: cleanSingleLine(payload.turnstileToken, 2048),
    clientRequestId: /^[a-zA-Z0-9_-]{8,80}$/.test(payload.clientRequestId || '') ? payload.clientRequestId : '',
  };
}

export function publicGuest(document) {
  if (!document || document.active === false) return null;
  const displayName = cleanSingleLine(document.displayName, 100);
  if (!displayName) return null;
  return {
    displayName,
    salutation: cleanSingleLine(document.salutation || displayName, 120),
    personalMessage: cleanMessage(document.personalMessage || '', 500),
    partySize: Number.isFinite(document.partySize) ? Math.max(1, Math.min(20, Math.round(document.partySize))) : null,
  };
}

export function escapeSheetCell(value) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
