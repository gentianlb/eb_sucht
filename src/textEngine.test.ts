import { describe, expect, it } from 'vitest';
import { emptyForm } from './data';
import { generateLetter, joinGerman } from './textEngine';

describe('joinGerman', () => {
  it('joins multiple values naturally', () => {
    expect(joinGerman(['Alkohol', 'Oxycodon', 'Cannabis'])).toBe('Alkohol, Oxycodon und Cannabis');
  });
});

describe('generateLetter', () => {
  it('switches grammatical gender', () => {
    const text = generateLetter({ ...emptyForm, gender: 'female', name: 'M.', urineStatus: 'unauffaellig', admissionMode: 'voluntary', wardType: 'open', dischargeType: 'regulaer' });
    expect(text).toContain('Frau M. wurde freiwillig');
    expect(text).toContain('die Patientin regulär');
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
    expect(text).toContain('Entgiftungsbehandlung von Oxycodon und synthetischen Cannabinoiden (Spice)');
    expect(text).toContain('positive Nachweise auf Oxycodon und Benzodiazepine');
  });
});
