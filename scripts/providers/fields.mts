import type { ProviderField } from '../../frontend/src/DemoApi/DemoTypes.ts';
import {
  camelCase,
  collectAttribute,
  parseAttributeArguments,
  unquote,
} from './csharp.mts';
import { ancestors, type ClassInfo, type SourceIndex } from './sourceIndex.mts';
import { defaultsFor, literal, selectOptions } from './values.mts';

interface FieldGroup {
  order: number;
  fields: ProviderField[];
}

interface FieldContext {
  index: SourceIndex;
  settingsName: string;
  prefix: string;
  seen: Set<string>;
  defaults: Map<string, string>;
}

const PROPERTY_PATTERN =
  /^((?:\s*\[(?:[^\]"]|"(?:[^"\\]|\\.)*")*\])*)\s*public\s+(?:override\s+|virtual\s+|new\s+)*([\w<>[\],?\s]+?)\s+(\w+)\s*(?:\{|=>)/;

const TOKEN_PATTERN =
  /FieldToken\(TokenField\.(\w+),\s*"[^"]*",\s*"([^"]*)",\s*"((?:[^"\\]|\\.)*)"\)/g;

const SIMPLE_TYPE = /^(string|int|long|double|bool|decimal|float)\??$/;

function fieldTokens(attributes: string) {
  const tokens: Record<string, Record<string, string>> = {};

  for (const [, field, name, value] of attributes.matchAll(TOKEN_PATTERN)) {
    const key = `${camelCase(field)}Tokens`;

    tokens[key] = { ...tokens[key], [name]: value };
  }

  return tokens;
}

function isNestedSettings(index: SourceIndex, type: string) {
  return (
    !SIMPLE_TYPE.test(type) &&
    !/IEnumerable|List|\[\]/.test(type) &&
    !index.enums.has(type.replace('?', '')) &&
    index.classes.has(type)
  );
}

function enumName(raw: string | undefined, prefix: string, fallback: string) {
  return camelCase((raw ?? `${prefix}.${fallback}`).replace(`${prefix}.`, ''));
}

function buildField(
  context: FieldContext,
  args: string,
  attributes: string,
  type: string,
  propertyName: string
): ProviderField {
  const { index, prefix, defaults } = context;
  const options = parseAttributeArguments(args);
  const fieldType = enumName(options.Type, 'FieldType', 'Textbox');
  const field: ProviderField = {
    order: Number(/^\s*(-?\d+)/.exec(args)?.[1] ?? 0),
    name: `${prefix}${camelCase(propertyName)}`,
    label: unquote(options.Label) ?? '',
    unit: unquote(options.Unit),
    helpText: unquote(options.HelpText),
    helpTextWarning: unquote(options.HelpTextWarning),
    helpLink: unquote(options.HelpLink),
    value: literal(index, defaults.get(propertyName), type),
    type: fieldType,
    advanced: options.Advanced === 'true',
    privacy: enumName(options.Privacy, 'PrivacyLevel', 'Normal'),
    placeholder: unquote(options.Placeholder),
    isFloat: fieldType === 'number' && /^double\??$/.test(type),
    ...fieldTokens(attributes),
  };

  if (options.Section) {
    field.section =
      unquote(options.Section) ?? index.constants.get(options.Section);
  }

  if (options.Hidden && options.Hidden !== 'HiddenType.Visible') {
    field.hidden = enumName(options.Hidden, 'HiddenType', 'Visible');
  }

  if (fieldType === 'select' || fieldType === 'tagSelect') {
    if (options.SelectOptionsProviderAction) {
      field.selectOptionsProviderAction = unquote(
        options.SelectOptionsProviderAction
      );
    } else if (options.SelectOptions) {
      field.selectOptions =
        selectOptions(
          index,
          options.SelectOptions.replace(/^typeof\((\w+)\)$/, '$1')
        ) ?? [];
    }
  }

  return field;
}

function collectFields(
  context: FieldContext,
  ancestor: ClassInfo,
  names: Set<string>
): FieldGroup[] {
  return Array.from(ancestor.body.matchAll(/\[FieldDefinition\s*\(/g)).flatMap(
    (match) => {
      const start = (match.index ?? 0) + match[0].length - 1;
      const args = collectAttribute(ancestor.body, start);
      const after = ancestor.body
        .slice(start + args.length + 2)
        .replace(/^\s*\]/, '');
      const property = PROPERTY_PATTERN.exec(after);

      if (!property || names.has(property[3])) {
        return [];
      }

      const [, attributes, rawType, propertyName] = property;
      const type = rawType.replace(/\s+/g, '');
      const order = Number(/^\s*(-?\d+)/.exec(args)?.[1] ?? 0);

      names.add(propertyName);

      if (isNestedSettings(context.index, type)) {
        return [
          {
            order,
            fields: fieldsFor(
              context.index,
              type,
              `${context.prefix}${camelCase(propertyName)}.`,
              new Set([...context.seen, context.settingsName])
            ),
          },
        ];
      }

      return [
        {
          order,
          fields: [buildField(context, args, attributes, type, propertyName)],
        },
      ];
    }
  );
}

export function fieldsFor(
  index: SourceIndex,
  settingsName: string,
  prefix = '',
  seen = new Set<string>()
): ProviderField[] {
  const info = index.classes.get(settingsName);

  index.used.add(settingsName);

  if (!info || seen.has(settingsName)) {
    return [];
  }

  const context: FieldContext = {
    index,
    settingsName,
    prefix,
    seen,
    defaults: defaultsFor(index, info),
  };
  const names = new Set<string>();

  return ancestors(index, info)
    .flatMap((ancestor) => collectFields(context, ancestor, names))
    .sort((a, b) => a.order - b.order)
    .flatMap((group) => group.fields);
}

export function renumber(fields: ProviderField[]) {
  return fields.map((field, order) => ({ ...field, order }));
}
