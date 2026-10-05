import { readFile, writeFile } from 'node:fs/promises';
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
  html = html.replace('</head>', `<style>\n${styles.join('\n')}\n</style>\n</head>`);
}

const scriptPattern = /<script\s+type=["']module["']\s+crossorigin\s+src=["']([^"']+)["']><\/script>|<script\s+type=["']module["']\s+src=["']([^"']+)["']><\/script>/g;
const scripts = [];
for (const match of html.matchAll(scriptPattern)) {
  const src = match[1] ?? match[2];
  const jsPath = resolve(outDir, src.replace(/^\.\//, '').replace(/^\//, ''));
  scripts.push(await readFile(jsPath, 'utf8'));
}
html = html.replace(scriptPattern, '');
if (scripts.length) {
  html = html.replace('</body>', `<script type="module">\n${scripts.join('\n')}\n</script>\n</body>`);
}

html = html.replace(/<link\s+rel=["']modulepreload["'][^>]*>/g, '');
await writeFile(outputPath, html, 'utf8');

console.log(`Offline HTML created: ${outputPath}`);
