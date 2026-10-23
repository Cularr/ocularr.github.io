import type {
  JsonValue,
  ProviderDefinition,
  ProvidersFile,
} from '../../frontend/src/DemoApi/DemoTypes.ts';

const URL_VALUE = /^https?:\/\//;

export function fakeIndexerUrl(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

  return `https://${slug || 'indexer'}.example`;
}

function replaceUrl(value: JsonValue, name: string) {
  return typeof value === 'string' && URL_VALUE.test(value)
    ? fakeIndexerUrl(name)
    : value;
}

function withFakeUrls(definition: ProviderDefinition): ProviderDefinition {
  return {
    ...definition,
    fields: definition.fields.map((field) => ({
      ...field,
      value: replaceUrl(field.value, definition.implementationName),
    })),
    presets: definition.presets.map((preset) => ({
      ...preset,
      values: Object.fromEntries(
        Object.entries(preset.values).map(([key, value]) => [
          key,
          replaceUrl(value, preset.name),
        ])
      ),
    })),
  };
}

export function hideIndexerUrls(definitions: ProvidersFile): ProvidersFile {
  return {
    ...definitions,
    indexer: (definitions.indexer ?? []).map(withFakeUrls),
  };
}
