import { JsonObject } from './DemoTypes';

const LANGUAGES: [number, string][] = [
  [0, 'Unknown'],
  [1, 'English'],
  [2, 'French'],
  [3, 'Spanish'],
  [4, 'German'],
  [5, 'Italian'],
  [6, 'Danish'],
  [7, 'Dutch'],
  [8, 'Japanese'],
  [9, 'Icelandic'],
  [10, 'Chinese'],
  [11, 'Russian'],
  [12, 'Polish'],
  [13, 'Vietnamese'],
  [14, 'Swedish'],
  [15, 'Norwegian'],
  [16, 'Finnish'],
  [17, 'Turkish'],
  [18, 'Portuguese'],
  [19, 'Flemish'],
  [20, 'Greek'],
  [21, 'Korean'],
  [22, 'Hungarian'],
  [23, 'Hebrew'],
  [24, 'Lithuanian'],
  [25, 'Czech'],
  [26, 'Arabic'],
  [27, 'Hindi'],
  [28, 'Bulgarian'],
  [29, 'Malayalam'],
  [30, 'Ukrainian'],
  [31, 'Slovak'],
  [32, 'Thai'],
  [33, 'Portuguese (Brazil)'],
  [34, 'Spanish (Latino)'],
  [35, 'Romanian'],
  [36, 'Latvian'],
  [37, 'Persian'],
  [38, 'Catalan'],
  [39, 'Croatian'],
  [40, 'Serbian'],
  [41, 'Bosnian'],
  [42, 'Estonian'],
  [43, 'Tamil'],
  [44, 'Indonesian'],
  [45, 'Macedonian'],
  [46, 'Slovenian'],
  [47, 'Azerbaijani'],
  [48, 'Uzbek'],
  [49, 'Malay'],
  [50, 'Urdu'],
  [51, 'Romansh'],
  [52, 'Georgian'],
  [53, 'Irish'],
  [-2, 'Original'],
];

const ISO_CODES: Record<number, [string, string]> = {
  1: ['en', ''],
  2: ['fr', 'fr'],
  3: ['es', ''],
  4: ['de', 'de'],
  5: ['it', ''],
  6: ['da', ''],
  7: ['nl', ''],
  8: ['ja', ''],
  9: ['is', ''],
  10: ['zh', 'cn'],
  11: ['ru', ''],
  12: ['pl', ''],
  13: ['vi', ''],
  14: ['sv', ''],
  15: ['no', ''],
  16: ['fi', ''],
  17: ['tr', ''],
  18: ['pt', 'pt'],
  19: ['nl', ''],
  20: ['el', ''],
  21: ['ko', ''],
  22: ['hu', ''],
  23: ['he', ''],
  24: ['lt', ''],
  25: ['cs', ''],
  26: ['ar', ''],
  27: ['hi', ''],
  28: ['bg', ''],
  29: ['ml', ''],
  30: ['uk', ''],
  31: ['sk', ''],
  32: ['th', 'th'],
  33: ['pt', 'br'],
  34: ['es', 'mx'],
  35: ['ro', ''],
  36: ['lv', ''],
  37: ['fa', ''],
  38: ['ca', ''],
  39: ['hr', ''],
  40: ['sr', ''],
  41: ['bs', ''],
  42: ['et', ''],
  43: ['ta', ''],
  44: ['id', ''],
  45: ['mk', ''],
  46: ['sl', ''],
  47: ['az', ''],
  48: ['uz', ''],
  49: ['ms', ''],
  50: ['ur', ''],
  51: ['rm', ''],
  52: ['ka', ''],
  53: ['ga', ''],
};

export function languageResource(id: number): JsonObject | undefined {
  const language = LANGUAGES.find(([languageId]) => languageId === id);

  return language
    ? {
        id: language[0],
        name: language[1],
        nameLower: language[1].toLowerCase(),
      }
    : undefined;
}

export function languageResources() {
  return [...LANGUAGES]
    .sort(
      (a, b) => Number(a[0] > 0) - Number(b[0] > 0) || a[1].localeCompare(b[1])
    )
    .map(([id]) => languageResource(id) as JsonObject);
}

export function languageIdentifier(id: number) {
  const [code, country] = ISO_CODES[id] ?? ISO_CODES[1];

  return country ? `${code}-${country.toUpperCase()}` : code;
}

export function languageFiles(id: number) {
  const culture = languageIdentifier(id).replace('-', '_').toLowerCase();
  const files = ['en'];

  if (culture.includes('_')) {
    files.push(culture.split('_')[0]);
  }

  files.push(culture);

  return Array.from(new Set(files));
}

const LANGUAGE_ALIASES: Record<string, string> = {
  nb: 'no',
  nn: 'no',
};

export function browserLanguage(tags: readonly string[]) {
  const entries = Object.entries(ISO_CODES).map(
    ([id, [code, country]]) => [Number(id), code, country] as const
  );

  for (const tag of tags) {
    const [language = '', region = ''] = tag.toLowerCase().split('-');
    const code = LANGUAGE_ALIASES[language] ?? language;
    const exact = entries.find(
      ([, entryCode, country]) => entryCode === code && country === region
    );
    const base =
      entries.find(
        ([, entryCode, country]) => entryCode === code && !country
      ) ??
      entries.find(
        ([, entryCode, country]) => entryCode === code && country === code
      );
    const match = exact ?? base;

    if (match) {
      return match[0];
    }
  }

  return 1;
}
