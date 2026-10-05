type EmbeddedResource = {
  mime: string;
  data: string;
};

type EmbeddedSpeechRegistry = {
  version: number;
  modelId: string;
  revision: string;
  wasm: {
    mjs: string;
    wasm: string;
  };
  resources: Record<string, EmbeddedResource>;
};

export type SpeechStatusCallback = (message: string) => void;

export type DictationRecorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

let registryCache: EmbeddedSpeechRegistry | null | undefined;
let transcriberPromise: Promise<any> | null = null;
const decodedResourceCache = new Map<string, Uint8Array>();

function readRegistry(): EmbeddedSpeechRegistry | null {
  if (registryCache !== undefined) return registryCache;

  const node = document.getElementById('eb-speech-assets');
  if (!node?.textContent) {
    registryCache = null;
    return null;
  }

  try {
    registryCache = JSON.parse(node.textContent) as EmbeddedSpeechRegistry;
    return registryCache;
  } catch (error) {
    console.error('Unable to parse embedded speech assets.', error);
    registryCache = null;
    return null;
  }
}

export function hasEmbeddedSpeechAssets(): boolean {
  // Do not JSON.parse the ~100 MB embedded registry during normal app startup.
  // Parsing is deferred until dictation is actually used.
  return Boolean(document.getElementById('eb-speech-assets')?.textContent);
}

function base64ToBytes(value: string): Uint8Array {
  const estimatedLength = Math.floor((value.length * 3) / 4);
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array(estimatedLength - padding);
  const base64ChunkSize = 4 * 16_384;
  let writeOffset = 0;

  for (let offset = 0; offset < value.length; offset += base64ChunkSize) {
    const chunk = value.slice(offset, Math.min(offset + base64ChunkSize, value.length));
    const binary = atob(chunk);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[writeOffset++] = binary.charCodeAt(index);
    }
  }

  return bytes;
}

function getResource(pathname: string): { bytes: Uint8Array; mime: string } | null {
  const registry = readRegistry();
  if (!registry) return null;

  const entry = registry.resources[pathname];
  if (!entry) return null;

  let bytes = decodedResourceCache.get(pathname);
  if (!bytes) {
    bytes = base64ToBytes(entry.data);
    decodedResourceCache.set(pathname, bytes);
  }

  return { bytes, mime: entry.mime };
}

function createEmbeddedFetch() {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const value =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    let pathname: string;
    try {
      pathname = new URL(value, 'https://offline.invalid/').pathname;
    } catch {
      return new Response('Not found', { status: 404 });
    }

    const resource = getResource(pathname);
    if (!resource) {
      return new Response('Offline resource not embedded', {
        status: 404,
        statusText: 'Offline resource not embedded',
      });
    }

    const headers = new Headers({
      'content-type': resource.mime,
      'content-length': String(resource.bytes.byteLength),
      'cache-control': 'no-store',
    });

    if ((init?.method ?? 'GET').toUpperCase() === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    return new Response(resource.bytes, {
      status: 200,
      headers,
    });
  };
}

function progressMessage(event: any): string | null {
  const file = String(event?.file ?? '').split('/').pop() ?? '';

  if (event?.status === 'initiate') {
    if (file.endsWith('.onnx')) return 'Lokales Sprachmodell wird vorbereitet …';
    if (file) return `Sprachressource wird geladen: ${file}`;
  }

  if (event?.status === 'progress' && typeof event?.progress === 'number') {
    if (file.endsWith('.onnx')) {
      return `Sprachmodell wird geladen: ${Math.round(event.progress)} %`;
    }
  }

  if (event?.status === 'ready') return 'Sprachmodell ist bereit.';
  return null;
}

