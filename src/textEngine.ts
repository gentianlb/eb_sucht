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
    Benzodiazepine: 'Benzodiazepinen',
    Halluzinogene: 'Halluzinogenen',
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
      'qualifizierte Entgiftungsbehandlung': 'eine qualifizierte Entgiftungsbehandlung',
      'Übergang in Substitutionsbehandlung': 'der Übergang in eine Substitutionsbehandlung',
      'Beantragung einer stationären Langzeittherapie': 'die Beantragung einer stationären Langzeittherapie',
      'Beantragung einer ambulanten Entwöhnungstherapie': 'die Beantragung einer ambulanten Entwöhnungstherapie',
      'Beantragung einer tagesklinischen Entwöhnungstherapie': 'die Beantragung einer tagesklinischen Entwöhnungstherapie',
      'nahtloser Übergang in eine stationäre Langzeittherapie': 'die Vorbereitung eines nahtlosen Übergangs in eine stationäre Langzeittherapie',
      'Vermittlung in betreutes Wohnen': 'die Vermittlung in betreutes Wohnen',
      'ambulante Weiterbehandlung': 'die Organisation einer ambulanten Weiterbehandlung',
      'psychiatrische Stabilisierung': 'eine psychiatrische Stabilisierung',
      'medikamentöse Einstellung': 'eine medikamentöse Einstellung',
      Krisenintervention: 'eine Krisenintervention',
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
    'testpsychologische Diagnostik': 'eine testpsychologische Diagnostik',
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

function renderComplication(complication: string, gender: FormState['gender']): string {
  const p = pronouns(gender);
  const forms: Record<string, string> = {
    'somatische Vorstellung im Allgemeinkrankenhaus':
      `Aufgrund somatischer Beschwerden musste ${p.patientNom} in einem Allgemeinkrankenhaus vorgestellt werden.`,
    'fremdaggressives Verhalten auf Station':
      'Im Verlauf kam es zu fremdaggressivem Verhalten auf Station.',
    'Suizidalität auf Station':
      'Im Verlauf zeigte sich auf Station eine suizidale Symptomatik.',
    'Delir auf Station':
      'Im Verlauf trat auf Station ein Delir auf.',
    Krampfanfall:
      'Im Verlauf kam es zu einem Krampfanfall.',
    'Konsum/Rückfall auf Station':
      'Im Verlauf kam es zu einem Konsumereignis beziehungsweise Rückfall auf Station.',
    'Drogenverkauf auf Station laut Mitpatient:innen':
      'Nach Angaben von Mitpatienten bestand der Verdacht auf Drogenverkauf auf Station.',
    'akute Intoxikation auf Station':
      'Im Verlauf kam es zu einer akuten Intoxikation auf Station.',
    'Sturz/Verletzung':
      'Im Verlauf kam es zu einem Sturz beziehungsweise einer Verletzung.',
    'akute psychotische Symptomatik':
      'Im Verlauf zeigte sich eine akute psychotische Symptomatik.',
    'unerlaubtes Entfernen von der Station':
      `${p.patientNomCap} entfernte sich im Verlauf unerlaubt von der Station.`,
  };

  return forms[complication] ?? sentence(complication);
}

function renderFollowUp(option: string): string {
  const forms: Record<string, string> = {
    'hausärztliche Weiterbehandlung': 'eine hausärztliche Weiterbehandlung',
    'ambulante psychiatrische Weiterbehandlung': 'eine ambulante psychiatrische Weiterbehandlung',
    'örtliche Drogenberatungsstelle': 'die Anbindung an die örtliche Drogenberatungsstelle',
    Substitutionspraxis: 'die Anbindung an eine Substitutionspraxis',
    Psychotherapie: 'eine psychotherapeutische Weiterbehandlung',
    'stationäre Langzeittherapie/Rehabilitation': 'eine stationäre Langzeittherapie bzw. Rehabilitation',
    'betreutes Wohnen': 'die Weiterbetreuung in einer betreuten Wohnform',
    Selbsthilfegruppe: 'die Teilnahme an einer Selbsthilfegruppe',
    Institutsambulanz: 'die Anbindung an eine Institutsambulanz',
  };
  return forms[option] ?? option;
}

function wardLabel(ward: FormState['wardType']): string {
  return ward === 'open' ? 'offen geführte' : 'geschlossen geführte';
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

  if (state.capillaryBloodEnabled) {
    const capillaryFindings = state.capillaryBloodSubstances.map(clean).filter(Boolean);
    if (capillaryFindings.length) {
      sentences.push(`Im Kapillarblut zeigten sich zusätzlich positive Befunde für ${capillaryFindings.join(', ')}.`);
    }
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
    const actionMap: Record<FormState['priorMedication'][number]['action'], string> = {
      fortgeführt: 'unverändert fortgeführt',
      abgesetzt: 'abgesetzt',
      reduziert: 'reduziert',
      erhöht: 'erhöht',
    };
    sentences.push(`Die bestehende Medikation mit ${medication} wurde ${actionMap[med.action]}.`);
  });

  if (state.transferEnabled && state.transferFrom && state.transferTo && state.transferFrom !== state.transferTo) {
    sentences.push(
      `Im weiteren Behandlungsverlauf erfolgte die Verlegung von der ${wardLabel(state.transferFrom)}n auf die ${wardLabel(state.transferTo)} Station.`,
    );
  }

  state.complications.forEach((complication) => {
    sentences.push(renderComplication(complication, state.gender));
  });
  if (clean(state.complicationsOther)) {
    sentences.push(sentence(state.complicationsOther));
  }

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

  if (state.opioidToleranceWarning) {
    sentences.push(
      'Bei Opioidabhängigkeit erfolgte zudem eine Aufklärung über den nach Abstinenz zu erwartenden Toleranzverlust und das damit verbundene erhöhte Überdosierungsrisiko bei erneutem Opioidkonsum.',
    );
  }

  const followUp = [...state.followUp.map(renderFollowUp), clean(state.followUpOther)].filter(Boolean);
  if (followUp.length) {
    sentences.push(`Wir empfehlen ${joinGerman(followUp, 'sowie')}.`);
  }
  if (state.followUpDate) {
    sentences.push(`Ein entsprechender Termin ist für den ${formatDate(state.followUpDate)} vorgesehen.`);
  }

  return sentences.join(' ');
}
