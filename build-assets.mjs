import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = new URL('.', import.meta.url);
const outputDirectory = new URL('./dist/', projectRoot);
const publicFiles = [
  'index.html',
  'invitation.html',
  'style.css',
  'script.js',
  'api-client.js',
  'nhac_nen.mp3',
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of publicFiles) {
  await cp(new URL(file, projectRoot), new URL(file, outputDirectory));
}
await cp(new URL('./images/', projectRoot), new URL('./images/', outputDirectory), { recursive: true });

console.log(`Built static assets in ${resolve(outputDirectory.pathname)}.`);
