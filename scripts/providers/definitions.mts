import path from 'path';
import type {
  JsonValue,
  Protocol,
  ProviderDefinition,
  ProvidersFile,
} from '../../frontend/src/DemoApi/DemoTypes.ts';
import { camelCase, unquote } from './csharp.mts';
import { fieldsFor, renumber } from './fields.mts';
import {
  ancestors,
  type ClassInfo,
  expression,
  inherits,
  settingsType,
  type SourceIndex,
} from './sourceIndex.mts';

const KINDS: { kind: string; folders: string[]; base: string }[] = [
  { kind: 'indexer', folders: ['Indexers'], base: 'IndexerBase' },
  {
    kind: 'downloadclient',
    folders: ['Download/Clients'],
    base: 'DownloadClientBase',
  },
  {
    kind: 'pluginsource',
    folders: ['Plugins/Sources'],
    base: 'PluginSourceBase',
  },
  { kind: 'importlist', folders: ['ImportLists'], base: 'ImportListBase' },
  { kind: 'connection', folders: ['Notifications'], base: 'NotificationBase' },
  {
    kind: 'metadata',
    folders: ['Extras/Metadata/Consumers'],
    base: 'MetadataBase',
  },
];

const SPECIFICATIONS: { kind: string; folder: string; base: string }[] = [
  {
    kind: 'customformat',
    folder: 'CustomFormats/Specifications',
    base: 'CustomFormatSpecificationBase',
  },
  {
    kind: 'autotagging',
    folder: 'AutoTagging/Specifications',
    base: 'AutoTaggingSpecificationBase',
  },
];

const NOTIFICATION_EVENTS: [string, string][] = [
  ['OnGrab', 'OnGrab'],
  ['OnDownload', 'OnDownload'],
  ['OnUpgrade', 'OnDownload'],
  ['OnImportComplete', 'OnImportComplete'],
  ['OnRename', 'OnRename'],
  ['OnSeriesAdd', 'OnSeriesAdd'],
  ['OnSeriesDelete', 'OnSeriesDelete'],
  ['OnWorkFileDelete', 'OnWorkFileDelete'],
  ['OnWorkFileDeleteForUpgrade', 'OnWorkFileDelete'],
  ['OnHealthIssue', 'OnHealthIssue'],
  ['OnHealthRestored', 'OnHealthRestored'],
  ['OnApplicationUpdate', 'OnApplicationUpdate'],
  ['OnManualInteractionRequired', 'OnManualInteractionRequired'],
  ['OnChapterRetag', 'OnChapterRetag'],
];

const DEFAULT_REFRESH_HOURS = 6;

function nameFor(index: SourceIndex, info: ClassInfo) {
  const raw = expression(index, info, 'Name');
  const literalName = unquote(raw);

  if (literalName !== undefined) {
    return { implementationName: literalName };
  }

  const localized =
    /GetLocalizedString\("(\w+)"(?:[\s\S]*?\{\s*"(\w+)",\s*"([^"]*)"\s*\})?/.exec(
      raw ?? ''
    );

  if (!localized) {
    return { implementationName: info.name };
  }

  return {
    implementationName: localized[1],
    implementationNameKey: localized[1],
    implementationNameTokens: localized[2]
      ? { [localized[2]]: localized[3] }
      : undefined,
  };
}

function presetsFor(info: ClassInfo) {
  return Array.from(
    info.body.matchAll(
      /GetDefinition\("([^"]+)",\s*GetSettings\("([^"]+)"([^;]*)\)\);/g
    ),
    ([, name, url, rest]) => {
      const values: Record<string, JsonValue> = { baseUrl: url };
      const apiPath = /apiPath:\s*@?"([^"]+)"/.exec(rest);
      const categories = /categories:\s*new\[\]\s*\{([^}]*)\}/.exec(rest);

      if (apiPath) {
        values.apiPath = apiPath[1];
      }

      if (categories) {
        values.categories = categories[1]
          .split(',')
          .map((item) => Number(item.trim()));
      }

      return { name, values };
    }
  );
}

