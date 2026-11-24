import { readFileSync } from 'fs';
import path from 'path';
import type { ProviderSelectOption } from '../../frontend/src/DemoApi/DemoTypes.ts';
import {
  listFiles,
  matchBlock,
  parseAttributeArguments,
  parseIntegerLiteral,
  splitBases,
  unquote,
} from './csharp.mts';

export interface ClassInfo {
  name: string;
  bases: string[];
  body: string;
  isAbstract: boolean;
  file: string;
}

export interface EnumMember {
  name: string;
  value: number;
  label?: string;
  hint?: string;
  order?: number;
  obsolete: boolean;
}

export interface SourceIndex {
  coreDir: string;
  classes: Map<string, ClassInfo>;
  enums: Map<string, EnumMember[]>;
  constants: Map<string, string>;
  languageOptions: ProviderSelectOption[];
  duplicates: string[];
  used: Set<string>;
}

const CLASS_PATTERN =
  /\b(public|internal)\s+((?:abstract|sealed|static|partial)\s+)*class\s+(\w+)(?:<[^>{]*>)?\s*(?::\s*([^{]+))?\{/g;

function parseEnum(body: string) {
  const members: EnumMember[] = [];
  let nextValue = 0;
  let pendingAttributes = '';

  body
    .replace(/\/\/[^\n]*/g, '')
    .split(/,(?![^(]*\))/)
    .forEach((chunk) => {
      const attributes = Array.from(
        chunk.matchAll(/\[([^\]]*)\]/g),
        (m) => m[1]
      ).join(' ');
      const member = chunk.replace(/\[[^\]]*\]/g, '').trim();

      pendingAttributes += ` ${attributes}`;

      if (!member) {
        return;
      }

      const [memberName, rawValue] = member.split('=').map((p) => p.trim());
      const value = parseIntegerLiteral(rawValue) ?? nextValue;
      const optionMatch = /FieldOption\s*\(([^)]*)\)/.exec(pendingAttributes);
      const option = optionMatch ? parseAttributeArguments(optionMatch[1]) : {};
      const positionalLabel = optionMatch
        ? /^\s*("(?:[^"\\]|\\.)*")/.exec(optionMatch[1])
        : null;

      members.push({
        name: memberName,
        value,
        label: unquote(option.Label) ?? unquote(positionalLabel?.[1]),
        hint: unquote(option.Hint),
        order: option.Order ? Number(option.Order) : undefined,
        obsolete: /Obsolete/.test(pendingAttributes),
      });

      nextValue = value + 1;
      pendingAttributes = '';
    });

  return members;
}

function indexFile(index: SourceIndex, file: string) {
  const text = readFileSync(file, 'utf8');

  for (const match of text.matchAll(CLASS_PATTERN)) {
    const body = matchBlock(text, (match.index ?? 0) + match[0].length - 1);
    const name = match[3];

    if (index.classes.has(name)) {
      index.duplicates.push(name);
    } else {
      index.classes.set(name, {
        name,
        bases: match[4] ? splitBases(match[4]) : [],
        body,
        isAbstract: /abstract/.test(match[2] ?? ''),
        file,
      });
    }

    for (const constant of body.matchAll(
      /public\s+const\s+string\s+(\w+)\s*=\s*("(?:[^"\\]|\\.)*")/g
    )) {
      index.constants.set(`${name}.${constant[1]}`, JSON.parse(constant[2]));
    }
  }

  for (const match of text.matchAll(/\benum\s+(\w+)\s*(?::\s*\w+\s*)?\{/g)) {
    const body = matchBlock(text, (match.index ?? 0) + match[0].length - 1);

    if (index.enums.has(match[1])) {
      index.duplicates.push(match[1]);
    } else {
      index.enums.set(match[1], parseEnum(body));
    }
  }
}

function readLanguageOptions(coreDir: string): ProviderSelectOption[] {
  const source = readFileSync(
    path.join(coreDir, 'Languages', 'Language.cs'),
    'utf8'
  );

  return Array.from(
    source.matchAll(/new Language\((-?\d+),\s*"([^"]+)"\)/g),
    ([, id, name]) => ({ value: Number(id), name, order: 0 })
  )
    .filter((option) => option.value !== 0)
    .sort(
      (a, b) =>
        Number(a.value > 0) - Number(b.value > 0) ||
        a.name.localeCompare(b.name)
    );
}

export function buildSourceIndex(ocularrDir: string): SourceIndex {
  const coreDir = path.join(ocularrDir, 'src', 'NzbDrone.Core');
  const index: SourceIndex = {
    coreDir,
    classes: new Map(),
    enums: new Map(),
    constants: new Map(),
    languageOptions: readLanguageOptions(coreDir),
    duplicates: [],
    used: new Set(),
  };

  listFiles(coreDir).forEach((file) => indexFile(index, file));

  return index;
}

function baseName(base: string) {
  return base.replace(/<[\s\S]*$/, '');
}

export function ancestors(index: SourceIndex, info: ClassInfo) {
  const result: ClassInfo[] = [info];
  let current: ClassInfo | undefined = info;

  while (current) {
    const parentName: string | undefined = current.bases
      .map(baseName)
      .find((base) => index.classes.has(base));

    current = parentName ? index.classes.get(parentName) : undefined;

    if (current) {
      result.push(current);
    }
  }

  return result;
}

export function inherits(index: SourceIndex, info: ClassInfo, base: string) {
  return ancestors(index, info).some((ancestor) =>
    ancestor.bases.some((b) => baseName(b) === base)
  );
}

export function settingsType(index: SourceIndex, info: ClassInfo) {
  return ancestors(index, info)
    .flatMap((ancestor) => ancestor.bases)
    .map((base) => /<\s*(\w+)\s*>/.exec(base)?.[1])
    .find((name): name is string => !!name && index.classes.has(name));
}

export function expression(
  index: SourceIndex,
  info: ClassInfo,
  property: string
) {
  const pattern = new RegExp(`\\b${property}\\s*=>\\s*([^;]+);`);

  return ancestors(index, info)
    .map((ancestor) => pattern.exec(ancestor.body)?.[1]?.trim())
    .find((value) => value !== undefined);
}
