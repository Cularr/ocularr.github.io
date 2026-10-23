import { GLOBAL_DELAY_PROFILE_ORDER, ROOT_FOLDER } from '../constants';
import { JsonObject, JsonValue, Protocol } from '../DemoTypes';
import { seedProvider } from '../providers/providers';
import { qualityDefinitions } from '../qualities/model';
import { defaultQualityProfiles } from '../qualities/profiles';
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
          qualityProfileId: 4,
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
          onEpisodeFileDelete: true,
          onEpisodeFileDeleteForUpgrade: true,
        },
        { host: 'plex', authToken: 'demo' }
      ),
    ]),
    metadata: compact(
      [
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
        name: 'x265 (HD)',
        includeCustomFormatWhenRenaming: false,
        specifications: [
          seedSpecification(
            'x265',
            'ReleaseTitleSpecification',
            '[xh][ ._-]?265|\\bHEVC(\\b|\\d)',
            { required: true }
          ),
          seedSpecification('Not 2160p', 'ResolutionSpecification', 2160, {
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
        enableUsenet: true,
        enableTorrent: true,
        preferredProtocol: 'usenet',
        usenetDelay: 0,
        torrentDelay: 0,
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
        airDateRestriction: false,
        airDateGracePeriod: 0,
        allowSeasonPackWithoutAllEpisodesAired: false,
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
      { id: 1, tvdbId: 121361, title: 'Game of Thrones' },
      { id: 2, tvdbId: 305288, title: 'Stranger Things' },
    ],
    qualityprofile: defaultQualityProfiles(),
    qualitydefinition: qualityDefinitions(),
  };
}
