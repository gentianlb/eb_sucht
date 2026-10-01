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
      capillaryBloodSubstance: 'synthetische Cannabinoide',
    });

    expect(text).toContain('positive Befunde für Opiate, EtG und Pregabalin');
    expect(text).toContain('Im Kapillarblut zeigte sich zusätzlich ein positiver Befund für synthetische Cannabinoide.');
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
