import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('data/manifest.json', 'utf8'));
const manifest = `${JSON.stringify(source, null, 2)}\n`;
const redirect = (title) => `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta http-equiv="refresh" content="0; url=../manifest.json">\n  <link rel="canonical" href="../manifest.json">\n  <title>${title}</title>\n</head>\n<body>\n  <p><a href="../manifest.json">Open the RelayId update manifest</a></p>\n</body>\n</html>\n`;
const rootRedirect = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta http-equiv="refresh" content="0; url=./manifest.json">\n  <link rel="canonical" href="./manifest.json">\n  <title>RelayId manifest</title>\n</head>\n<body>\n  <p><a href="./manifest.json">Open the RelayId update manifest</a></p>\n</body>\n</html>\n`;

await mkdir('public/android', { recursive: true });
await mkdir('public/wear', { recursive: true });
await writeFile('public/manifest.json', manifest);
await writeFile('public/index.html', rootRedirect);
await writeFile('public/android/index.html', redirect('RelayId Android update'));
await writeFile('public/wear/index.html', redirect('RelayId Wear OS update'));

console.log('Generated RelayId Pages output from data/manifest.json');
