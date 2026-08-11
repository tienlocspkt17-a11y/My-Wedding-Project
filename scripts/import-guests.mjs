import fs from 'node:fs/promises';
import path from 'node:path';

function parseEnv(source) {
  const result = {};
  for (const match of source.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    result[match[1]] = value;
  }
  return result;
}

const inputPath = process.argv[2];
const baseUrl = (process.argv[3] || 'https://my-wedding-project.locnguyenstudent2025ga.workers.dev').replace(/\/$/, '');
if (!inputPath) {
  console.error('Cách dùng: npm run guests:import -- guests.json [base-url]');
  process.exit(1);
}

const [inputSource, envSource] = await Promise.all([
  fs.readFile(path.resolve(inputPath), 'utf8'),
  fs.readFile(path.resolve('.env.production'), 'utf8'),
]);
const guests = JSON.parse(inputSource);
if (!Array.isArray(guests) || !guests.length) throw new Error('File khách cần là một JSON array không rỗng.');
const env = parseEnv(envSource);
if (!env.ADMIN_API_SECRET) throw new Error('.env.production chưa có ADMIN_API_SECRET.');

const created = [];
for (let index = 0; index < guests.length; index += 20) {
  const batch = guests.slice(index, index + 20);
  const response = await fetch(`${baseUrl}/api/admin/guests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.ADMIN_API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guests: batch }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Import thất bại (${response.status}).`);
  created.push(...(payload.guests || []));
}

console.log(`Đã tạo/cập nhật ${created.length} thiệp cá nhân:`);
created.forEach(guest => console.log(`${guest.displayName}: ${baseUrl}/invite/${guest.slug}`));
