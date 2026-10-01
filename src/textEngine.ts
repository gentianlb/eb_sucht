import type { FormState } from './types';

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

export function joinGerman(items: string[], conjunction = 'und'): string {
  const values = items.map(clean).filter(Boolean);
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} ${conjunction} ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} ${conjunction} ${values.at(-1)}`;
}

function sentence(value: string): string {
  const text = clean(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function formatDate(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function formatGermanDecimal(value: string): string {
  return clean(value).replace('.', ',');
}

function pronouns(gender: FormState['gender']) {
  return gender === 'female'
    ? {
        salutation: 'Frau',
        patientNom: 'die Patientin',
        patientNomCap: 'Die Patientin',
        patientAcc: 'die Patientin',
        pronoun: 'sie',
      }
    : {
        salutation: 'Herr',
        patientNom: 'der Patient',
        patientNomCap: 'Der Patient',
        patientAcc: 'den Patienten',
        pronoun: 'er',
      };
}

function detoxSubstanceAfterVon(value: string): string {
  const forms: Record<string, string> = {
    'synthetische Cannabinoide (Spice)': 'synthetischen Cannabinoiden (Spice)',
    'andere Opioide': 'anderen Opioiden',
    'Benzodiazepine': 'Benzodiazepinen',
    'Halluzinogene': 'Halluzinogenen',
  };
  return forms[value] ?? value;
}

function renderTreatmentGoals(state: FormState): string[] {
  return state.treatmentGoals.map((goal) => {
    if (goal === 'Entgiftungsbehandlung') {
      const substances = [...state.detoxSubstances.map(detoxSubstanceAfterVon), clean(state.detoxOther)].filter(Boolean);
      return substances.length
        ? `eine Entgiftungsbehandlung von ${joinGerman(substances)}`
        : 'eine Entgiftungsbehandlung';
    }

    const forms: Record<string, string> = {
      'qualifizierte Entzugsbehandlung': 'eine qualifizierte Entzugsbehandlung',
      'Substitution/Einstellung': 'eine Substitution bzw. medikamentöse Einstellung',
      'Beantragung einer stationären Langzeittherapie': 'die Beantragung einer stationären Langzeittherapie',
      'nahtloser Übergang in eine stationäre Langzeittherapie': 'die Vorbereitung eines nahtlosen Übergangs in eine stationäre Langzeittherapie',
      'Vermittlung in betreutes Wohnen': 'die Vermittlung in betreutes Wohnen',
      'ambulante Weiterbehandlung': 'die Organisation einer ambulanten Weiterbehandlung',
      'psychiatrische Stabilisierung': 'eine psychiatrische Stabilisierung',
      'medikamentöse Einstellung': 'eine medikamentöse Einstellung',
      'Krisenintervention': 'eine Krisenintervention',
    };

    return forms[goal] ?? goal;
  });
}

function renderGroup(group: string): string {
  const forms: Record<string, string> = {
    Psychoedukation: 'der Psychoedukation',
    'themenoffene Psychologengruppe': 'der themenoffenen Psychologengruppe',
    Motivationsgruppe: 'der Motivationsgruppe',
    Skillsgruppe: 'der Skillsgruppe',
    'medizinische Informationsgruppe': 'der medizinischen Informationsgruppe',
  };
  return forms[group] ?? group;
}

function renderMeasure(measure: string): string {
  const forms: Record<string, string> = {
    'Vermittlung in Selbsthilfe': 'die Vermittlung in Selbsthilfeangebote',
    'Beantragung einer Langzeittherapie': 'die Beantragung einer Langzeittherapie',
    'Organisation einer Wohnperspektive': 'die Organisation einer Wohnperspektive',
  };
  return forms[measure] ?? measure;
}

function renderOutcome(outcome: string): string {
  const forms: Record<string, string> = {
    'körperliche Entgiftung abgeschlossen': 'die körperliche Entgiftung abgeschlossen',
    'Entzugssymptomatik rückläufig': 'eine Besserung der Entzugssymptomatik erreicht',
    'psychische Stabilisierung erreicht': 'eine psychische Stabilisierung erreicht',
    'Schlaf verbessert': 'der Schlaf verbessert',
    'Craving reduziert': 'das Craving reduziert',
    'Krankheitseinsicht gefördert': 'die Krankheitseinsicht gefördert',
    'Abstinenzmotivation gestärkt': 'die Abstinenzmotivation gestärkt',
    'weiterführende Behandlung organisiert': 'eine weiterführende Behandlung organisiert',
    'Therapieplatz beantragt': 'ein Therapieplatz beantragt',
    'Therapieplatz vermittelt': 'ein Therapieplatz vermittelt',
    'Wohnperspektive geklärt': 'die Wohnperspektive geklärt',
  };
  return forms[outcome] ?? outcome;
}

function renderFollowUp(option: string): string {
  const forms: Record<string, string> = {
    'hausärztliche Weiterbehandlung': 'eine hausärztliche Weiterbehandlung',
    'ambulante psychiatrische Weiterbehandlung': 'eine ambulante psychiatrische Weiterbehandlung',
    Suchtambulanz: 'die Anbindung an eine Suchtambulanz',
    Substitutionsambulanz: 'die Anbindung an eine Substitutionsambulanz',
    Psychotherapie: 'eine psychotherapeutische Weiterbehandlung',
    'stationäre Langzeittherapie/Rehabilitation': 'eine stationäre Langzeittherapie bzw. Rehabilitation',
    Adaption: 'eine Adaption',
    'betreutes Wohnen': 'die Weiterbetreuung in einer betreuten Wohnform',
    Selbsthilfegruppe: 'die Teilnahme an einer Selbsthilfegruppe',
    Institutsambulanz: 'die Anbindung an eine Institutsambulanz',
  };
  return forms[option] ?? option;
}

export function generateLetter(state: FormState): string {
  const p = pronouns(state.gender);
  const name = clean(state.name) || '…';
  const sentences: string[] = [];

  if (state.admissionMode && state.wardType) {
    sentences.push(
      `${p.salutation} ${name} wurde ${state.admissionMode === 'voluntary' ? 'freiwillig' : 'unfreiwillig'} auf unserer ${state.wardType === 'open' ? 'offen' : 'geschlossen'} geführten Station aufgenommen.`,
    );
  }

  if (state.intakeMode === 'reason') {
    const reason = clean(state.admissionReason);
    if (reason) sentences.push(`Grund der Aufnahme war ${reason.replace(/[.!?]$/, '')}.`);
  } else {
    const goals = renderTreatmentGoals(state);
    if (goals.length === 1) {
      sentences.push(`Ziel der Behandlung war ${goals[0]}.`);
    } else if (goals.length > 1) {
      sentences.push(`Behandlungsziele waren ${joinGerman(goals, 'sowie')}.`);
    }
  }

  if (state.urineStatus === 'unauffaellig') {
    sentences.push('Die Urinkontrolle bei Aufnahme war unauffällig.');
  } else {
    const positives = [...state.urinePositive, clean(state.urineOther)].filter(Boolean);
    if (positives.length) {
      sentences.push(`In der Urinkontrolle bei Aufnahme ergaben sich positive Befunde für ${joinGerman(positives)}.`);
    }
  }

  if (state.aakEnabled && clean(state.aak)) {
    sentences.push(`Bei Aufnahme betrug die Atemalkoholkonzentration ${formatGermanDecimal(state.aak)} ‰.`);
  }

  const symptoms = [...state.withdrawalSymptoms, clean(state.withdrawalOther)].filter(Boolean);
  if (symptoms.length) {
    const severity = state.withdrawalSeverity ? `${state.withdrawalSeverity}e ` : '';
    sentences.push(`Im Behandlungsverlauf zeigte sich eine ${severity}Entzugssymptomatik mit ${joinGerman(symptoms)}.`);
  }

  const detoxMeds = [...state.detoxMedication, clean(state.detoxMedicationOther)].filter(Boolean);
  if (detoxMeds.length) {
    if (detoxMeds.includes('keine spezifische medikamentöse Entzugsbehandlung')) {
      sentences.push('Eine spezifische medikamentöse Entzugsbehandlung war nicht erforderlich.');
    } else {
      sentences.push(`Die medikamentöse Entzugsbehandlung erfolgte mit ${joinGerman(detoxMeds)}.`);
    }
  }

  state.additionalMedication.forEach((med) => {
    const medication = clean(med.name);
    const reason = clean(med.reason);
    if (medication && reason) {
      sentences.push(`Zur Behandlung von ${reason} erhielt ${p.patientNom} ${medication}.`);
    } else if (medication) {
      sentences.push(`Zusätzlich erhielt ${p.patientNom} ${medication}.`);
    }
  });

  state.priorMedication.forEach((med) => {
    const medication = clean(med.name);
    if (!medication) return;
    const action =
      med.action === 'fortgeführt'
        ? 'unverändert fortgeführt'
        : med.action === 'abgesetzt'
          ? 'abgesetzt'
          : 'angepasst';
    sentences.push(`Die bestehende Medikation mit ${medication} wurde ${action}.`);
  });

  const behavior = [...state.wardBehavior, clean(state.wardBehaviorOther)].filter(Boolean);
  if (behavior.length) {
    sentences.push(`Im Stationsalltag zeigte sich ${p.patientNom} ${joinGerman(behavior, 'sowie')}.`);
  }

  if (state.groups.length) {
    const renderedGroups = state.groups.map(renderGroup);
    const participation = clean(state.groupParticipation);
    const participationText = participation ? ` ${participation}` : '';
    sentences.push(`An ${joinGerman(renderedGroups, 'sowie')} nahm ${p.pronoun}${participationText} teil.`);
  }

  const measures = [...state.therapeuticMeasures.map(renderMeasure), clean(state.therapeuticMeasuresOther)].filter(Boolean);
  if (measures.length) {
    sentences.push(`Die Behandlung umfasste ${joinGerman(measures, 'sowie')}.`);
  }

  const negativeOutcome = state.outcomes.includes('keine ausreichende Stabilisierung aufgrund vorzeitiger Beendigung');
  const positiveOutcomes = state.outcomes
    .filter((outcome) => outcome !== 'keine ausreichende Stabilisierung aufgrund vorzeitiger Beendigung')
    .map(renderOutcome);

  if (positiveOutcomes.length) {
    sentences.push(`Im Behandlungsverlauf konnten ${joinGerman(positiveOutcomes, 'sowie')} werden.`);
  }
  if (negativeOutcome) {
    sentences.push('Aufgrund der vorzeitigen Beendigung konnte keine ausreichende Stabilisierung erreicht werden.');
  }
  if (clean(state.outcomesOther)) {
    sentences.push(sentence(state.outcomesOther));
  }

  const date = formatDate(state.dischargeDate);
  const dischargeLead = date ? `Am ${date} entließen wir ${p.patientAcc}` : `Wir entließen ${p.patientAcc}`;
  const dischargeMap: Record<Exclude<FormState['dischargeType'], ''>, string> = {
    regulaer: 'regulär aus unserer Behandlung',
    eigenwunsch: 'auf eigenen Wunsch aus unserer Behandlung',
    gegen_rat: 'gegen ärztlichen Rat aus unserer Behandlung',
    disziplinarisch: 'disziplinarisch aus unserer Behandlung',
    langzeittherapie: 'zur direkten Aufnahme in eine stationäre Langzeittherapie bzw. Rehabilitation',
    therapieabbruch: 'bei Therapieabbruch aus unserer Behandlung',
    sonstiges: clean(state.dischargeOther) || 'aus unserer Behandlung',
  };
  if (state.dischargeType) {
    sentences.push(`${dischargeLead} ${dischargeMap[state.dischargeType]}.`);
  }

  const noSelfRisk = state.safety.includes('keine Hinweise auf akute Eigengefährdung');
  const noOtherRisk = state.safety.includes('keine Hinweise auf akute Fremdgefährdung');
  if (noSelfRisk && noOtherRisk) {
    sentences.push('Zum Entlassungszeitpunkt bestanden keine Hinweise auf eine akute Eigen- oder Fremdgefährdung.');
  } else if (noSelfRisk) {
    sentences.push('Zum Entlassungszeitpunkt bestanden keine Hinweise auf eine akute Eigengefährdung.');
  } else if (noOtherRisk) {
    sentences.push('Zum Entlassungszeitpunkt bestanden keine Hinweise auf eine akute Fremdgefährdung.');
  }

  if (state.safety.includes('glaubhafte Distanzierung von akuter Suizidalität')) {
    sentences.push(`${p.patientNomCap} distanzierte sich glaubhaft von akuter Suizidalität.`);
  }
  if (clean(state.safetyOther)) {
    sentences.push(sentence(state.safetyOther));
  }

  const followUp = [...state.followUp.map(renderFollowUp), clean(state.followUpOther)].filter(Boolean);
  if (followUp.length) {
    sentences.push(`Zur Weiterbehandlung empfahlen wir ${joinGerman(followUp, 'sowie')}.`);
  }
  if (state.followUpDate) {
    sentences.push(`Ein entsprechender Termin ist für den ${formatDate(state.followUpDate)} vorgesehen.`);
  }

  return sentences.join(' ');
}
