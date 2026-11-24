import { ENGLISH } from '../constants';
import { JsonObject, JsonValue, ProviderDefinition } from '../DemoTypes';
import {
  fieldResource,
  isPrivate,
  PRIVATE_VALUE,
  storedValues,
} from './fields';
import { definitionFor, definitions, implementationName } from './registry';

function kindDefaults(
  kind: string,
  definition: ProviderDefinition,
  index: number
): JsonObject {
  switch (kind) {
    case 'indexer':
      return {
        enableRss: definition.supportsRss ?? true,
        enableAutomaticSearch: definition.supportsSearch ?? true,
        enableInteractiveSearch: definition.supportsSearch ?? true,
        supportsRss: definition.supportsRss ?? true,
        supportsSearch: definition.supportsSearch ?? true,
        protocol: definition.protocol ?? 'unknown',
        priority: 25,
        volumeSearchMaximumSingleChapterAge: 0,
        downloadClientId: 0,
      };
    case 'downloadclient':
      return {
        enable: true,
        protocol: definition.protocol ?? 'unknown',
        priority: 1,
        removeCompletedDownloads: true,
        removeFailedDownloads: true,
      };
    case 'importlist':
      return {
        enableAutomaticAdd: true,
        searchForMissingChapters: true,
        shouldMonitor: 'all',
        monitorNewItems: 'all',
        rootFolderPath: '',
        qualityProfileId: 0,
        ordering: 'hierarchical',
        language: ENGLISH,
        volumeFolder: true,
        listType: definition.listType ?? 'other',
        listOrder: index,
        minRefreshInterval: definition.minRefreshInterval ?? '06:00:00',
        tagExisting: 'none',
      };
    case 'connection':
      return {
        link: definition.link ?? null,
        includeHealthWarnings: false,
        testCommand: null,
        ...Object.fromEntries(
          Object.entries(definition.supports ?? {}).flatMap(
            ([event, supported]) => [
              [`on${event.slice(2)}`, false],
              [`supportsOn${event.slice(2)}`, supported],
            ]
          )
        ),
      };
    case 'metadata':
      return { enable: false };
    default:
      return {};
  }
}

function schemaResource(
  kind: string,
  definition: ProviderDefinition,
  index: number,
  values = new Map<string, JsonValue>()
): JsonObject {
  return {
    id: 0,
    name: '',
    implementation: definition.implementation,
    implementationName: implementationName(definition),
    configContract: definition.configContract,
    infoLink: definition.infoLink,
    tags: [],
    ...kindDefaults(kind, definition, index),
    fields: definition.fields.map((field) =>
      fieldResource(
        field,
        values.has(field.name)
          ? (values.get(field.name) as JsonValue)
          : field.value
      )
    ),
  };
}

export function providerSchema(kind: string): JsonObject[] {
  return (definitions[kind] ?? []).map((definition, index) => ({
    ...schemaResource(kind, definition, index),
    presets: definition.presets.map((preset) => ({
      ...schemaResource(
        kind,
        definition,
        index,
        new Map(Object.entries(preset.values))
      ),
      name: preset.name,
      enableRss: false,
      enableAutomaticSearch: false,
      enableInteractiveSearch: false,
    })),
  }));
}

export function providerResource(kind: string, item: JsonObject): JsonObject {
  const definition = definitionFor(kind, item.implementation);

  if (!definition) {
    return item;
  }

  const index = (definitions[kind] ?? []).indexOf(definition);
  const { fields: _fields, ...rest } = item;

  return {
    ...schemaResource(kind, definition, index, storedValues(item)),
    ...rest,
  };
}

export function prepareProvider(
  kind: string,
  body: JsonObject,
  existing?: JsonObject
): JsonObject {
  const definition = definitionFor(kind, body.implementation);
  const previous = existing ? storedValues(existing) : new Map();
  const fields = ((body.fields ?? []) as JsonObject[]).map((field) => {
    const name = String(field.name);
    const fieldDefinition = definition?.fields.find((f) => f.name === name);
    const value =
      fieldDefinition &&
      isPrivate(fieldDefinition) &&
      field.value === PRIVATE_VALUE
        ? previous.get(name) ?? ''
        : field.value;

    return { name, value: (value ?? null) as JsonValue };
  });
  const {
    presets: _presets,
    implementationName: _implementationName,
    infoLink: _infoLink,
    message: _message,
    ...rest
  } = body;

  return { ...rest, fields };
}

export function seedProvider(
  kind: string,
  implementation: string,
  id: number,
  name: string,
  overrides: JsonObject,
  values: Record<string, JsonValue>
): JsonObject | null {
  const definition = definitionFor(kind, implementation);

  if (!definition) {
    return null;
  }

  const index = (definitions[kind] ?? []).indexOf(definition);

  return {
    id,
    name,
    implementation,
    configContract: definition.configContract,
    tags: [],
    ...kindDefaults(kind, definition, index),
    ...overrides,
    fields: definition.fields.map((field) => ({
      name: field.name,
      value: field.name in values ? values[field.name] : field.value,
    })),
  };
}
