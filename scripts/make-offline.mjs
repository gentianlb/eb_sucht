import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist-offline');
const indexPath = resolve(outDir, 'index.html');
const outputPath = resolve(outDir, 'eb-sucht-offline.html');

let html = await readFile(indexPath, 'utf8');

const stylesheetPattern = /<link\s+rel=["']stylesheet["']\s+crossorigin\s+href=["']([^"']+)["']\s*\/?>|<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/g;
const styles = [];

for (const match of html.matchAll(stylesheetPattern)) {
  const href = match[1] ?? match[2];
  const cssPath = resolve(outDir, href.replace(/^\.\//, '').replace(/^\//, ''));
  styles.push(await readFile(cssPath, 'utf8'));
}

html = html.replace(stylesheetPattern, '');

if (styles.length) {
  const inlineStyles = `<style>\n${styles.join('\n')}\n</style>\n</head>`;
  html = html.replace('</head>', () => inlineStyles);
}

const scriptPattern = /<script\s+type=["']module["']\s+crossorigin\s+src=["']([^"']+)["']><\/script>|<script\s+type=["']module["']\s+src=["']([^"']+)["']><\/script>/g;
const scripts = [];

for (const match of html.matchAll(scriptPattern)) {
  const src = match[1] ?? match[2];
  const jsPath = resolve(outDir, src.replace(/^\.\//, '').replace(/^\//, ''));
  scripts.push(await readFile(jsPath, 'utf8'));
}

html = html.replace(scriptPattern, '');
html = html.replace(/<link\s+rel=["']modulepreload["'][^>]*>/g, '');

if (scripts.length) {
  const bundledScript = scripts.join('\n');
  new Function(bundledScript);
  const inlineScript = `<script>\n${bundledScript}\n</script>\n</body>`;
  html = html.replace('</body>', () => inlineScript);
}

const doctypeCount = (html.match(/<!doctype html>/gi) ?? []).length;
if (doctypeCount !== 1) {
  throw new Error(`Offline HTML integrity check failed: expected 1 doctype, found ${doctypeCount}.`);
}
if (/\b(?:src|href)=["'][^"']*assets\//i.test(html)) {
  throw new Error('Offline HTML integrity check failed: external build asset reference remains.');
}
if (!html.includes('<div id="root"></div>')) {
  throw new Error('Offline HTML integrity check failed: React root element missing.');
}
if (/whisper|automatic-speech-recognition|eb-speech-assets/i.test(html)) {
  throw new Error('Offline HTML integrity check failed: dictation code or model reference remains.');
}

await writeFile(outputPath, html, 'utf8');

const outputInfo = await stat(outputPath);
console.log(
  `Offline HTML created and verified without dictation: ${outputPath} (${Math.round(outputInfo.size / 1024)} KB)`,
);
