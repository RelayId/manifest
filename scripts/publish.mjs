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

const expectedPackage = 'com.relayid.app';
if (payload.package !== expectedPackage) throw new Error(`Unexpected package for ${target}`);
if (!Number.isInteger(payload.versionCode) || payload.versionCode < 1) throw new Error('versionCode must be a positive integer');
if (!/^https:\/\/relayid\.github\.io\/manifest\//u.test(payload.downloadUrl)) throw new Error('downloadUrl is outside the approved RelayId Pages namespace');
if (!/^https:\/\/github\.com\/RelayId\//u.test(payload.artifactUrl)) throw new Error('artifactUrl is outside the approved RelayId GitHub namespace');

const inputArtifacts = payload.artifacts ?? [{ format: 'apk', artifactUrl: payload.artifactUrl, sha256: payload.sha256 }];
if (!Array.isArray(inputArtifacts) || inputArtifacts.length === 0) throw new Error('artifacts must be a non-empty array');
const allowedFormats = new Set(['apk', 'aab']);
for (const [index, artifact] of inputArtifacts.entries()) {
  if (!artifact || !allowedFormats.has(artifact.format)) throw new Error(`artifacts[${index}].format must be apk or aab`);
  if (typeof artifact.artifactUrl !== 'string' || !/^https:\/\/github\.com\/RelayId\//u.test(artifact.artifactUrl)) {
    throw new Error(`artifacts[${index}].artifactUrl is outside the approved RelayId GitHub namespace`);
  }
  if (artifact.sha256 && !/^[a-f0-9]{64}$/u.test(artifact.sha256)) throw new Error(`artifacts[${index}].sha256 must be a lowercase SHA-256 digest`);
}
if (!inputArtifacts.some((artifact) => artifact.format === 'apk' && artifact.artifactUrl === payload.artifactUrl)) {
  throw new Error('artifacts must include the primary APK artifact');
}

const path = 'data/manifest.json';
const manifest = JSON.parse(await readFile(path, 'utf8'));
const current = manifest[target];
if (payload.versionCode < current.versionCode) throw new Error(`Refusing to lower ${target} versionCode`);

const verifiedArtifacts = inputArtifacts.map((artifact) => ({ ...artifact, sha256: artifact.sha256 || '' }));

if (process.env.VERIFY_DOWNLOAD === 'true') {
  for (const artifact of verifiedArtifacts) {
    let response;
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      response = await fetch(artifact.artifactUrl);
      if (response.ok || (response.status !== 404 && response.status !== 502 && response.status !== 503)) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (!response.ok) throw new Error(`Download verification failed for ${artifact.format} with HTTP ${response.status}`);
    const digest = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    if (artifact.sha256 && digest !== artifact.sha256) throw new Error(`Published ${artifact.format} digest does not match the downloaded artifact`);
    artifact.sha256 = digest;
  }
}

manifest.generatedAt = new Date().toISOString();
manifest[target] = {
  package: payload.package,
  versionCode: payload.versionCode,
  versionName: payload.versionName,
  downloadUrl: payload.downloadUrl,
  artifactUrl: payload.artifactUrl,
  artifacts: verifiedArtifacts.map(({ format, architecture, artifactUrl, sha256 }) => ({
    format,
    ...(architecture ? { architecture } : {}),
    artifactUrl,
    ...(sha256 ? { sha256 } : {}),
  })),
  minSupportedVersionCode: payload.minSupportedVersionCode ?? current.minSupportedVersionCode,
  mandatory: payload.mandatory === true,
};
const primary = verifiedArtifacts.find((artifact) => artifact.format === 'apk' && artifact.artifactUrl === payload.artifactUrl);
if (primary?.sha256) manifest[target].sha256 = primary.sha256;
else delete manifest[target].sha256;

await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
