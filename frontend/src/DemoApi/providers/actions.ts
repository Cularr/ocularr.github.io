import { JsonObject } from '../DemoTypes';

const NEWZNAB_CATEGORIES: [number, string, number?][] = [
  [7000, 'Books'],
  [7010, 'Mags', 7000],
  [7020, 'EBook', 7000],
  [7030, 'Comics', 7000],
  [7040, 'Technical', 7000],
  [7050, 'Other', 7000],
  [7060, 'Foreign', 7000],
];

export function providerAction(name: string): JsonObject | null {
  if (name === 'newznabcategories') {
    return {
      options: NEWZNAB_CATEGORIES.map(([value, label, parentValue], order) => ({
        value,
        name: label,
        order,
        hint: `(${value})`,
        parentValue,
      })),
    };
  }

  if (/oauth|token/i.test(name)) {
    return null;
  }

  return { options: [] };
}
