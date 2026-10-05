export type SpeechStatusCallback = (message: string) => void;

export type DictationRecorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export function isSpeechSupported(): boolean {
  return false;
}

export async function warmupSpeechModel(_onStatus?: SpeechStatusCallback): Promise<void> {
  throw new Error('Diktat ist in der Offline-HTML deaktiviert.');
}

export async function startDictationRecording(): Promise<DictationRecorder> {
  throw new Error('Diktat ist in der Offline-HTML deaktiviert.');
}

export async function transcribeRecording(
  _blob: Blob,
  _onStatus?: SpeechStatusCallback,
): Promise<string> {
  throw new Error('Diktat ist in der Offline-HTML deaktiviert.');
}
