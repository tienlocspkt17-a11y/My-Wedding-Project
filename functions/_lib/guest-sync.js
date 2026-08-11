import { ApiError } from './http.js';
import { getGuest, upsertGuest } from './firestore.js';
import { ensureSheetTab, readSheetRange, updateSheetRows } from './sheets.js';
import { cleanSingleLine, normalizeSlug } from './validation.js';
import {
  GUEST_SHEET_HEADERS,
  createGuestId,
  createGuestSlug,
  guestPresentation,
  invitationUrl,
  normalizeGuestDelivery,
  normalizeGuestStatus,
} from './guest-schema.js';

function guestRangeConfig(env) {
  const range = cleanSingleLine(env.GOOGLE_GUESTS_RANGE || 'Guests!A:I', 120);
  const match = range.match(/^([^!]+)!A:I$/i);
  if (!match) throw new ApiError(500, 'GOOGLE_GUESTS_RANGE cần có dạng Guests!A:I.', 'invalid_guests_range');
  return { range, sheet: match[1] };
}

function sameGuest(existing, desired) {
  if (!existing) return false;
  return ['guestId', 'displayName', 'salutation', 'personalMessage', 'partySize', 'group', 'delivery', 'active']
    .every(field => existing[field] === desired[field]);
}

async function chooseSlug(env, name, guestId, requestedSlug) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = requestedSlug && attempt === 0 ? normalizeSlug(requestedSlug) : createGuestSlug(name);
    const existing = await getGuest(env, slug);
    if (!existing || existing.guestId === guestId) return { slug, existing };
    // Cho phép chuyển dữ liệu cũ sang schema mới nếu tên thiệp vẫn trùng khớp.
    if (!existing.guestId && cleanSingleLine(existing.displayName, 100).toLowerCase().includes(cleanSingleLine(name, 100).toLowerCase())) {
      return { slug, existing };
    }
  }
  throw new ApiError(409, `Không thể tạo mã thiệp duy nhất cho ${name}.`, 'guest_slug_collision');
}

function rowValues(row) {
  return Array.from({ length: GUEST_SHEET_HEADERS.length }, (_, index) => cleanSingleLine(row[index] || '', index === 5 ? 300 : 160));
}

function headersAreValid(row) {
  return GUEST_SHEET_HEADERS.every((header, index) => cleanSingleLine(row[index] || '', 40).toLowerCase() === header);
}

function normalizedTimestamp(value, fallback) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

export async function syncGuestsFromSheet(env) {
  if (!env.GOOGLE_SHEETS_ID) return { skipped: true, reason: 'sheets_not_configured' };
  const { range, sheet } = guestRangeConfig(env);
  await ensureSheetTab(env, sheet);
  const rows = await readSheetRange(env, range);
  if (!rows.length) {
    await updateSheetRows(env, [{ range: `${sheet}!A1:I1`, values: GUEST_SHEET_HEADERS }]);
    return { initialized: true, processed: 0, updated: 0, physical: 0, errors: [] };
  }
  if (!headersAreValid(rows[0])) {
    throw new ApiError(400, `Dòng đầu tab ${sheet} phải là: ${GUEST_SHEET_HEADERS.join(', ')}`, 'invalid_guest_sheet_headers');
  }

  const baseUrl = env.PUBLIC_SITE_URL || 'https://my-wedding-project.locnguyenstudent2025ga.workers.dev';
  const updates = [];
  const errors = [];
  let processed = 0;
  let updated = 0;
  let physical = 0;
  const seenGuestIds = new Set();
  const seenSlugs = new Set();

  for (let index = 1; index < Math.min(rows.length, 1001); index += 1) {
    const source = rowValues(rows[index]);
    if (!source.some(Boolean)) continue;
    const rowNumber = index + 1;
    try {
      const [sourceGuestId, name, groupValue, deliveryValue, sourceSlug, , statusValue, sourceCreatedAt, sourceUpdatedAt] = source;
      if (!name) throw new ApiError(400, 'Thiếu name.', 'missing_guest_name');
      const presentation = guestPresentation(name, groupValue);
      const delivery = normalizeGuestDelivery(deliveryValue);
      const status = normalizeGuestStatus(statusValue);
      const guestId = sourceGuestId || createGuestId();
      if (seenGuestIds.has(guestId)) throw new ApiError(409, `guest_id ${guestId} bị trùng.`, 'duplicate_guest_id');
      seenGuestIds.add(guestId);
      const now = new Date().toISOString();
      const createdAt = normalizedTimestamp(sourceCreatedAt, now);
      let slug = sourceSlug;
      let url = '';
      let changed = !sourceGuestId || !sourceCreatedAt;

      if (delivery === 'physical') {
        physical += 1;
        if (sourceSlug) {
          const oldSlug = normalizeSlug(sourceSlug);
          const existing = await getGuest(env, oldSlug);
          if (existing && (existing.active !== false || existing.delivery !== 'physical')) {
            await upsertGuest(env, oldSlug, { active: false, delivery: 'physical' });
            updated += 1;
          }
        }
        if (sourceSlug) changed = true;
        slug = '';
      } else {
        const selected = await chooseSlug(env, name, guestId, sourceSlug);
        slug = selected.slug;
        if (seenSlugs.has(slug)) throw new ApiError(409, `slug ${slug} bị trùng.`, 'duplicate_guest_slug');
        seenSlugs.add(slug);
        url = invitationUrl(baseUrl, slug);
        const desired = {
          guestId,
          displayName: presentation.displayName,
          salutation: presentation.salutation,
          personalMessage: '',
          partySize: 1,
          group: presentation.group,
          delivery: 'online',
          active: status === 'active',
        };
        if (!sameGuest(selected.existing, desired)) {
          await upsertGuest(env, slug, {
            ...desired,
            ...(selected.existing ? {} : { createdAt: new Date(createdAt) }),
          });
          updated += 1;
          changed = true;
        }
      }

      processed += 1;
      const output = [guestId, name, presentation.group, delivery, slug, url, status, createdAt, changed ? now : normalizedTimestamp(sourceUpdatedAt, createdAt)];
      if (output.some((value, column) => value !== source[column])) {
        updates.push({ range: `${sheet}!A${rowNumber}:I${rowNumber}`, values: output });
      }
    } catch (error) {
      errors.push({ row: rowNumber, error: String(error?.message || error).slice(0, 180) });
    }
  }

  for (let index = 0; index < updates.length; index += 200) {
    await updateSheetRows(env, updates.slice(index, index + 200));
  }
  return { processed, updated, sheetRowsUpdated: updates.length, physical, errors };
}
