import type { FormState } from './types';

export const substances = [
  'Alkohol',
  'Cannabis',
  'synthetische Cannabinoide (Spice)',
  'Heroin',
  'Oxycodon',
  'andere Opioide',
  'Kokain/Crack',
  'Amphetamin',
  'Methamphetamin',
  'Benzodiazepine',
  'Pregabalin',
  'Z-Substanzen',
  'Ketamin',
  'Halluzinogene',
];

export const urineMarkers = [
  'Opiate',
  'Benzodiazepine',
  'Oxycodon',
  'EtG',
  'Cannabinoide',
  'Amphetamine',
  'Ketamin',
  'Cocainmetabolit',
  'Methadonmetabolit',
  'Buprenorphin',
  'Pregabalin',
];

export const treatmentGoals = [
  'Entgiftungsbehandlung',
  'qualifizierte Entgiftungsbehandlung',
  'Übergang in Substitutionsbehandlung',
  'Beantragung einer stationären Langzeittherapie',
  'Beantragung einer ambulanten Entwöhnungstherapie',
  'Beantragung einer tagesklinischen Entwöhnungstherapie',
  'nahtloser Übergang in eine stationäre Langzeittherapie',
  'Vermittlung in betreutes Wohnen',
  'ambulante Weiterbehandlung',
  'psychiatrische Stabilisierung',
  'medikamentöse Einstellung',
  'Krisenintervention',
];

export const withdrawalSymptoms = [
  'Tremor',
  'Schwitzen',
  'Tachykardie',
  'Blutdruckanstieg',
  'Übelkeit',
  'Erbrechen',
  'Diarrhö',
  'Bauchbeschwerden',
  'Muskel-/Gliederschmerzen',
  'Kopfschmerzen',
  'Frösteln',
  'Gänsehaut',
  'Mydriasis',
  'Rhinorrhö/Tränenfluss',
  'innere Unruhe',
  'Reizbarkeit',
  'Angst',
  'innere Anspannung',
  'Schlafstörungen',
  'vermehrtes Schlafbedürfnis',
  'depressive Stimmung',
  'Antriebsminderung',
  'Konzentrationsstörungen',
  'Craving',
  'Affektlabilität',
  'Wahrnehmungsstörungen/Halluzinationen',
  'Desorientiertheit/Verwirrtheit',
  'Krampfanfälle',
  'Delir',
];

export const detoxMedications = [
  'keine spezifische medikamentöse Entzugsbehandlung',
  'Clonazepam (Rivotril)',
  'Methadon',
  'L-Polamidon',
  'Buprenorphin',
  'Diazepam',
];

export const wardBehaviors = [
  'freundlich und zugewandt',
  'kooperativ',
  'gut führbar',
  'absprachefähig',
  'zurückgezogen',
  'angespannt',
  'unruhig',
  'affektlabil',
  'gereizt',
  'fordernd',
  'impulsiv',
  'mit Schwierigkeiten bei der Einhaltung des Stationsrahmens',
];

export const groups = [
  'Psychoedukation',
  'themenoffene Psychologengruppe',
  'Motivationsgruppe',
  'Skillsgruppe',
  'medizinische Informationsgruppe',
];

export const therapeuticMeasures = [
  'ärztliche Einzelgespräche',
  'psychologische Einzelgespräche',
  'Bezugspflegegespräche',
  'sozialdienstliche Beratung',
  'Angehörigengespräche',
  'Motivationsarbeit',
  'Rückfallprophylaxe',
  'Vermittlung in Selbsthilfe',
  'Beantragung einer Langzeittherapie',
  'Organisation einer Wohnperspektive',
  'testpsychologische Diagnostik',
];

export const outcomes = [
  'körperliche Entgiftung abgeschlossen',
  'Entzugssymptomatik rückläufig',
  'psychische Stabilisierung erreicht',
  'Schlaf verbessert',
  'Craving reduziert',
  'Krankheitseinsicht gefördert',
  'Abstinenzmotivation gestärkt',
  'weiterführende Behandlung organisiert',
  'Therapieplatz beantragt',
  'Therapieplatz vermittelt',
  'Wohnperspektive geklärt',
  'keine ausreichende Stabilisierung aufgrund vorzeitiger Beendigung',
];

export const safetyOptions = [
  'keine Hinweise auf akute Eigengefährdung',
  'keine Hinweise auf akute Fremdgefährdung',
  'glaubhafte Distanzierung von akuter Suizidalität',
];

export const followUpOptions = [
  'hausärztliche Weiterbehandlung',
  'ambulante psychiatrische Weiterbehandlung',
  'örtliche Drogenberatungsstelle',
  'Substitutionspraxis',
  'Psychotherapie',
  'stationäre Langzeittherapie/Rehabilitation',
  'betreutes Wohnen',
  'Selbsthilfegruppe',
  'Institutsambulanz',
];

export const emptyForm: FormState = {
  gender: 'male',
  name: '',
  dischargeDate: '',
  admissionMode: '',
  wardType: '',
  intakeMode: 'goal',
  admissionReason: '',
  treatmentGoals: [],
  detoxSubstances: [],
  detoxOther: '',

  urineStatus: '',
  urinePositive: [],
  urineOther: '',
  aakEnabled: false,
  aak: '',
  capillaryBloodEnabled: false,
  capillaryBloodSubstances: [''],

  withdrawalSeverity: '',
  withdrawalSymptoms: [],
  withdrawalOther: '',

  detoxMedication: [],
  detoxMedicationOther: '',
  additionalMedication: [],
  priorMedication: [],

  transferEnabled: false,
  transferFrom: '',
  transferTo: '',

  wardBehavior: [],
  wardBehaviorOther: '',
  groups: [],
  groupParticipation: '',
  therapeuticMeasures: [],
  therapeuticMeasuresOther: '',
  outcomes: [],
  outcomesOther: '',

  dischargeType: '',
  dischargeOther: '',
  safety: [],
  safetyOther: '',
  opioidToleranceWarning: false,

  followUp: [],
  followUpOther: '',
  followUpDate: '',
};

export const uncomplicatedPreset: FormState = {
  ...emptyForm,
  admissionMode: 'voluntary',
  wardType: 'open',
  intakeMode: 'goal',
  urineStatus: 'unauffaellig',
  wardBehavior: ['freundlich und zugewandt', 'kooperativ', 'absprachefähig'],
  groups: ['Psychoedukation', 'Motivationsgruppe', 'medizinische Informationsgruppe'],
  groupParticipation: 'regelmäßig und konstruktiv',
  therapeuticMeasures: ['ärztliche Einzelgespräche', 'Bezugspflegegespräche', 'Motivationsarbeit', 'Rückfallprophylaxe'],
  outcomes: ['Entzugssymptomatik rückläufig', 'psychische Stabilisierung erreicht', 'Abstinenzmotivation gestärkt'],
  dischargeType: 'regulaer',
  safety: [],
};
