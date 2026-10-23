import { readdirSync, statSync } from 'fs';
import path from 'path';

export function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);

    if (statSync(full).isDirectory()) {
      return listFiles(full);
    }

    return entry.endsWith('.cs') ? [full] : [];
  });
}

function matchDelimited(
  text: string,
  start: number,
  open: string,
  close: string
) {
  let depth = 0;

  for (let index = start; index < text.length; index++) {
    if (text[index] === open) {
      depth += 1;
    } else if (text[index] === close) {
      depth -= 1;

      if (depth === 0) {
        return text.slice(start + 1, index);
      }
    }
  }

  return null;
}

export function matchBlock(text: string, start: number) {
  return matchDelimited(text, start, '{', '}') ?? text.slice(start + 1);
}

export function collectAttribute(text: string, start: number) {
  return matchDelimited(text, start, '(', ')') ?? '';
}

export function camelCase(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function splitBases(bases: string) {
  const result: string[] = [];
  let depth = 0;
  let current = '';

  for (const character of bases) {
    if (character === '<') {
      depth += 1;
    } else if (character === '>') {
      depth -= 1;
    }

    if (character === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result.map((base) => base.replace(/\bwhere\b[\s\S]*$/, '').trim());
}

export function parseAttributeArguments(text: string) {
  const values: Record<string, string> = {};
  const pattern =
    /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|@"[^"]*"|typeof\(\w+\)|[\w.]+)/g;

  for (const [, key, raw] of text.matchAll(pattern)) {
    values[key] = raw;
  }

  return values;
}

export function unquote(raw: string | undefined) {
  if (!raw) {
    return undefined;
  }

  if (raw.startsWith('@"')) {
    return raw.slice(2, -1);
  }

  if (raw.startsWith('"')) {
    return JSON.parse(raw) as string;
  }

  return undefined;
}

export function parseIntegerLiteral(raw: string | undefined) {
  const value = raw?.trim() ?? '';

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  if (/^0x[\da-f]+$/i.test(value)) {
    return parseInt(value.slice(2), 16);
  }

  const shift = /^(\d+)\s*<<\s*(\d+)$/.exec(value);

  return shift ? Number(shift[1]) * 2 ** Number(shift[2]) : undefined;
}
