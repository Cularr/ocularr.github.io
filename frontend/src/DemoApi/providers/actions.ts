import { JsonObject } from '../DemoTypes';

const NEWZNAB_CATEGORIES: [number, string, number?][] = [
  [5000, 'TV'],
  [5010, 'TV/WEB-DL', 5000],
  [5020, 'TV/Foreign', 5000],
  [5030, 'TV/SD', 5000],
  [5040, 'TV/HD', 5000],
  [5045, 'TV/UHD', 5000],
  [5050, 'TV/Other', 5000],
  [5060, 'TV/Sport', 5000],
  [5070, 'TV/Anime', 5000],
  [5080, 'TV/Documentary', 5000],
];

export function providerAction(name: string): JsonObject | null {
  if (name === 'newznabCategories') {
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
