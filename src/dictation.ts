const medicationCorrections: Array<[RegExp, string]> = [
  [/\bvenla[\s-]?faxin(?:e)?\b/gi, 'Venlafaxin'],
  [/\bsertralin(?:e)?\b/gi, 'Sertralin'],
  [/\bescitalopram\b/gi, 'Escitalopram'],
  [/\bcitalopram\b/gi, 'Citalopram'],
  [/\bfluoxetin(?:e)?\b/gi, 'Fluoxetin'],
  [/\bparoxetin(?:e)?\b/gi, 'Paroxetin'],
  [/\bduloxetin(?:e)?\b/gi, 'Duloxetin'],
  [/\bmirtazapin(?:e)?\b/gi, 'Mirtazapin'],
  [/\bbupropion\b/gi, 'Bupropion'],
  [/\btrazodon(?:e)?\b/gi, 'Trazodon'],
  [/\bamitriptylin(?:e)?\b/gi, 'Amitriptylin'],
  [/\b(?:quetiapin(?:e)?|quettiapin(?:e)?|ketiapin(?:e)?)\b/gi, 'Quetiapin'],
  [/\bolanzapin(?:e)?\b/gi, 'Olanzapin'],
  [/\brisperidon(?:e)?\b/gi, 'Risperidon'],
  [/\baripiprazol(?:e)?\b/gi, 'Aripiprazol'],
  [/\bclozapin(?:e)?\b/gi, 'Clozapin'],
  [/\bhaloperidol\b/gi, 'Haloperidol'],
  [/\bpipamperon\b/gi, 'Pipamperon'],
  [/\bmelperon\b/gi, 'Melperon'],
  [/\bpromethazin(?:e)?\b/gi, 'Promethazin'],
  [/\bprothipendyl\b/gi, 'Prothipendyl'],
  [/\bdominal\b/gi, 'Dominal'],
  [/\bpregabalin\b/gi, 'Pregabalin'],
  [/\bgabapentin\b/gi, 'Gabapentin'],
  [/\blamotrigin(?:e)?\b/gi, 'Lamotrigin'],
  [/\bvalproat\b/gi, 'Valproat'],
  [/\bvalproinsäure\b/gi, 'Valproinsäure'],
  [/\blithium\b/gi, 'Lithium'],
  [/\bclonazepam\b/gi, 'Clonazepam'],
  [/\brivotril\b/gi, 'Rivotril'],
  [/\bdiazepam\b/gi, 'Diazepam'],
  [/\blorazepam\b/gi, 'Lorazepam'],
  [/\btavor\b/gi, 'Tavor'],
  [/\boxazepam\b/gi, 'Oxazepam'],
  [/\bmethadon\b/gi, 'Methadon'],
  [/\blevomethadon\b/gi, 'Levomethadon'],
  [/\b(?:l[\s-]?polamidon|polamidon)\b/gi, 'L-Polamidon'],
  [/\bbuprenorphin\b/gi, 'Buprenorphin'],
  [/\bsubutex\b/gi, 'Subutex'],
  [/\bsuboxone\b/gi, 'Suboxone'],
  [/\bnaltrexon\b/gi, 'Naltrexon'],
  [/\bnaloxon\b/gi, 'Naloxon'],
  [/\bacamprosat\b/gi, 'Acamprosat'],
  [/\bdisulfiram\b/gi, 'Disulfiram'],
  [/\bzopiclon\b/gi, 'Zopiclon'],
  [/\bzolpidem\b/gi, 'Zolpidem'],
  [/\bmethylphenidat\b/gi, 'Methylphenidat'],
];

export function correctMedicalVocabulary(text: string): string {
  return medicationCorrections.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}

function stripCommandPunctuation(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('de-DE')
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

function deleteLastSentence(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return '';

  const withoutTrailingPunctuation = trimmed.replace(/[.!?]+$/g, '').trimEnd();
  const boundary = Math.max(
    withoutTrailingPunctuation.lastIndexOf('.'),
    withoutTrailingPunctuation.lastIndexOf('!'),
    withoutTrailingPunctuation.lastIndexOf('?'),
  );

  return boundary >= 0 ? withoutTrailingPunctuation.slice(0, boundary + 1).trimEnd() : '';
}

function deleteLastParagraph(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return '';
  const index = trimmed.lastIndexOf('\n\n');
  return index >= 0 ? trimmed.slice(0, index).trimEnd() : '';
}

function deleteLastWord(text: string): string {
  return text.trimEnd().replace(/\s*\S+\s*$/u, '').trimEnd();
}

function capitalizeSentenceStarts(text: string): string {
  let capitalizeNext = true;
  let result = '';

  for (const character of text) {
    if (capitalizeNext && /[A-Za-zÄÖÜäöüß]/.test(character)) {
      result += character.toLocaleUpperCase('de-DE');
      capitalizeNext = false;
      continue;
    }

    result += character;

    if (/[.!?]/.test(character) || character === '\n') {
      capitalizeNext = true;
    } else if (!/\s/.test(character)) {
      capitalizeNext = false;
    }
  }

  return result;
}

export function applyDictationCommands(rawText: string): string {
  let text = correctMedicalVocabulary(rawText.trim());

  const replacements: Array<[RegExp, string]> = [
    [/\bneuer\s+absatz\b[.,;:]?/gi, '\n\n'],
    [/\bneue\s+zeile\b[.,;:]?/gi, '\n'],
    [/\bdoppelpunkt\b[.,;:]?/gi, ':'],
    [/\bsemikolon\b[.,;:]?/gi, ';'],
    [/\bfragezeichen\b[.,;:]?/gi, '?'],
    [/\bausrufezeichen\b[.,;:]?/gi, '!'],
    [/\bklammer\s+auf\b[.,;:]?/gi, '('],
    [/\bklammer\s+zu\b[.,;:]?/gi, ')'],
    [/\bbindestrich\b[.,;:]?/gi, '-'],
    [/\bkomma\b[.,;:]?/gi, ','],
    [/\bpunkt\b[.,;:]?/gi, '.'],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?=[^\s\n])/g, '$1 ')
    .replace(/([.!?])(?=[A-Za-zÄÖÜäöüß])/g, '$1 ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return capitalizeSentenceStarts(text);
}

export function mergeDictation(existingText: string, rawText: string): string {
  const command = stripCommandPunctuation(rawText);

  if (['lösche letzten satz', 'letzten satz löschen'].includes(command)) {
    return deleteLastSentence(existingText);
  }
  if (['lösche letzten absatz', 'letzten absatz löschen'].includes(command)) {
    return deleteLastParagraph(existingText);
  }
  if (['lösche letztes wort', 'letztes wort löschen'].includes(command)) {
    return deleteLastWord(existingText);
  }

  const dictated = applyDictationCommands(rawText);
  if (!dictated) return existingText;

  const existing = existingText.trimEnd();
  if (!existing) return dictated;

  if (dictated.startsWith('\n') || /\n$/.test(existing)) {
    return `${existing}${dictated}`;
  }

  if (/^[,.;:!?)]/.test(dictated)) {
    return `${existing}${dictated}`;
  }

  return `${existing} ${dictated}`;
}

export const DICTATION_COMMANDS = [
  'Punkt',
  'Komma',
  'Doppelpunkt',
  'Semikolon',
  'Fragezeichen',
  'Ausrufezeichen',
  'neuer Absatz',
  'neue Zeile',
  'Klammer auf / Klammer zu',
  'Bindestrich',
  'lösche letzten Satz',
  'lösche letzten Absatz',
  'lösche letztes Wort',
];
