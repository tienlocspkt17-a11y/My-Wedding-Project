import { ApiError } from './http.js';
import { cleanSingleLine, normalizeSlug } from './validation.js';

export const GUEST_SHEET_HEADERS = [
  'guest_id',
  'name',
  'group',
  'delivery',
  'slug',
  'invite_url',
  'status',
  'created_at',
  'updated_at',
];

const GROUP_ALIASES = new Map([
  ['friend', 'friend'],
  ['ban', 'friend'],
  ['ban be', 'friend'],
  ['anh', 'anh'],
  ['chi', 'chi'],
  ['em', 'em'],
]);

function foldVietnamese(value) {
  return cleanSingleLine(value, 80)
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeGuestGroup(value) {
  const group = GROUP_ALIASES.get(foldVietnamese(value));
  if (!group) {
    throw new ApiError(400, 'Nhóm khách chỉ nhận friend, anh, chi hoặc em.', 'invalid_guest_group');
  }
  return group;
}

export function normalizeGuestDelivery(value) {
  const delivery = foldVietnamese(value || 'online');
  if (!['online', 'physical'].includes(delivery)) {
    throw new ApiError(400, 'Hình thức thiệp chỉ nhận online hoặc physical.', 'invalid_guest_delivery');
  }
  return delivery;
}

export function normalizeGuestStatus(value) {
  const status = foldVietnamese(value || 'active');
  if (!['active', 'disabled'].includes(status)) {
    throw new ApiError(400, 'Trạng thái khách chỉ nhận active hoặc disabled.', 'invalid_guest_status');
  }
  return status;
}

export function guestPresentation(nameValue, groupValue) {
  const name = cleanSingleLine(nameValue, 100);
  if (!name) throw new ApiError(400, 'Khách chưa có tên hiển thị.', 'missing_guest_name');
  const group = normalizeGuestGroup(groupValue);
  const prefix = group === 'friend' ? 'Bạn' : group === 'chi' ? 'Chị' : group === 'anh' ? 'Anh' : 'Em';
  return {
    name,
    group,
    displayName: `${prefix} ${name}`,
    salutation: `${prefix.toLowerCase()} ${name}`,
  };
}

export function slugifyGuestName(name) {
  const base = foldVietnamese(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'khach-moi';
}

function randomToken(length = 6) {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

export function createGuestId() {
  return `G-${randomToken(10)}`;
}

export function createGuestSlug(name) {
  return normalizeSlug(`${slugifyGuestName(name)}-${randomToken(6)}`);
}

export function invitationUrl(baseUrl, slug) {
  const normalizedBase = cleanSingleLine(baseUrl, 300).replace(/\/+$/, '');
  if (!/^https?:\/\//.test(normalizedBase)) {
    throw new ApiError(500, 'Thiếu PUBLIC_SITE_URL hợp lệ.', 'missing_public_site_url');
  }
  return `${normalizedBase}/invite/${normalizeSlug(slug)}`;
}
