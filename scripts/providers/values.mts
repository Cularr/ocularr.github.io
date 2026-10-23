import type {
  JsonValue,
  ProviderSelectOption,
} from '../../frontend/src/DemoApi/DemoTypes.ts';
import { matchBlock, unquote } from './csharp.mts';
import { ancestors, type ClassInfo, type SourceIndex } from './sourceIndex.mts';

const LIST_TYPE = /IEnumerable|List|\[\]/;
const NUMBER_TYPE = /^(int|long|double|decimal|float)\??$/;

export function defaultsFor(index: SourceIndex, info: ClassInfo) {
  const defaults = new Map<string, string>();

  ancestors(index, info)
    .reverse()
    .forEach((ancestor) => {
      const constructor = new RegExp(
        `public\\s+${ancestor.name}\\s*\\(\\s*\\)\\s*(?::\\s*base\\([^)]*\\)\\s*)?\\{`
      ).exec(ancestor.body);

      if (constructor) {
        const body = matchBlock(
          ancestor.body,
          (constructor.index ?? 0) + constructor[0].length - 1
        );

        for (const [, key, value] of body.matchAll(
          /^\s*(\w+)\s*=\s*([^;]+);/gm
        )) {
          defaults.set(key, value.trim());
        }
      }

      for (const [, key, value] of ancestor.body.matchAll(
        /(\w+)\s*\{\s*get;\s*set;\s*\}\s*=\s*([^;]+);/g
      )) {
        defaults.set(key, value.trim());
      }
    });

  return defaults;
}

function enumOrConstant(index: SourceIndex, value: string) {
  const match = /^(\w+)\.(\w+)$/.exec(value);

  if (!match) {
    return undefined;
  }

  const member = index.enums.get(match[1])?.find((m) => m.name === match[2]);

  return member ? member.value : index.constants.get(value);
}

function parseLiteral(
  index: SourceIndex,
  raw: string,
  type: string
): JsonValue | undefined {
  const value = raw.replace(/^\(int\)\s*/, '');

  if (/^@?"/.test(value)) {
    return unquote(value);
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (value === 'null') {
    return null;
  }

  if (value === 'string.Empty') {
    return '';
  }

  const named = enumOrConstant(index, value);

  if (named !== undefined) {
    return named;
  }

  const list = /\{([^}]*)\}/.exec(value);

  if (LIST_TYPE.test(type) && list) {
    return list[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => literal(index, item, 'int'));
  }

  return undefined;
}

function typeDefault(index: SourceIndex, type: string): JsonValue {
  if (LIST_TYPE.test(type)) {
    return [];
  }

  if (type.endsWith('?')) {
    return null;
  }

  if (NUMBER_TYPE.test(type) || index.enums.has(type)) {
    return 0;
  }

  if (type === 'bool') {
    return false;
  }

  return type === 'string' ? '' : null;
}

export function literal(
  index: SourceIndex,
  raw: string | undefined,
  type: string
): JsonValue {
  const parsed = raw === undefined ? undefined : parseLiteral(index, raw, type);

  return parsed === undefined ? typeDefault(index, type) : parsed;
}

export function selectOptions(
  index: SourceIndex,
  typeName: string
): ProviderSelectOption[] | undefined {
  const members = index.enums.get(typeName);

  index.used.add(typeName);

  if (!members) {
    return typeName === 'RealLanguageFieldConverter'
      ? index.languageOptions
      : undefined;
  }

  return members
    .filter((member) => !member.obsolete)
    .map((member) =>
      member.label === undefined
        ? {
            value: member.value,
            name: member.name.replace(/_/g, ' '),
            order: member.value,
          }
        : {
            value: member.value,
            name: member.label,
            order: member.order ?? 0,
            hint: member.hint ?? `(${member.value})`,
          }
    )
    .sort((a, b) => a.order - b.order);
}
