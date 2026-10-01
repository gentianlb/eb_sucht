import type { FormState } from './types';

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

export function joinGerman(items: string[]): string {
  const values = items.map(clean).filter(Boolean);
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} und ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} und ${values.at(-1)}`;
}

function formatDate(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function pronouns(gender: FormState['gender']) {
  return gender === 'female'
    ? { salutation: 'Frau', patient: 'die Patientin', patientNom: 'Die Patientin', pronoun: 'sie', possessive: 'ihre' }
    : { salutation: 'Herr', patient: 'der Patient', patientNom: 'Der Patient', pronoun: 'er', possessive: 'seine' };
}

function detoxSubstanceAfterVon(value: string): string {
  const forms: Record<string, string> = {
    'synthetische Cannabinoide (Spice)': 'synthetischen Cannabinoiden (Spice)',
    'andere Opioide': 'anderen Opioiden',
    'Benzodiazepine': 'Benzodiazepinen',
    'Z-Substanzen': 'Z-Substanzen',
    'Halluzinogene': 'Halluzinogenen',
  };
  return forms[value] ?? value;
}

function goalPhrase(state: FormState): string {
  const goals = [...state.treatmentGoals];
  const rendered: string[] = [];
  for (const goal of goals) {
    if (goal === 'Entgiftungsbehandlung') {
      const substances = [...state.detoxSubstances.map(detoxSubstanceAfterVon), clean(state.detoxOther)].filter(Boolean);
      rendered.push(substances.length ? `einer Entgiftungsbehandlung von ${joinGerman(substances)}` : 'einer Entgiftungsbehandlung');
    } else if (goal === 'qualifizierte Entzugsbehandlung') {
      rendered.push('einer qualifizierten Entzugsbehandlung');
    } else if (goal === 'Substitution/Einstellung') {
      rendered.push('einer Substitution bzw. medikamentösen Einstellung');
    } else if (goal === 'Beantragung einer stationären Langzeittherapie') {
      rendered.push('der Beantragung einer stationären Langzeittherapie');
    } else if (goal === 'nahtloser Übergang in eine stationäre Langzeittherapie') {
      rendered.push('der Vorbereitung eines nahtlosen Übergangs in eine stationäre Langzeittherapie');
    } else if (goal === 'Vermittlung in betreutes Wohnen') {
      rendered.push('der Vermittlung in betreutes Wohnen');
    } else if (goal === 'ambulante Weiterbehandlung') {
      rendered.push('der Organisation einer ambulanten Weiterbehandlung');
    } else if (goal === 'psychiatrische Stabilisierung') {
      rendered.push('einer psychiatrischen Stabilisierung');
    } else if (goal === 'medikamentöse Einstellung') {
      rendered.push('einer medikamentösen Einstellung');
    } else if (goal === 'Krisenintervention') {
      rendered.push('einer Krisenintervention');
    }
  }
  return joinGerman(rendered);
}

export function generateLetter(state: FormState): string {
  const p = pronouns(state.gender);
  const name = clean(state.name) || '…';
  const sentences: string[] = [];

  if (state.admissionMode && state.wardType) {
    sentences.push(`${p.salutation} ${name} wurde ${state.admissionMode === 'voluntary' ? 'freiwillig' : 'unfreiwillig'} auf unsere ${state.wardType === 'open' ? 'offen' : 'geschlossen'} geführte Station aufgenommen.`);
  }

  if (state.intakeMode === 'reason') {
    const reason = clean(state.admissionReason);
    if (reason) sentences.push(`Grund der Aufnahme war ${reason}.`);
  } else {
    const goal = goalPhrase(state);
    if (goal) sentences.push(`Ziel der Behandlung war ${goal}.`);
  }

  if (state.urineStatus === 'unauffaellig') {
    sentences.push('Die Urinkontrolle bei Aufnahme war unauffällig.');
  } else {
    const positives = [...state.urinePositive, clean(state.urineOther)].filter(Boolean);
    if (positives.length) sentences.push(`In der Urinkontrolle bei Aufnahme zeigten sich positive Nachweise auf ${joinGerman(positives)}.`);
  }

  if (state.aakEnabled && clean(state.aak)) {
    sentences.push(`Die Atemalkoholkonzentration bei Aufnahme betrug ${clean(state.aak)} ‰.`);
  }

  const symptoms = [...state.withdrawalSymptoms, clean(state.withdrawalOther)].filter(Boolean);
  if (symptoms.length) {
    const severity = state.withdrawalSeverity ? `${state.withdrawalSeverity}e ` : '';
    sentences.push(`Im Verlauf zeigte sich eine ${severity}Entzugssymptomatik mit ${joinGerman(symptoms)}.`);
  }

  const detoxMeds = [...state.detoxMedication, clean(state.detoxMedicationOther)].filter(Boolean);
  if (detoxMeds.length) {
    if (detoxMeds.includes('keine spezifische medikamentöse Entzugsbehandlung')) {
      sentences.push('Eine spezifische medikamentöse Entzugsbehandlung war nicht erforderlich.');
    } else {
      sentences.push(`Wir führten eine medikamentöse Entzugsbehandlung mit ${joinGerman(detoxMeds)} durch.`);
    }
  }

  state.additionalMedication.forEach((med) => {
    const nameValue = clean(med.name);
    const reason = clean(med.reason);
    if (nameValue && reason) sentences.push(`Aufgrund von ${reason} erfolgte eine Behandlung mit ${nameValue}.`);
    else if (nameValue) sentences.push(`Zusätzlich erfolgte eine Behandlung mit ${nameValue}.`);
  });

  state.priorMedication.forEach((med) => {
    const nameValue = clean(med.name);
    if (nameValue) sentences.push(`Die Vormedikation mit ${nameValue} wurde ${med.action}.`);
  });

  const behavior = [...state.wardBehavior, clean(state.wardBehaviorOther)].filter(Boolean);
  if (behavior.length) sentences.push(`Im Stationsalltag zeigte sich ${p.patient} ${joinGerman(behavior)}.`);

  if (state.groups.length) {
    const participation = clean(state.groupParticipation);
    const tail = participation ? ` ${participation}` : '';
    sentences.push(`Am gruppentherapeutischen Angebot mit ${joinGerman(state.groups)} nahm ${p.pronoun}${tail} teil.`);
  }

  const measures = [...state.therapeuticMeasures, clean(state.therapeuticMeasuresOther)].filter(Boolean);
  if (measures.length) sentences.push(`Die Behandlung umfasste ${joinGerman(measures)}.`);

  const results = [...state.outcomes, clean(state.outcomesOther)].filter(Boolean);
  if (results.length) sentences.push(`Während der Behandlung konnten wir folgende Ergebnisse erreichen: ${joinGerman(results)}.`);

  const date = formatDate(state.dischargeDate);
  const dischargeLead = date ? `Am ${date} entließen wir ${p.patient}` : `Wir entließen ${p.patient}`;
  const dischargeMap: Record<Exclude<FormState['dischargeType'], ''>, string> = {
    regulaer: 'regulär aus unserer Behandlung',
    eigenwunsch: 'auf eigenen Wunsch aus unserer Behandlung',
    gegen_rat: 'gegen ärztlichen Rat aus unserer Behandlung',
    disziplinarisch: 'disziplinarisch aus unserer Behandlung',
    langzeittherapie: 'zur direkten Aufnahme in eine stationäre Langzeittherapie bzw. Rehabilitation',
    therapieabbruch: 'bei Therapieabbruch aus unserer Behandlung',
    sonstiges: clean(state.dischargeOther) || 'aus unserer Behandlung',
  };
  if (state.dischargeType) sentences.push(`${dischargeLead} ${dischargeMap[state.dischargeType]}.`);

  const safetySentences: string[] = [];
  if (state.safety.includes('keine Hinweise auf akute Eigengefährdung')) safetySentences.push('Es bestanden keine Hinweise auf eine akute Eigengefährdung.');
  if (state.safety.includes('keine Hinweise auf akute Fremdgefährdung')) safetySentences.push('Es bestanden keine Hinweise auf eine akute Fremdgefährdung.');
  if (state.safety.includes('glaubhafte Distanzierung von akuter Suizidalität')) safetySentences.push(`${p.patientNom} distanzierte sich glaubhaft von akuter Suizidalität.`);
  if (clean(state.safetyOther)) safetySentences.push(clean(state.safetyOther).replace(/[.!?]?$/, '.'));
  sentences.push(...safetySentences);

  const followUp = [...state.followUp, clean(state.followUpOther)].filter(Boolean);
  if (followUp.length) {
    const datePart = state.followUpDate ? `; ein Termin ist für den ${formatDate(state.followUpDate)} vorgesehen` : '';
    sentences.push(`Wir empfahlen die weitere Anbindung an ${joinGerman(followUp)}${datePart}.`);
  }

  return sentences.join(' ');
}
