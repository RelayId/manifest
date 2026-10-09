import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve('data/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.schema === 1, 'schema must be 1');
assert(typeof manifest.generatedAt === 'string' && !Number.isNaN(Date.parse(manifest.generatedAt)), 'generatedAt must be an ISO date');

for (const [key, expectedPackage] of [['android', 'com.relayid.app'], ['wear', 'com.relayid.watch']]) {
  const item = manifest[key];
  assert(item && typeof item === 'object', `${key} entry is required`);
  assert(item.package === expectedPackage, `${key}.package must be ${expectedPackage}`);
  assert(Number.isInteger(item.versionCode) && item.versionCode >= 1, `${key}.versionCode must be a positive integer`);
  assert(typeof item.versionName === 'string' && item.versionName.length > 0, `${key}.versionName is required`);
  assert(typeof item.downloadUrl === 'string' && item.downloadUrl.startsWith('https://relayid.github.io/manifest/'), `${key}.downloadUrl must be the stable RelayId Pages download URL`);
  assert(typeof item.artifactUrl === 'string' && item.artifactUrl.startsWith('https://github.com/RelayId/'), `${key}.artifactUrl must be an approved HTTPS RelayId artifact URL`);
  assert(item.sha256 === undefined || (typeof item.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(item.sha256)), `${key}.sha256 must be a lowercase SHA-256 digest when present`);
  assert(Number.isInteger(item.minSupportedVersionCode) && item.minSupportedVersionCode >= 1, `${key}.minSupportedVersionCode must be a positive integer`);
  assert(typeof item.mandatory === 'boolean', `${key}.mandatory must be boolean`);
  assert(item.minSupportedVersionCode <= item.versionCode, `${key}.minSupportedVersionCode cannot exceed versionCode`);
}

console.log(`Validated RelayId update manifest: Android ${manifest.android.versionName} (${manifest.android.versionCode}), Wear ${manifest.wear.versionName} (${manifest.wear.versionCode})`);
