import { JsonObject, JsonValue } from '../DemoTypes';
import { prepareProvider, providerResource } from '../providers/providers';
import { PROVIDER_KINDS, providerKind } from '../providers/registry';
import {
  prepareSpecification,
  specificationResource,
} from '../providers/specifications';

const COLLECTIONS = [
  'tag',
  'indexer',
  'downloadclient',
  'importlist',
  'connection',
  'metadata',
  'customformat',
  'delayprofile',
  'releaseprofile',
  'remotepathmapping',
  'rootfolder',
  'autotagging',
  'customfilter',
  'importlistexclusion',
  'qualityprofile',
  'qualitydefinition',
];

export type Collections = Record<string, JsonObject[]>;

export function collectionName(name: string) {
  const kind = providerKind(name);

  return COLLECTIONS.includes(kind) ? kind : null;
}

export function renderItem(
  collections: Collections,
  name: string,
  item: JsonObject
): JsonObject {
  if (PROVIDER_KINDS.includes(name)) {
    return providerResource(name, item);
  }

  if (name === 'customformat' || name === 'autotagging') {
    return {
      ...item,
      specifications: ((item.specifications ?? []) as JsonObject[]).map(
        (specification) => specificationResource(name, specification)
      ),
    };
  }

  if (name === 'qualityprofile') {
    const scores = new Map(
      ((item.formatItems ?? []) as JsonObject[]).map((formatItem) => [
        formatItem.format,
        formatItem.score,
      ])
    );

    return {
      ...item,
      formatItems: (collections.customformat ?? []).map((format) => ({
        format: format.id,
        name: format.name,
        score: scores.get(format.id) ?? 0,
      })),
    };
  }

  if (name === 'rootfolder') {
    return {
      ...item,
      accessible: true,
      isEmpty: false,
      freeSpace: 3.8e12,
      totalSpace: 8e12,
      unmappedFolders: [],
    };
  }

  return item;
}

export function prepareItem(
  name: string,
  body: JsonObject,
  existing?: JsonObject
): JsonObject {
  if (PROVIDER_KINDS.includes(name)) {
    return prepareProvider(name, body, existing);
  }

  if (name === 'customformat' || name === 'autotagging') {
    return {
      ...body,
      specifications: ((body.specifications ?? []) as JsonObject[]).map(
        prepareSpecification
      ),
    };
  }

  if (name === 'rootfolder') {
    return { path: body.path };
  }

  return body;
}

export function validateItem(name: string, body: JsonObject) {
  const failures: JsonObject[] = [];

  const required = (propertyName: string, label: string) => {
    const value = body[propertyName];

    if (value === undefined || value === null || String(value).trim() === '') {
      failures.push({
        propertyName,
        errorMessage: `'${label}' must not be empty.`,
        attemptedValue: (value ?? null) as JsonValue,
        severity: 'error',
        errorCode: 'NotEmptyValidator',
        isWarning: false,
      });
    }
  };

  if (
    PROVIDER_KINDS.includes(name) ||
    ['customformat', 'autotagging', 'qualityprofile'].includes(name)
  ) {
    required('name', 'Name');
  }

  if (name === 'rootfolder') {
    required('path', 'Path');
  }

  if (name === 'tag') {
    required('label', 'Label');
  }

  if (name === 'remotepathmapping') {
    required('host', 'Host');
    required('remotePath', 'Remote Path');
    required('localPath', 'Local Path');
  }

  return failures;
}