async function getTranscriber(onStatus?: SpeechStatusCallback): Promise<any> {
  if (transcriberPromise) return transcriberPromise;

  const registry = readRegistry();
  if (!registry) {
    throw new Error('In dieser Datei ist kein lokales Sprachmodell eingebettet.');
  }

  transcriberPromise = (async () => {
    onStatus?.('Lokales Sprachmodell wird initialisiert …');

    const { env, pipeline } = await import('@huggingface/transformers');

    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.remoteHost = 'https://offline.invalid/';
    env.remotePathTemplate = 'models/{model}/resolve/{revision}/';
    env.useBrowserCache = false;
    env.useCustomCache = false;
    env.useWasmCache = true;
    env.fetch = createEmbeddedFetch();

    const onnx = env.backends.onnx as any;
    if (onnx?.wasm) {
      onnx.wasm.numThreads = 1;
      onnx.wasm.proxy = false;
      onnx.wasm.wasmPaths = registry.wasm;
    }

    const transcriber = await pipeline(
      'automatic-speech-recognition',
      registry.modelId,
      {
        revision: registry.revision,
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (event: any) => {
          const message = progressMessage(event);
          if (message) onStatus?.(message);
        },
      } as any,
    );

    onStatus?.('Sprachmodell ist bereit.');
    return transcriber;
  })();

  try {
    return await transcriberPromise;
  } catch (error) {
    transcriberPromise = null;
    throw error;
  }
}

export async function warmupSpeechModel(onStatus?: SpeechStatusCallback): Promise<void> {
  await getTranscriber(onStatus);
}

function chooseRecordingMimeType(): string | undefined {
  const options = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];

  return options.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function startDictationRecording(): Promise<DictationRecorder> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Der Browser stellt keinen Mikrofonzugriff für lokale Dateien bereit.');
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Dieser Browser unterstützt keine Audioaufnahme über MediaRecorder.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const mimeType = chooseRecordingMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  recorder.start(500);

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener(
          'stop',
          () => {
            cleanup();
            const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
            if (blob.size === 0) {
              reject(new Error('Die Audioaufnahme war leer.'));
              return;
            }
            resolve(blob);
          },
          { once: true },
        );

        recorder.addEventListener(
          'error',
          () => {
            cleanup();
            reject(new Error('Die Audioaufnahme konnte nicht abgeschlossen werden.'));
          },
          { once: true },
        );

        if (recorder.state === 'inactive') {
          cleanup();
          reject(new Error('Die Audioaufnahme ist bereits beendet.'));
        } else {
          recorder.stop();
        }
      }),
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      cleanup();
    },
  };
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const output = new Float32Array(buffer.length);
  const channels = buffer.numberOfChannels;

  for (let channel = 0; channel < channels; channel += 1) {
    const input = buffer.getChannelData(channel);
    for (let index = 0; index < buffer.length; index += 1) {
      output[index] += input[index] / channels;
    }
  }

  return output;
}

function resampleLinear(input: Float32Array, inputRate: number, outputRate = 16_000): Float32Array {
  if (inputRate === outputRate) return input;

  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio;
    const left = Math.floor(sourcePosition);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = sourcePosition - left;
    output[index] = input[left] * (1 - fraction) + input[right] * fraction;
  }

  return output;
}

async function decodeRecording(blob: Blob): Promise<Float32Array> {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) {
    throw new Error('Der Browser unterstützt die lokale Audioverarbeitung nicht.');
  }

  const context = new AudioContextClass();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const mono = mixToMono(decoded);
    return resampleLinear(mono, decoded.sampleRate, 16_000);
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribeRecording(
  blob: Blob,
  onStatus?: SpeechStatusCallback,
): Promise<string> {
  onStatus?.('Audio wird lokal vorbereitet …');
  const [audio, transcriber] = await Promise.all([
    decodeRecording(blob),
    getTranscriber(onStatus),
  ]);

  onStatus?.('Diktat wird lokal transkribiert …');

  const result = await transcriber(audio, {
    language: 'german',
    task: 'transcribe',
    chunk_length_s: 29,
    stride_length_s: 4,
    return_timestamps: false,
  });

  const text =
    typeof result === 'string'
      ? result
      : typeof result?.text === 'string'
        ? result.text
        : '';

  if (!text.trim()) {
    throw new Error('Es konnte kein gesprochener Text erkannt werden.');
  }

  onStatus?.('Transkription abgeschlossen.');
  return text.trim();
}