function refreshInterval(raw: string | undefined) {
  const match =
    /FromHours\((\d+)\)|FromMinutes\((\d+)\)|FromDays\((\d+)\)/.exec(raw ?? '');
  const hours = match
    ? Number(match[1] ?? 0) +
      Number(match[2] ?? 0) / 60 +
      Number(match[3] ?? 0) * 24
    : DEFAULT_REFRESH_HOURS;
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${pad(Math.floor(hours))}:${pad(Math.round((hours % 1) * 60))}:00`;
}

function notificationSupport(index: SourceIndex, info: ClassInfo) {
  const own = ancestors(index, info)
    .filter((ancestor) => ancestor.name !== 'NotificationBase')
    .map((ancestor) => ancestor.body)
    .join('\n');

  return Object.fromEntries(
    NOTIFICATION_EVENTS.map(([event, method]) => [
      event,
      new RegExp(`override\\s+(?:async\\s+)?\\w+\\s+${method}\\s*\\(`).test(
        own
      ),
    ])
  );
}

function providerDefinition(
  index: SourceIndex,
  kind: string,
  info: ClassInfo
): ProviderDefinition {
  const settings = settingsType(index, info);
  const definition: ProviderDefinition = {
    implementation: info.name,
    ...nameFor(index, info),
    configContract: settings ?? `${info.name}Settings`,
    infoLink: `https://wiki.servarr.com/sonarr/supported#${info.name.toLowerCase()}`,
    fields: settings ? renumber(fieldsFor(index, settings)) : [],
    presets: presetsFor(info),
  };
  const read = (property: string) => expression(index, info, property);

  if (kind === 'indexer' || kind === 'downloadclient') {
    const protocol = read('Protocol')?.replace('DownloadProtocol.', '');

    if (protocol) {
      definition.protocol = camelCase(protocol) as Protocol;
    }
  }

  if (kind === 'indexer') {
    definition.supportsRss = read('SupportsRss') !== 'false';
    definition.supportsSearch = read('SupportsSearch') !== 'false';
  }

  if (kind === 'importlist') {
    definition.listType = camelCase(
      (read('ListType') ?? 'ImportListType.Other').replace(
        'ImportListType.',
        ''
      )
    );
    definition.minRefreshInterval = refreshInterval(read('MinRefreshInterval'));
  }

  if (kind === 'connection') {
    definition.link = unquote(read('Link'));
    definition.supports = notificationSupport(index, info);
  }

  return definition;
}

function concreteClasses(index: SourceIndex, roots: string[], base: string) {
  return Array.from(index.classes.values()).filter(
    (info) =>
      !info.isAbstract &&
      roots.some((root) => info.file.startsWith(root)) &&
      inherits(index, info, base)
  );
}

export function extractDefinitions(index: SourceIndex): ProvidersFile {
  const result: ProvidersFile = {};

  KINDS.forEach(({ kind, folders, base }) => {
    const roots = folders.map((folder) => path.join(index.coreDir, folder));

    result[kind] = concreteClasses(index, roots, base)
      .map((info) => providerDefinition(index, kind, info))
      .filter((definition) => definition.implementation !== 'RssImportBase')
      .sort((a, b) => a.implementationName.localeCompare(b.implementationName));
  });

  SPECIFICATIONS.forEach(({ kind, folder, base }) => {
    const root = path.join(index.coreDir, folder);

    result[kind] = concreteClasses(index, [root], base)
      .map((info) => ({
        order: Number(expression(index, info, 'Order') ?? 0),
        definition: {
          implementation: info.name,
          implementationName:
            unquote(expression(index, info, 'ImplementationName')) ?? info.name,
          configContract: info.name,
          infoLink: unquote(expression(index, info, 'InfoLink')) ?? '',
          fields: renumber(fieldsFor(index, info.name)),
          presets: [],
        },
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ definition }) => definition);
  });

  return result;
}
