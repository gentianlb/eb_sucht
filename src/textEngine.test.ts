import { describe, expect, it } from 'vitest';
import { emptyForm } from './data';
import { generateLetter, joinGerman } from './textEngine';

describe('joinGerman', () => {
  it('joins multiple values naturally', () => {
    expect(joinGerman(['Alkohol', 'Oxycodon', 'Cannabis'])).toBe('Alkohol, Oxycodon und Cannabis');
    expect(joinGerman(['freundlich und zugewandt', 'kooperativ'], 'sowie')).toBe('freundlich und zugewandt sowie kooperativ');
  });
});

describe('generateLetter', () => {
  it('switches grammatical gender and uses the correct accusative on discharge', () => {
    const text = generateLetter({
      ...emptyForm,
      gender: 'female',
      name: 'M.',
      urineStatus: 'unauffaellig',
      admissionMode: 'voluntary',
      wardType: 'open',
      dischargeType: 'regulaer',
    });

    expect(text).toContain('Frau M. wurde freiwillig auf unserer offen geführten Station aufgenommen.');
    expect(text).toContain('Wir entließen die Patientin regulär aus unserer Behandlung.');
  });

  it('renders detox substances and positive urine findings', () => {
    const text = generateLetter({
      ...emptyForm,
      name: 'M.',
      treatmentGoals: ['Entgiftungsbehandlung'],
      detoxSubstances: ['Oxycodon', 'synthetische Cannabinoide (Spice)'],
      urineStatus: 'positiv',
      urinePositive: ['Oxycodon', 'Benzodiazepine'],
    });

    expect(text).toContain('Ziel der Behandlung war eine Entgiftungsbehandlung von Oxycodon und synthetischen Cannabinoiden (Spice).');
    expect(text).toContain('positive Befunde für Oxycodon und Benzodiazepine');
  });

  it('renders a complex example as fluent clinical prose', () => {
    const text = generateLetter({
      ...emptyForm,
      gender: 'male',
      name: 'M.',
      dischargeDate: '2026-10-02',
      admissionMode: 'voluntary',
      wardType: 'open',
      intakeMode: 'goal',
      treatmentGoals: ['qualifizierte Entzugsbehandlung', 'Beantragung einer stationären Langzeittherapie'],
      urineStatus: 'positiv',
      urinePositive: ['Alkohol', 'Cannabis', 'Pregabalin'],
      aakEnabled: true,
      aak: '1.7',
      withdrawalSeverity: 'leicht',
      withdrawalSymptoms: ['Übelkeit', 'Schwitzen', 'Bauchbeschwerden'],
      detoxMedication: ['Clonazepam (Rivotril)'],
      additionalMedication: [{ id: '1', name: 'Dominal', reason: 'Schlafstörungen' }],
      priorMedication: [{ id: '2', name: 'Sertralin', action: 'fortgeführt' }],
      wardBehavior: ['freundlich und zugewandt', 'kooperativ'],
      groups: ['Psychoedukation', 'themenoffene Psychologengruppe'],
      groupParticipation: 'regelmäßig und konstruktiv',
      therapeuticMeasures: ['psychologische Einzelgespräche', 'Bezugspflegegespräche', 'Beantragung einer Langzeittherapie'],
      outcomes: ['Therapieplatz beantragt', 'körperliche Entgiftung abgeschlossen'],
      dischargeType: 'regulaer',
      safety: ['keine Hinweise auf akute Eigengefährdung', 'keine Hinweise auf akute Fremdgefährdung'],
      followUp: ['Selbsthilfegruppe'],
    });

    expect(text).toContain('Behandlungsziele waren eine qualifizierte Entzugsbehandlung sowie die Beantragung einer stationären Langzeittherapie.');
    expect(text).toContain('Bei Aufnahme betrug die Atemalkoholkonzentration 1,7 ‰.');
    expect(text).toContain('Die medikamentöse Entzugsbehandlung erfolgte mit Clonazepam (Rivotril).');
    expect(text).toContain('Im Stationsalltag zeigte sich der Patient freundlich und zugewandt sowie kooperativ.');
    expect(text).toContain('An der Psychoedukation sowie der themenoffenen Psychologengruppe nahm er regelmäßig und konstruktiv teil.');
    expect(text).toContain('Die Behandlung umfasste psychologische Einzelgespräche, Bezugspflegegespräche sowie die Beantragung einer Langzeittherapie.');
    expect(text).toContain('Im Behandlungsverlauf konnten ein Therapieplatz beantragt sowie die körperliche Entgiftung abgeschlossen werden.');
    expect(text).toContain('Am 02.10.2026 entließen wir den Patienten regulär aus unserer Behandlung.');
    expect(text).toContain('Zum Entlassungszeitpunkt bestanden keine Hinweise auf eine akute Eigen- oder Fremdgefährdung.');
    expect(text).toContain('Zur Weiterbehandlung empfahlen wir die Teilnahme an einer Selbsthilfegruppe.');
  });
});
