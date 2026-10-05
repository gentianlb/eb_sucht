import { useEffect, useMemo, useRef, useState } from 'react';
import { DICTATION_COMMANDS, mergeDictation } from './dictation';
import {
  isSpeechSupported,
  startDictationRecording,
  transcribeRecording,
  warmupSpeechModel,
  type DictationRecorder,
} from '@speech';

type Props = {
  baseText: string;
  onAccept: (text: string) => void;
  onNotice: (message: string) => void;
};

function DictationPanel({ baseText, onAccept, onNotice }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');
  const recorderRef = useRef<DictationRecorder | null>(null);
  const supported = useMemo(() => isSpeechSupported(), []);

  useEffect(
    () => () => {
      recorderRef.current?.cancel();
      recorderRef.current = null;
    },
    [],
  );

  if (!supported) return null;

  const updateStatus = (message: string) => {
    setStatus(recorderRef.current && !busy ? `Aufnahme läuft · ${message}` : message);
  };

  const start = async () => {
    if (busy || recorderRef.current || preview) return;

    try {
      onNotice('');
      setPreview('');
      setStatus('Mikrofon wird vorbereitet …');
      const recorder = await startDictationRecording();
      recorderRef.current = recorder;
      setRecording(true);
      setStatus('Aufnahme läuft · Whisper Small wird im Browser vorbereitet …');

      void warmupSpeechModel(updateStatus).catch((error) => {
        console.error(error);
        setStatus(
          error instanceof Error
            ? `Sprachmodell: ${error.message}`
            : 'Sprachmodell konnte nicht geladen werden.',
        );
      });
    } catch (error) {
      setRecording(false);
      setStatus(error instanceof Error ? error.message : 'Mikrofon konnte nicht gestartet werden.');
    }
  };

  const stop = async () => {
    const recorder = recorderRef.current;
    if (!recorder || busy) return;

    recorderRef.current = null;
    setRecording(false);
    setBusy(true);

    try {
      setStatus('Aufnahme wird beendet …');
      const blob = await recorder.stop();
      const rawText = await transcribeRecording(blob, setStatus);
      const merged = mergeDictation(baseText, rawText);

      setPreview(merged);
      setStatus('Transkription fertig. Bitte Vorschau prüfen.');
      onNotice('Diktat lokal transkribiert. Noch nicht in den Brief übernommen.');
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error ? error.message : 'Das Diktat konnte nicht transkribiert werden.',
      );
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (!preview.trim()) return;
    onAccept(preview);
    setPreview('');
    setStatus('Diktat wurde übernommen.');
    onNotice('Diktat in den Brief übernommen.');
  };

  const discard = () => {
    setPreview('');
    setStatus('Diktat verworfen.');
    onNotice('Diktat-Vorschau verworfen.');
  };

  return (
    <div className={`dictation-panel ${recording ? 'recording' : ''}`}>
      <div className="dictation-head">
        <div>
          <strong>Diktat mit Whisper Small</strong>
          <span>Audio bleibt lokal im Browser</span>
        </div>
        <span className="offline-pill">browser</span>
      </div>

      <button
        type="button"
        className={recording ? 'dictation-stop' : 'dictation-start'}
        onClick={recording ? stop : start}
        disabled={busy || Boolean(preview)}
      >
        {busy ? 'Transkription läuft …' : recording ? 'Diktat stoppen' : 'Diktat starten'}
      </button>

      {status && (
        <p className="dictation-status" role="status">
          {status}
        </p>
      )}

      {preview && (
        <div className="dictation-preview">
          <div className="dictation-preview-head">
            <strong>Diktat-Vorschau</strong>
            <span>Noch nicht übernommen</span>
          </div>
          <textarea
            className="dictation-preview-editor"
            value={preview}
            onChange={(event) => setPreview(event.target.value)}
            aria-label="Diktat-Vorschau bearbeiten"
          />
          <div className="dictation-preview-actions">
            <button type="button" className="primary" onClick={accept}>
              Übernehmen
            </button>
            <button type="button" className="ghost" onClick={discard}>
              Verwerfen
            </button>
          </div>
        </div>
      )}

      <details className="dictation-help">
        <summary>Diktatbefehle anzeigen</summary>
        <p>{DICTATION_COMMANDS.join(' · ')}</p>
        <p>
          Häufige Psychopharmaka und suchtmedizinische Medikamente werden nach der
          Transkription lokal auf ihre übliche Schreibweise korrigiert.
        </p>
        <p>
          Beim ersten Diktat wird Whisper Small über das Internet geladen und im Browser
          zwischengespeichert. Die Audioaufnahme selbst wird nicht an einen
          Spracherkennungsdienst übertragen.
        </p>
      </details>
    </div>
  );
}

export default DictationPanel;
