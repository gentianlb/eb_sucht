import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = resolve(root, '.speech-assets');
const modelId = 'onnx-community/whisper-tiny';
const revision = 'main';

const files = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'added_tokens.json',
  'special_tokens_map.json',
  'vocab.json',
  'merges.txt',
  'normalizer.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];

async function existsWithContent(path) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function download(relativePath) {
  const destination = resolve(assetRoot, 'model', relativePath);
  if (await existsWithContent(destination)) {
    console.log(`Using cached speech asset: ${relativePath}`);
    return;
  }

  await mkdir(dirname(destination), { recursive: true });
  const url = `https://huggingface.co/${modelId}/resolve/${revision}/${relativePath}?download=true`;
  console.log(`Downloading speech asset: ${relativePath}`);

  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'eb-sucht-offline-builder/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${relativePath}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error(`Downloaded empty speech asset: ${relativePath}`);
  }
  await writeFile(destination, buffer);
}

for (const file of files) {
  await download(file);
}

await writeFile(
  resolve(assetRoot, 'manifest.json'),
  JSON.stringify({ modelId, revision, files }, null, 2),
  'utf8',
);

const encoder = await readFile(resolve(assetRoot, 'model/onnx/encoder_model_quantized.onnx'));
const decoder = await readFile(resolve(assetRoot, 'model/onnx/decoder_model_merged_quantized.onnx'));

if (encoder.byteLength < 5_000_000 || decoder.byteLength < 20_000_000) {
  throw new Error('Whisper model integrity check failed: model files are unexpectedly small.');
}

console.log(
  `Speech assets ready: ${modelId} (${Math.round((encoder.byteLength + decoder.byteLength) / 1024 / 1024)} MB model weights)`,
);
