import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist-offline');
const indexPath = resolve(outDir, 'index.html');
const outputPath = resolve(outDir, 'eb-sucht-offline.html');
const speechAssetRoot = resolve(root, '.speech-assets');

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

const manifest = JSON.parse(await readFile(resolve(speechAssetRoot, 'manifest.json'), 'utf8'));

function mimeFor(path) {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (path.endsWith('.mjs') || path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.wasm')) return 'application/wasm';
  return 'application/octet-stream';
}

async function findOrtRuntimePair() {
  const candidateDirs = [
    resolve(root, 'node_modules/onnxruntime-web/dist'),
    resolve(root, 'node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist'),
    resolve(root, 'node_modules/@huggingface/transformers/dist'),
  ];

  const preferredBases = [
    'ort-wasm-simd-threaded.asyncify',
    'ort-wasm-simd-threaded',
    'ort-wasm-simd-threaded.jsep',
  ];

  for (const directory of candidateDirs) {
    let files;
    try {
      files = await readdir(directory);
    } catch {
      continue;
    }

    for (const base of preferredBases) {
      const mjs = `${base}.mjs`;
      const wasm = `${base}.wasm`;
      if (files.includes(mjs) && files.includes(wasm)) {
        return {
          mjsPath: resolve(directory, mjs),
          wasmPath: resolve(directory, wasm),
          mjsName: mjs,
          wasmName: wasm,
        };
      }
    }
  }

  throw new Error('Unable to locate matching ONNX Runtime .mjs/.wasm files for the offline dictation build.');
}

const resources = {};
let embeddedBytes = 0;

for (const relativePath of manifest.files) {
  const filePath = resolve(speechAssetRoot, 'model', relativePath);
  const info = await stat(filePath);
  if (!info.isFile() || info.size === 0) {
    throw new Error(`Speech asset missing or empty: ${relativePath}`);
  }

  const data = await readFile(filePath);
  embeddedBytes += data.byteLength;
  const key = `/models/${manifest.modelId}/resolve/${manifest.revision}/${relativePath}`;
  resources[key] = {
    mime: mimeFor(relativePath),
    data: data.toString('base64'),
  };
}

const ort = await findOrtRuntimePair();
for (const [path, name] of [
  [ort.mjsPath, ort.mjsName],
  [ort.wasmPath, ort.wasmName],
]) {
  const data = await readFile(path);
  embeddedBytes += data.byteLength;
  resources[`/runtime/${name}`] = {
    mime: mimeFor(name),
    data: data.toString('base64'),
  };
}

const speechRegistry = {
  version: 1,
  modelId: manifest.modelId,
  revision: manifest.revision,
  wasm: {
    mjs: `https://offline.invalid/runtime/${ort.mjsName}`,
    wasm: `https://offline.invalid/runtime/${ort.wasmName}`,
  },
  resources,
};

const registryJson = JSON.stringify(speechRegistry);
const registryScript = `<script id="eb-speech-assets" type="application/json">${registryJson}</script>`;

if (scripts.length) {
  const bundledScript = scripts.join('\n');
  const inlineScript = `<script type="module">\n${bundledScript}\n</script>`;
  html = html.replace('</body>', () => `${registryScript}\n${inlineScript}\n</body>`);
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
if (!html.includes('id="eb-speech-assets"')) {
  throw new Error('Offline HTML integrity check failed: embedded speech assets missing.');
}
if (embeddedBytes < 30_000_000) {
  throw new Error('Offline HTML integrity check failed: embedded speech resources are unexpectedly small.');
}

await writeFile(outputPath, html, 'utf8');

const outputInfo = await stat(outputPath);
console.log(
  `Offline HTML created and verified: ${outputPath} (${Math.round(outputInfo.size / 1024 / 1024)} MB; ${Math.round(embeddedBytes / 1024 / 1024)} MB embedded speech resources)`,
);
