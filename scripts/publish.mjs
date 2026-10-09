import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const eventType = process.env.EVENT_TYPE;
const payload = JSON.parse(process.env.PAYLOAD || '{}');
const target = eventType === 'publish-android' ? 'android' : eventType === 'publish-wear' ? 'wear' : null;

if (!target) throw new Error(`Unsupported dispatch event: ${eventType}`);

const required = ['package', 'versionCode', 'versionName', 'downloadUrl', 'artifactUrl'];
for (const field of required) {
  if (payload[field] === undefined) throw new Error(`Missing payload.${field}`);
}

const expectedPackage = target === 'android' ? 'com.relayid.app' : 'com.relayid.watch';
if (payload.package !== expectedPackage) throw new Error(`Unexpected package for ${target}`);
if (!Number.isInteger(payload.versionCode) || payload.versionCode < 1) throw new Error('versionCode must be a positive integer');
if (!/^https:\/\/relayid\.github\.io\/manifest\//u.test(payload.downloadUrl)) throw new Error('downloadUrl is outside the approved RelayId Pages namespace');
if (!/^https:\/\/github\.com\/RelayId\//u.test(payload.artifactUrl)) throw new Error('artifactUrl is outside the approved RelayId GitHub namespace');

const path = 'data/manifest.json';
const manifest = JSON.parse(await readFile(path, 'utf8'));
const current = manifest[target];
if (payload.versionCode < current.versionCode) throw new Error(`Refusing to lower ${target} versionCode`);

let sha256 = payload.sha256 || '';
if (sha256 && !/^[a-f0-9]{64}$/u.test(sha256)) throw new Error('sha256 must be a lowercase SHA-256 digest');

if (process.env.VERIFY_DOWNLOAD === 'true') {
  const response = await fetch(payload.artifactUrl);
  if (!response.ok) throw new Error(`Download verification failed with HTTP ${response.status}`);
  const digest = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
  if (sha256 && digest !== sha256) throw new Error('Published digest does not match the downloaded artifact');
  sha256 = digest;
}

manifest.generatedAt = new Date().toISOString();
manifest[target] = {
  package: payload.package,
  versionCode: payload.versionCode,
  versionName: payload.versionName,
  downloadUrl: payload.downloadUrl,
  artifactUrl: payload.artifactUrl,
  minSupportedVersionCode: payload.minSupportedVersionCode ?? current.minSupportedVersionCode,
  mandatory: payload.mandatory === true,
};
if (sha256) manifest[target].sha256 = sha256;

await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
