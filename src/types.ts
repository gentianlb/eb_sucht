export type Gender = 'male' | 'female';
export type AdmissionMode = '' | 'voluntary' | 'involuntary';
export type WardType = '' | 'open' | 'closed';
export type IntakeMode = 'reason' | 'goal';
export type Severity = '' | 'leicht' | 'mittelgradig' | 'ausgeprägt';
export type UrineStatus = '' | 'unauffaellig' | 'positiv';
export type DischargeType =
  | ''
  | 'regulaer'
  | 'eigenwunsch'
  | 'gegen_rat'
  | 'disziplinarisch'
  | 'langzeittherapie'
  | 'therapieabbruch'
  | 'sonstiges';

export interface MedicationReason {
  id: string;
  name: string;
  reason: string;
}

export interface PriorMedication {
  id: string;
  name: string;
  action: 'fortgeführt' | 'abgesetzt' | 'reduziert' | 'erhöht';
}

export interface FormState {
  gender: Gender;
  name: string;
  dischargeDate: string;
  admissionMode: AdmissionMode;
  wardType: WardType;
  intakeMode: IntakeMode;
  admissionReason: string;
  treatmentGoals: string[];
  detoxSubstances: string[];
  detoxOther: string;

  urineStatus: UrineStatus;
  urinePositive: string[];
  urineOther: string;
  aakEnabled: boolean;
  aak: string;
  capillaryBloodEnabled: boolean;
  capillaryBloodSubstance: string;

  withdrawalSeverity: Severity;
  withdrawalSymptoms: string[];
  withdrawalOther: string;

  detoxMedication: string[];
  detoxMedicationOther: string;
  additionalMedication: MedicationReason[];
  priorMedication: PriorMedication[];

  transferEnabled: boolean;
  transferFrom: WardType;
  transferTo: WardType;

  wardBehavior: string[];
  wardBehaviorOther: string;
  groups: string[];
  groupParticipation: string;
  therapeuticMeasures: string[];
  therapeuticMeasuresOther: string;
  outcomes: string[];
  outcomesOther: string;

  dischargeType: DischargeType;
  dischargeOther: string;
  safety: string[];
  safetyOther: string;
  opioidToleranceWarning: boolean;

  followUp: string[];
  followUpOther: string;
  followUpDate: string;
}
