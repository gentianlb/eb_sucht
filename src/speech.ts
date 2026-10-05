export type SpeechStatusCallback = (message: string) => void;

export type DictationRecorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

let transcriberPromise: Promise<any> | null = null;

export function isSpeechSupported(): boolean {
  return (
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

function progressMessage(event: any): string | null {
  const file = String(event?.file ?? '').split('/').pop() ?? '';

  if (event?.status === 'initiate') {
    if (file.endsWith('.onnx')) return 'Whisper Small wird vorbereitet …';
    if (file) return `Sprachressource wird geladen: ${file}`;
  }

  if (event?.status === 'progress' && typeof event?.progress === 'number') {
    if (file.endsWith('.onnx')) {
      return `Whisper Small wird geladen: ${Math.round(event.progress)} %`;
    }
  }

  if (event?.status === 'ready') return 'Whisper Small ist bereit.';
  return null;
}

async function getTranscriber(onStatus?: SpeechStatusCallback): Promise<any> {
  if (transcriberPromise) return transcriberPromise;

  transcriberPromise = (async () => {
    onStatus?.('Whisper Small wird beim ersten Diktat heruntergeladen …');

    const { env, pipeline } = await import('@huggingface/transformers');

    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = true;
    env.useCustomCache = false;
    env.useWasmCache = true;

    const onnx = env.backends.onnx as any;
    if (onnx?.wasm) {
      onnx.wasm.numThreads = 1;
      onnx.wasm.proxy = false;
    }

    const transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-small',
      {
        revision: 'main',
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (event: any) => {
          const message = progressMessage(event);
          if (message) onStatus?.(message);
        },
      } as any,
    );

    onStatus?.('Whisper Small ist bereit.');
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
    throw new Error('Der Browser stellt keinen Mikrofonzugriff bereit.');
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
  const context = new AudioContext();
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

  onStatus?.('Diktat wird lokal mit Whisper Small transkribiert …');

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
