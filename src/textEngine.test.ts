import { describe, expect, it } from 'vitest';
import { emptyForm } from './data';
import { generateLetter, joinGerman } from './textEngine';

describe('joinGerman', () => {
  it('joins multiple values naturally', () => {
    expect(joinGerman(['Opiate', 'EtG', 'Pregabalin'])).toBe('Opiate, EtG und Pregabalin');
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

  it('renders current urine markers and capillary blood', () => {
    const text = generateLetter({
      ...emptyForm,
      name: 'M.',
      urineStatus: 'positiv',
      urinePositive: ['Opiate', 'EtG', 'Pregabalin'],
      capillaryBloodEnabled: true,
      capillaryBloodSubstances: ['synthetische Cannabinoide', 'Oxycodon'],
    });

    expect(text).toContain('positive Befunde für Opiate, EtG und Pregabalin');
    expect(text).toContain('Im Kapillarblut zeigten sich zusätzlich positive Befunde für synthetische Cannabinoide, Oxycodon.');
  });

  it('renders new treatment goals, transfer and medication changes', () => {
    const text = generateLetter({
      ...emptyForm,
      name: 'M.',
      treatmentGoals: ['qualifizierte Entgiftungsbehandlung', 'Übergang in Substitutionsbehandlung'],
      priorMedication: [
        { id: '1', name: 'Sertralin', action: 'reduziert' },
        { id: '2', name: 'Quetiapin', action: 'erhöht' },
      ],
      transferEnabled: true,
      transferFrom: 'closed',
      transferTo: 'open',
    });

    expect(text).toContain('Behandlungsziele waren eine qualifizierte Entgiftungsbehandlung sowie der Übergang in eine Substitutionsbehandlung.');
    expect(text).toContain('Die bestehende Medikation mit Sertralin wurde reduziert.');
    expect(text).toContain('Die bestehende Medikation mit Quetiapin wurde erhöht.');
    expect(text).toContain('Im weiteren Behandlungsverlauf erfolgte die Verlegung von der geschlossen geführten auf die offen geführte Station.');
  });

  it('renders complications with gender-aware and source-qualified wording', () => {
    const text = generateLetter({
      ...emptyForm,
      gender: 'female',
      complications: [
        'somatische Vorstellung im Allgemeinkrankenhaus',
        'Krampfanfall',
        'Drogenverkauf auf Station, laut Mitpatienten',
      ],
    });

    expect(text).toContain(
      'Aufgrund somatischer Beschwerden musste die Patientin in einem Allgemeinkrankenhaus vorgestellt werden.',
    );
    expect(text).toContain('Im Verlauf kam es zu einem Krampfanfall.');
    expect(text).toContain(
      'Nach Angaben von Mitpatienten bestand der Verdacht auf Drogenverkauf auf Station.',
    );
  });

  it('keeps transfer prose after medication and before ward course', () => {
    const text = generateLetter({
      ...emptyForm,
      detoxMedication: ['Clonazepam (Rivotril)'],
      transferEnabled: true,
      transferFrom: 'closed',
      transferTo: 'open',
      wardBehavior: ['kooperativ'],
    });

    const medicationIndex = text.indexOf('Die medikamentöse Entzugsbehandlung erfolgte');
    const transferIndex = text.indexOf('Im weiteren Behandlungsverlauf erfolgte die Verlegung');
    const wardIndex = text.indexOf('Im Stationsalltag zeigte sich');

    expect(medicationIndex).toBeGreaterThanOrEqual(0);
    expect(transferIndex).toBeGreaterThan(medicationIndex);
    expect(wardIndex).toBeGreaterThan(transferIndex);
  });

  it('renders recommendation wording with "Wir empfehlen"', () => {
    const text = generateLetter({
      ...emptyForm,
      followUp: ['Selbsthilfegruppe', 'örtliche Drogenberatungsstelle'],
    });

    expect(text).toContain('Wir empfehlen die Teilnahme an einer Selbsthilfegruppe sowie die Anbindung an die örtliche Drogenberatungsstelle.');
  });

  it('renders the new rehabilitation application goals', () => {
    const text = generateLetter({
      ...emptyForm,
      treatmentGoals: [
        'Beantragung einer ambulanten Entwöhnungstherapie',
        'Beantragung einer tagesklinischen Entwöhnungstherapie',
      ],
    });

    expect(text).toContain(
      'Behandlungsziele waren die Beantragung einer ambulanten Entwöhnungstherapie sowie die Beantragung einer tagesklinischen Entwöhnungstherapie.',
    );
  });

  it('renders test psychology and optional opioid tolerance warning', () => {
    const text = generateLetter({
      ...emptyForm,
      therapeuticMeasures: ['testpsychologische Diagnostik'],
      opioidToleranceWarning: true,
    });

    expect(text).toContain('Die Behandlung umfasste eine testpsychologische Diagnostik.');
    expect(text).toContain('Toleranzverlust');
    expect(text).toContain('erhöhte Überdosierungsrisiko');
  });
});
