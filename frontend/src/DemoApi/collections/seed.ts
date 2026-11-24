import { GLOBAL_DELAY_PROFILE_ORDER, ROOT_FOLDER } from '../constants';
import { JsonObject, JsonValue, Protocol } from '../DemoTypes';
import { seedProvider } from '../providers/providers';
import { qualityDefinitions } from '../qualities/model';
import { defaultQualityProfiles, PROFILE_IDS } from '../qualities/profiles';
import { Collections } from './items';

export const INDEXERS: {
  id: number;
  name: string;
  protocol: Protocol;
  implementation: string;
  values: Record<string, JsonValue>;
}[] = [
  {
    id: 1,
    name: 'NZBgeek',
    protocol: 'usenet',
    implementation: 'Newznab',
    values: { baseUrl: 'https://nzbgeek.example', apiKey: 'demo' },
  },
  {
    id: 2,
    name: 'DrunkenSlug',
    protocol: 'usenet',
    implementation: 'Newznab',
    values: { baseUrl: 'https://drunkenslug.example', apiKey: 'demo' },
  },
  {
    id: 3,
    name: 'IPTorrents',
    protocol: 'torrent',
    implementation: 'IPTorrents',
    values: {},
  },
  {
    id: 4,
    name: 'TorrentLeech',
    protocol: 'torrent',
    implementation: 'Torrentleech',
    values: { apiKey: 'demo' },
  },
];

function compact<T>(items: (T | null)[]) {
  return items.filter((item): item is T => item !== null);
}

function seedSpecification(
  name: string,
  implementation: string,
  value: JsonValue,
  extra: JsonObject = {}
): JsonObject {
  return {
    name,
    implementation,
    negate: false,
    required: false,
    fields: [{ name: 'value', value }],
    ...extra,
  };
}

export function seedCollections(): Collections {
  return {
    tag: [
      { id: 1, label: 'kids' },
      { id: 2, label: '4k' },
    ],
    indexer: compact(
      INDEXERS.map((indexer) =>
        seedProvider(
          'indexer',
          indexer.implementation,
          indexer.id,
          indexer.name,
          {
            enableRss: true,
            enableAutomaticSearch: true,
            enableInteractiveSearch: true,
          },
          indexer.values
        )
      )
    ),
    downloadclient: compact([
      seedProvider(
        'downloadclient',
        'Sabnzbd',
        1,
        'SABnzbd',
        {},
        {
          host: 'sabnzbd',
          apiKey: 'demo',
        }
      ),
      seedProvider(
        'downloadclient',
        'QBittorrent',
        2,
        'qBittorrent',
        {},
        {
          host: 'qbittorrent',
          username: 'admin',
          password: 'demo',
        }
      ),
    ]),
    importlist: compact([
      seedProvider(
        'importlist',
        'PlexImport',
        1,
        'Plex Watchlist',
        {
          rootFolderPath: ROOT_FOLDER,
          qualityProfileId: PROFILE_IDS.medium,
        },
        { accessToken: 'demo' }
      ),
    ]),
    connection: compact([
      seedProvider(
        'connection',
        'Discord',
        1,
        'Discord',
        {
          onGrab: true,
          onDownload: true,
          onUpgrade: true,
          onImportComplete: true,
          onHealthIssue: true,
          onHealthRestored: true,
          onApplicationUpdate: true,
        },
        { webHookUrl: 'https://discord.com/api/webhooks/demo' }
      ),
      seedProvider(
        'connection',
        'PlexServer',
        2,
        'Plex Media Server',
        {
          onDownload: true,
          onUpgrade: true,
          onRename: true,
          onSeriesDelete: true,
          onWorkFileDelete: true,
          onWorkFileDeleteForUpgrade: true,
        },
        { host: 'plex', authToken: 'demo' }
      ),
    ]),
    pluginsource: [],
    metadata: compact(
      [
        ['ComicTagsMetadata', 'Comic Tags'],
        ['XbmcMetadata', 'Kodi (XBMC) / Emby'],
        ['RoksboxMetadata', 'Roksbox'],
        ['WdtvMetadata', 'WDTV'],
        ['PlexMetadata', 'Plex'],
      ].map(([implementation, name], index) =>
        seedProvider(
          'metadata',
          implementation,
          index + 1,
          name,
          { enable: index === 0 },
          {}
        )
      )
    ),
    customformat: [
      {
        id: 1,
        name: 'Digital release',
        includeCustomFormatWhenRenaming: false,
        specifications: [
          seedSpecification(
            'Digital',
            'ReleaseTitleSpecification',
            '\\bdigital\\b',
            { required: true }
          ),
          seedSpecification('Exclude ELQ', 'ResolutionSpecification', 1, {
            negate: true,
            required: true,
          }),
        ],
      },
      {
        id: 2,
        name: 'Repack/Proper',
        includeCustomFormatWhenRenaming: true,
        specifications: [
          seedSpecification(
            'Repack',
            'ReleaseTitleSpecification',
            '\\b(repack|proper)\\b'
          ),
        ],
      },
    ],
    delayprofile: [
      {
        id: 1,
        items: [
          { protocol: 'usenet', name: 'Usenet', allowed: true, delay: 0 },
          { protocol: 'torrent', name: 'Torrent', allowed: true, delay: 0 },
        ],
        bypassIfHighestQuality: true,
        bypassIfAboveCustomFormatScore: false,
        minimumCustomFormatScore: 0,
        order: GLOBAL_DELAY_PROFILE_ORDER,
        tags: [],
      },
    ],
    releaseprofile: [
      {
        id: 1,
        name: 'Hardcoded subtitles',
        enabled: true,
        required: [],
        ignored: ['HC', 'hardsub'],
        releaseDateRestriction: false,
        releaseDateGracePeriod: 0,
        allowVolumePackWithoutAllChaptersReleased: false,
        indexerIds: [],
        tags: [],
        excludedTags: [],
      },
    ],
    remotepathmapping: [],
    rootfolder: [{ id: 1, path: ROOT_FOLDER }],
    autotagging: [
      {
        id: 1,
        name: 'Kids',
        removeTagsAutomatically: true,
        tags: [1],
        specifications: [
          seedSpecification('Family', 'GenreSpecification', [
            'Animation',
            'Family',
            'Children',
          ]),
        ],
      },
    ],
    customfilter: [],
    importlistexclusion: [
      {
        id: 1,
        foreignSeriesId: '31b9ed1a-d31e-860c-9776-26a12907ce5b',
        title: 'NARUTO',
      },
      {
        id: 2,
        foreignSeriesId: '9ec0d686-da98-851a-b69b-eeca7c7ce99c',
        title: 'ATTACK ON TITAN',
      },
    ],
    qualityprofile: defaultQualityProfiles(),
    qualitydefinition: qualityDefinitions(),
  };
}
