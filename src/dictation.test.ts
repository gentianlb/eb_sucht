import { describe, expect, it } from 'vitest';
import { applyDictationCommands, correctMedicalVocabulary, mergeDictation } from './dictation';

describe('medical dictation vocabulary', () => {
  it('normalizes common psychopharmacology names', () => {
    expect(correctMedicalVocabulary('venla faxin und ketiapin sowie l polamidon')).toBe(
      'Venlafaxin und Quetiapin sowie L-Polamidon',
    );
  });

  it('keeps already correct medication names normalized', () => {
    expect(correctMedicalVocabulary('sertralin, pregabalin und rivotril')).toBe(
      'Sertralin, Pregabalin und Rivotril',
    );
  });
});

describe('dictation commands', () => {
  it('converts punctuation and paragraph commands', () => {
    expect(
      applyDictationCommands('der Patient war kooperativ Punkt neuer Absatz Venla Faxin wurde fortgeführt Punkt'),
    ).toBe('Der Patient war kooperativ.\n\nVenlafaxin wurde fortgeführt.');
  });

  it('supports deletion commands against existing text', () => {
    expect(mergeDictation('Erster Satz. Zweiter Satz.', 'lösche letzten Satz')).toBe('Erster Satz.');
    expect(mergeDictation('Erster Absatz.\n\nZweiter Absatz.', 'lösche letzten Absatz')).toBe('Erster Absatz.');
  });
});
