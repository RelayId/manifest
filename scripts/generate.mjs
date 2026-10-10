import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('data/manifest.json', 'utf8'));
const manifest = `${JSON.stringify(source, null, 2)}\n`;
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const artifactLabel = (artifact) => {
  const architecture = artifact.architecture ? ` · ${artifact.architecture}` : '';
  return `${artifact.format.toUpperCase()}${architecture}`;
};
const appSection = (key, title, description) => {
  const item = source[key];
  const artifacts = item.artifacts.map((artifact) => `<li><a class="button button-secondary" href="${escapeHtml(artifact.artifactUrl)}">Download ${escapeHtml(artifactLabel(artifact))}</a></li>`).join('');
  return `<section class="app-section" aria-labelledby="${key}-title"><div><h2 id="${key}-title">${title}</h2><p>${description}</p><p class="meta">Latest ${escapeHtml(item.versionName)} · package <code>${escapeHtml(item.package)}</code></p></div><ul class="download-list">${artifacts}</ul></section>`;
};
const logo = '<svg class="brand-mark" viewBox="0 0 1024 1024" aria-hidden="true"><g fill="currentColor" transform="translate(-18 0)"><path d="M250 180 H370 V306 A128 128 0 0 0 498 434 H624 A80 80 0 0 1 624 594 H498 A128 128 0 0 0 370 722 V852 H250 A100 100 0 0 1 150 752 V280 A100 100 0 0 1 250 180 Z"/><path d="M466 180 H798 A100 100 0 0 1 898 280 V338 H498 A32 32 0 0 1 466 306 V180 Z"/><path d="M498 690 H512 A78 78 0 0 1 590 768 V852 H466 V722 A32 32 0 0 1 498 690 Z"/><path d="M832 434 H898 V752 A100 100 0 0 1 798 852 H686 V768 A174 174 0 0 0 685.595566 756.143377 A120 120 0 0 1 731.809897 653.115154 A176 176 0 0 0 800 514 V466 A32 32 0 0 1 832 434 Z"/></g></svg>';
const appsPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>RelayId apps</title>
  <style>
    :root { color-scheme: light; --ink:#17212b; --muted:#5c6874; --subtle:#87929d; --line:#d8dee4; --surface:#fff; --soft:#f6f8fa; --accent:#0759a5; --accent-strong:#003d73; --radius:.35rem; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; color:var(--ink); background:var(--surface); }
    * { box-sizing:border-box; } body { min-width:20rem; margin:0; } a { color:var(--accent); text-underline-offset:.15em; } a:hover { color:var(--accent-strong); }
    .site-header,.shell { width:min(52rem,calc(100% - 2rem)); margin-inline:auto; } .site-header { display:flex; align-items:center; min-height:4rem; border-bottom:1px solid var(--line); }
    .brand { display:inline-flex; align-items:center; gap:.55rem; font-size:1.05rem; font-weight:650; } .brand-mark { display:block; width:1.75rem; height:1.75rem; } .brand-link { color:inherit; text-decoration:none; }
    .shell { padding-block:3rem 5rem; } .card { min-height:17.5rem; } h1,h2,p { overflow-wrap:break-word; } h1 { margin:0; font-size:clamp(1.65rem,3vw,2.2rem); line-height:1.15; } h2 { margin:0 0 .65rem; font-size:1.2rem; } p { line-height:1.55; }
    .page-heading { display:grid; gap:1rem; padding-bottom:1.5rem; border-bottom:1px solid var(--line); } .lead { max-width:48rem; margin:0; color:var(--muted); text-wrap:balance; }
    .app-list { display:grid; gap:0; margin-top:1.5rem; } .app-section { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:1.5rem; align-items:center; padding-block:1.5rem; border-bottom:1px solid var(--line); } .app-section p { margin:.35rem 0 0; color:var(--muted); } .meta { font-size:.84rem; } code { padding:.1rem .25rem; background:#eef1f4; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:.88em; }
    .download-list { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:.5rem; margin:0; padding:0; list-style:none; } .button { display:inline-flex; min-height:2.5rem; align-items:center; justify-content:center; padding:.55rem .9rem; border:1px solid var(--accent); border-radius:var(--radius); font:inherit; font-size:.9rem; text-decoration:none; white-space:nowrap; } .button-secondary { background:var(--accent); color:#fff; } .button-secondary:hover { background:var(--accent-strong); color:#fff; }
    .back-link { margin-top:2rem; } .footer-note { margin-top:1.5rem; color:var(--subtle); font-size:.84rem; } :focus-visible { outline:2px solid #111827; outline-offset:3px; }
    @media (max-width:42rem) { .site-header,.shell { width:min(100% - 1.5rem,34rem); } .site-header { justify-content:center; } .shell { padding-block:2rem 4rem; } .card { text-align:center; } .page-heading h1 { text-align:center; } .app-section { grid-template-columns:1fr; gap:1rem; } .download-list { justify-content:center; } }
  </style>
</head>
<body>
  <header class="site-header"><div class="brand">${logo}<a class="brand-link" href="https://relay.crni.xyz/" aria-label="RelayId home">RelayId</a></div></header>
  <main class="shell"><article class="card">
    <header class="page-heading"><h1>RelayId apps</h1><p class="lead">Install the latest RelayId client for Android or Wear OS. These links always point to the latest published builds.</p></header>
    <div class="app-list">${appSection('android', 'Android', 'Use RelayId on your phone or tablet.')} ${appSection('wear', 'Wear OS', 'Use RelayId on a compatible Wear OS watch.')}</div>
    <p class="footer-note">For automatic update checks, clients use the <a href="https://relayid.github.io/manifest/manifest.json">RelayId update manifest</a>.</p>
    <p class="back-link"><a href="https://relay.crni.xyz/">Back to RelayId</a></p>
  </article></main>
</body>
</html>
`;
const redirect = (title) => `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta http-equiv="refresh" content="0; url=../manifest.json">\n  <link rel="canonical" href="../manifest.json">\n  <title>${title}</title>\n</head>\n<body>\n  <p><a href="../manifest.json">Open the RelayId update manifest</a></p>\n</body>\n</html>\n`;
const rootRedirect = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta http-equiv="refresh" content="0; url=./manifest.json">\n  <link rel="canonical" href="./manifest.json">\n  <title>RelayId manifest</title>\n</head>\n<body>\n  <p><a href="./manifest.json">Open the RelayId update manifest</a></p>\n</body>\n</html>\n`;

await mkdir('public/android', { recursive: true });
await mkdir('public/wear', { recursive: true });
await mkdir('public/apps', { recursive: true });
await writeFile('public/manifest.json', manifest);
await writeFile('public/index.html', rootRedirect);
await writeFile('public/android/index.html', redirect('RelayId Android update'));
await writeFile('public/wear/index.html', redirect('RelayId Wear OS update'));
await writeFile('public/apps/index.html', appsPage);

console.log('Generated RelayId Pages output from data/manifest.json');
