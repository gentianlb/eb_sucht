import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  detoxMedications,
  emptyForm,
  followUpOptions,
  groups,
  outcomes,
  safetyOptions,
  substances,
  therapeuticMeasures,
  treatmentGoals,
  uncomplicatedPreset,
  urineMarkers,
  wardBehaviors,
  withdrawalSymptoms,
} from './data';
import { generateLetter } from './textEngine';
import type { FormState, MedicationReason, PriorMedication } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

function Chip({
  active,
  children,
  onClick,
  disabled = false,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`chip ${active ? 'active' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Section({
  id,
  title,
  hint,
  children,
  defaultOpen = false,
  fastMode,
  activeSection,
  onOpen,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  fastMode: boolean;
  activeSection: string | null;
  onOpen: (id: string) => void;
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = fastMode ? activeSection === id : localOpen;

  return (
    <details
      className="section"
      open={isOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        if (fastMode) {
          if (nextOpen) onOpen(id);
        } else {
          setLocalOpen(nextOpen);
        }
      }}
    >
      <summary>
        <span>{title}</span>
        {hint && <small>{hint}</small>}
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

function MultiChips({
  options,
  value,
  onChange,
  max,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter((v) => v !== item));
    else if (!max || value.length < max) onChange([...value, item]);
  };

  return (
    <div className="chips">
      {options.map((item) => (
        <Chip
          key={item}
          active={value.includes(item)}
          onClick={() => toggle(item)}
          disabled={!!max && !value.includes(item) && value.length >= max}
        >
          {item}
        </Chip>
      ))}
    </div>
  );
}

function App() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const generated = useMemo(() => generateLetter(form), [form]);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [notice, setNotice] = useState('');
  const [fastMode, setFastMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('patient');

  useEffect(() => {
    if (!manualMode) setManualText(generated);
  }, [generated, manualMode]);

  const text = manualMode ? manualText : generated;
  const safetyComplete = form.safety.length > 0 || form.safetyOther.trim().length > 0;

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyPreset = () => {
    setForm({ ...uncomplicatedPreset });
    setManualMode(false);
    setNotice('Preset gesetzt. Gefährdungsbeurteilung bleibt bewusst offen.');
  };

  const reset = () => {
    setForm({ ...emptyForm });
    setManualMode(false);
    setManualText('');
    setActiveSection('patient');
    setNotice('Vorlage zurückgesetzt.');
  };

  const copy = async () => {
    if (!safetyComplete) return;
    await navigator.clipboard.writeText(text);
    setNotice('Text in die Zwischenablage kopiert.');
  };

  const handleEditButton = () => {
    if (manualMode) {
      setManualMode(false);
      setManualText(generated);
      setNotice('Text aus dem Formular neu erzeugt.');
      return;
    }
    setManualText(generated);
    setManualMode(true);
  };

  const setUrineStatus = (status: FormState['urineStatus']) => {
    setForm((prev) => ({
      ...prev,
      urineStatus: status,
      urinePositive: status === 'positiv' ? prev.urinePositive : [],
      urineOther: status === 'positiv' ? prev.urineOther : '',
    }));
  };

  const setDetoxMedication = (next: string[]) => {
    const none = 'keine spezifische medikamentöse Entzugsbehandlung';
    if (next.includes(none) && !form.detoxMedication.includes(none)) patch('detoxMedication', [none]);
    else patch('detoxMedication', next.filter((m) => m !== none));
  };

  const addMedication = () =>
    patch('additionalMedication', [...form.additionalMedication, { id: uid(), name: '', reason: '' }]);
  const updateMedication = (id: string, key: keyof Omit<MedicationReason, 'id'>, value: string) =>
    patch('additionalMedication', form.additionalMedication.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  const removeMedication = (id: string) =>
    patch('additionalMedication', form.additionalMedication.filter((m) => m.id !== id));

  const addPrior = () =>
    patch('priorMedication', [...form.priorMedication, { id: uid(), name: '', action: 'fortgeführt' }]);
  const updatePrior = (id: string, key: keyof Omit<PriorMedication, 'id'>, value: string) =>
    patch('priorMedication', form.priorMedication.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  const removePrior = (id: string) =>
    patch('priorMedication', form.priorMedication.filter((m) => m.id !== id));

  const sectionProps = (id: string, defaultOpen = false) => ({
    id,
    fastMode,
    activeSection,
    onOpen: setActiveSection,
    defaultOpen,
  });

  return (
    <div className="app-shell">
      <header className="topbar compact-topbar">
        <div>
          <h1 className="brand-title">Entlassungsbriefhilfe Abhängigkeitserkrankungen</h1>
          <p className="subtitle">Textgenerator für den klinischen Behandlungsverlauf</p>
        </div>
      </header>

      <main className="layout">
        <div className="form-column">
          <div className="quick-actions panel">
            <button className="secondary" type="button" onClick={applyPreset}>Preset: unkomplizierter Verlauf</button>
            <label className="mode-toggle">
              <input
                type="checkbox"
                checked={fastMode}
                onChange={(event) => {
                  setFastMode(event.target.checked);
                  if (event.target.checked && !activeSection) setActiveSection('patient');
                }}
              />
              <span>Fast-Mode</span>
            </label>
            <button className="ghost danger" type="button" onClick={reset}>Zurücksetzen</button>
          </div>

          <Section title="1 · Patient & Aufnahme" {...sectionProps('patient', true)}>
            <div className="field-grid two">
              <label>
                <span>Geschlecht</span>
                <div className="segmented">
                  <button className={form.gender === 'male' ? 'selected' : ''} onClick={() => patch('gender', 'male')} type="button">Männlich</button>
                  <button className={form.gender === 'female' ? 'selected' : ''} onClick={() => patch('gender', 'female')} type="button">Weiblich</button>
                </div>
              </label>
              <label><span>Name / Kürzel</span><input value={form.name} onChange={(e) => patch('name', e.target.value)} placeholder="z. B. M." /></label>
              <label>
                <span>Aufnahmeart</span>
                <select value={form.admissionMode} onChange={(e) => patch('admissionMode', e.target.value as FormState['admissionMode'])}>
                  <option value="">Bitte wählen</option>
                  <option value="voluntary">freiwillig</option>
                  <option value="involuntary">unfreiwillig</option>
                </select>
              </label>
              <label>
                <span>Stationsführung</span>
                <select value={form.wardType} onChange={(e) => patch('wardType', e.target.value as FormState['wardType'])}>
                  <option value="">Bitte wählen</option>
                  <option value="open">offen geführt</option>
                  <option value="closed">geschlossen geführt</option>
                </select>
              </label>
            </div>
          </Section>

          <Section title="2 · Aufnahmegrund / Behandlungsziel" {...sectionProps('goal', true)}>
            <div className="segmented wide">
              <button className={form.intakeMode === 'reason' ? 'selected' : ''} onClick={() => patch('intakeMode', 'reason')} type="button">Grund der Aufnahme</button>
              <button className={form.intakeMode === 'goal' ? 'selected' : ''} onClick={() => patch('intakeMode', 'goal')} type="button">Ziel der Behandlung</button>
            </div>
            {form.intakeMode === 'reason' ? (
              <label><span>Grund der Aufnahme</span><textarea rows={3} value={form.admissionReason} onChange={(e) => patch('admissionReason', e.target.value)} placeholder="Freitext" /></label>
            ) : (
              <>
                <MultiChips options={treatmentGoals} value={form.treatmentGoals} onChange={(v) => patch('treatmentGoals', v)} />
                {form.treatmentGoals.includes('Entgiftungsbehandlung') && (
                  <div className="subpanel">
                    <span className="field-title">Substanzen für Entgiftungsbehandlung</span>
                    <MultiChips options={substances} value={form.detoxSubstances} onChange={(v) => patch('detoxSubstances', v)} />
                    <input value={form.detoxOther} onChange={(e) => patch('detoxOther', e.target.value)} placeholder="Weitere Substanz" />
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="3 · Aufnahme-Screening" {...sectionProps('screening')}>
            <div className="segmented wide">
              <button className={form.urineStatus === 'unauffaellig' ? 'selected' : ''} onClick={() => setUrineStatus('unauffaellig')} type="button">Urinkontrolle unauffällig</button>
              <button className={form.urineStatus === 'positiv' ? 'selected' : ''} onClick={() => setUrineStatus('positiv')} type="button">Positive Nachweise</button>
            </div>
            {form.urineStatus === 'positiv' && (
              <>
                <MultiChips options={urineMarkers} value={form.urinePositive} onChange={(v) => patch('urinePositive', v)} />
                <input value={form.urineOther} onChange={(e) => patch('urineOther', e.target.value)} placeholder="Weiterer positiver Nachweis" />
              </>
            )}

            <label className="switch-row">
              <input type="checkbox" checked={form.aakEnabled} onChange={(e) => patch('aakEnabled', e.target.checked)} />
              <span>AAK bei Aufnahme dokumentieren</span>
            </label>
            {form.aakEnabled && (
              <label><span>AAK in ‰</span><input inputMode="decimal" value={form.aak} onChange={(e) => patch('aak', e.target.value.replace(',', '.'))} placeholder="z. B. 1,2" /></label>
            )}

            <label className="switch-row">
              <input type="checkbox" checked={form.capillaryBloodEnabled} onChange={(e) => patch('capillaryBloodEnabled', e.target.checked)} />
              <span>Kapillarblut ergänzen</span>
            </label>
            {form.capillaryBloodEnabled && (
              <label>
                <span>Nachgewiesene Substanz</span>
                <input value={form.capillaryBloodSubstance} onChange={(e) => patch('capillaryBloodSubstance', e.target.value)} placeholder="Droge einfügen" />
              </label>
            )}
          </Section>

          <Section title="4 · Entzugssymptomatik" hint="Nur dokumentierte Symptome auswählen" {...sectionProps('withdrawal')}>
            <div className="field-grid two">
              <label>
                <span>Ausprägung</span>
                <select value={form.withdrawalSeverity} onChange={(e) => patch('withdrawalSeverity', e.target.value as FormState['withdrawalSeverity'])}>
                  <option value="">ohne Angabe</option>
                  <option>leicht</option>
                  <option>mittelgradig</option>
                  <option>ausgeprägt</option>
                </select>
              </label>
            </div>
            <MultiChips options={withdrawalSymptoms} value={form.withdrawalSymptoms} onChange={(v) => patch('withdrawalSymptoms', v)} />
            <input value={form.withdrawalOther} onChange={(e) => patch('withdrawalOther', e.target.value)} placeholder="Weiteres Entzugssymptom" />
          </Section>

          <Section title="5 · Medikamentöse Behandlung & Verlegung" {...sectionProps('medication')}>
            <span className="field-title">Entzugsbehandlung</span>
            <MultiChips options={detoxMedications} value={form.detoxMedication} onChange={setDetoxMedication} />
            <input value={form.detoxMedicationOther} onChange={(e) => patch('detoxMedicationOther', e.target.value)} placeholder="Anderes Medikament (ohne Dosis)" />

            <div className="repeater-head">
              <span className="field-title">Weitere Medikation</span>
              <button type="button" className="small-button" onClick={addMedication}>+ Medikament</button>
            </div>
            {form.additionalMedication.map((med) => (
              <div className="repeater" key={med.id}>
                <input value={med.name} onChange={(e) => updateMedication(med.id, 'name', e.target.value)} placeholder="Medikament" />
                <input value={med.reason} onChange={(e) => updateMedication(med.id, 'reason', e.target.value)} placeholder="Grund, z. B. Schlafstörungen" />
                <button type="button" className="icon-button" aria-label="Medikament entfernen" onClick={() => removeMedication(med.id)}>×</button>
              </div>
            ))}

            <div className="repeater-head">
              <span className="field-title">Vormedikation</span>
              <button type="button" className="small-button" onClick={addPrior}>+ Vormedikation</button>
            </div>
            {form.priorMedication.map((med) => (
              <div className="repeater" key={med.id}>
                <input value={med.name} onChange={(e) => updatePrior(med.id, 'name', e.target.value)} placeholder="Medikament" />
                <select value={med.action} onChange={(e) => updatePrior(med.id, 'action', e.target.value)}>
                  <option>fortgeführt</option>
                  <option>abgesetzt</option>
                  <option>reduziert</option>
                  <option>erhöht</option>
                </select>
                <button type="button" className="icon-button" aria-label="Vormedikation entfernen" onClick={() => removePrior(med.id)}>×</button>
              </div>
            ))}

            <div className="subpanel">
              <label className="switch-row">
                <input type="checkbox" checked={form.transferEnabled} onChange={(e) => patch('transferEnabled', e.target.checked)} />
                <span>Stationsverlegung dokumentieren</span>
              </label>
              {form.transferEnabled && (
                <div className="field-grid two">
                  <label>
                    <span>Von</span>
                    <select value={form.transferFrom} onChange={(e) => patch('transferFrom', e.target.value as FormState['wardType'])}>
                      <option value="">Bitte wählen</option>
                      <option value="closed">geschlossen geführt</option>
                      <option value="open">offen geführt</option>
                    </select>
                  </label>
                  <label>
                    <span>Nach</span>
                    <select value={form.transferTo} onChange={(e) => patch('transferTo', e.target.value as FormState['wardType'])}>
                      <option value="">Bitte wählen</option>
                      <option value="open">offen geführt</option>
                      <option value="closed">geschlossen geführt</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </Section>

          <Section title="6 · Stationsalltag" {...sectionProps('ward')}>
            <MultiChips options={wardBehaviors} value={form.wardBehavior} onChange={(v) => patch('wardBehavior', v)} />
            <input value={form.wardBehaviorOther} onChange={(e) => patch('wardBehaviorOther', e.target.value)} placeholder="Weitere Beschreibung" />
          </Section>

          <Section title="7 · Gruppentherapie" hint={`${form.groups.length}/4 Gruppen`} {...sectionProps('groups')}>
            <MultiChips options={groups} value={form.groups} max={4} onChange={(v) => patch('groups', v)} />
            <label>
              <span>Teilnahme</span>
              <select value={form.groupParticipation} onChange={(e) => patch('groupParticipation', e.target.value)}>
                <option value="">ohne Angabe</option>
                <option>regelmäßig und konstruktiv</option>
                <option>regelmäßig, jedoch eher zurückhaltend</option>
                <option>unregelmäßig</option>
                <option>nicht</option>
              </select>
            </label>
          </Section>

          <Section title="8 · Weitere therapeutische Maßnahmen" {...sectionProps('measures')}>
            <MultiChips options={therapeuticMeasures} value={form.therapeuticMeasures} onChange={(v) => patch('therapeuticMeasures', v)} />
            <input value={form.therapeuticMeasuresOther} onChange={(e) => patch('therapeuticMeasuresOther', e.target.value)} placeholder="Sonstige Maßnahme" />
          </Section>

          <Section title="9 · Behandlungsergebnis" {...sectionProps('outcomes')}>
            <MultiChips options={outcomes} value={form.outcomes} onChange={(v) => patch('outcomes', v)} />
            <textarea rows={2} value={form.outcomesOther} onChange={(e) => patch('outcomesOther', e.target.value)} placeholder="Weiteres Behandlungsergebnis" />
          </Section>

          <Section title="10 · Entlassung" {...sectionProps('discharge', true)}>
            <div className="field-grid two">
              <label><span>Entlassdatum</span><input type="date" value={form.dischargeDate} onChange={(e) => patch('dischargeDate', e.target.value)} /></label>
              <label>
                <span>Entlassungsart</span>
                <select value={form.dischargeType} onChange={(e) => patch('dischargeType', e.target.value as FormState['dischargeType'])}>
                  <option value="">Bitte wählen</option>
                  <option value="regulaer">regulär</option>
                  <option value="eigenwunsch">auf eigenen Wunsch</option>
                  <option value="gegen_rat">gegen ärztlichen Rat</option>
                  <option value="disziplinarisch">disziplinarisch</option>
                  <option value="langzeittherapie">direkte Aufnahme Langzeittherapie/Reha</option>
                  <option value="therapieabbruch">Therapieabbruch</option>
                  <option value="sonstiges">sonstiger Grund</option>
                </select>
              </label>
            </div>
            {form.dischargeType === 'sonstiges' && (
              <input value={form.dischargeOther} onChange={(e) => patch('dischargeOther', e.target.value)} placeholder="Sonstiger Entlassungsgrund als Satzteil" />
            )}
          </Section>

          <Section title="11 · Gefährdungsbeurteilung & Opioid-Aufklärung" hint="Gefährdungsbeurteilung vor Kopieren" {...sectionProps('safety', true)}>
            <div className={`required-box ${safetyComplete ? 'complete' : ''}`}>
              <MultiChips options={safetyOptions} value={form.safety} onChange={(v) => patch('safety', v)} />
              <textarea rows={2} value={form.safetyOther} onChange={(e) => patch('safetyOther', e.target.value)} placeholder="Alternativer / ergänzender klinischer Freitext" />
              <p>{safetyComplete ? 'Gefährdungsbeurteilung dokumentiert.' : 'Bitte vor dem Kopieren aktiv dokumentieren.'}</p>
            </div>
            <label className="switch-row">
              <input type="checkbox" checked={form.opioidToleranceWarning} onChange={(e) => patch('opioidToleranceWarning', e.target.checked)} />
              <span>Bei Opioidabhängigkeit: Aufklärung über Toleranzverlust und Überdosierungsrisiko dokumentieren</span>
            </label>
          </Section>

          <Section title="12 · Weiterbehandlung / Empfehlungen" {...sectionProps('followup')}>
            <MultiChips options={followUpOptions} value={form.followUp} onChange={(v) => patch('followUp', v)} />
            <input value={form.followUpOther} onChange={(e) => patch('followUpOther', e.target.value)} placeholder="Sonstige Empfehlung" />
            <label><span>Optionaler Termin</span><input type="date" value={form.followUpDate} onChange={(e) => patch('followUpDate', e.target.value)} /></label>
          </Section>
        </div>

        <aside className="preview-column">
          <div className="preview panel">
            <div className="preview-head">
              <p className="eyebrow">LIVE-VORSCHAU</p>
              <span className={`status ${manualMode ? 'manual' : ''}`}>{manualMode ? 'Manuell' : 'Automatisch'}</span>
            </div>
            {manualMode ? (
              <textarea className="preview-editor" value={manualText} onChange={(e) => setManualText(e.target.value)} aria-label="Entlassungstext manuell bearbeiten" />
            ) : (
              <div className="letter-text">{text || 'Auswahl treffen, um den Fließtext zu erzeugen.'}</div>
            )}
            <div className="preview-actions">
              <button type="button" className="secondary" onClick={handleEditButton}>
                {manualMode ? 'Aus Formular neu erzeugen' : 'Manuell bearbeiten'}
              </button>
              <button type="button" className="primary" disabled={!safetyComplete || !text.trim()} onClick={copy}>In Zwischenablage kopieren</button>
            </div>
            {!safetyComplete && <div className="validation-note">Kopieren ist erst nach dokumentierter Gefährdungsbeurteilung möglich.</div>}
            {notice && <div className="notice" role="status">{notice}</div>}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
