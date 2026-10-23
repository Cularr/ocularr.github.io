import { JsonObject } from './DemoTypes';

export function defaultSettings(): Record<string, JsonObject> {
  return {
    ui: {
      id: 1,
      firstDayOfWeek: 1,
      calendarWeekColumnHeader: 'ddd M/D',
      shortDateFormat: 'MMM D YYYY',
      longDateFormat: 'dddd, MMMM D YYYY',
      timeFormat: 'h(:mm)a',
      timeZone: '',
      showRelativeDates: true,
      enableColorImpairedMode: false,
      theme: 'auto',
      headerColor: 'fullColor',
      uiLanguage: 1,
    },
    general: {
      id: 1,
      bindAddress: '*',
      port: 8989,
      sslPort: 9898,
      enableSsl: false,
      launchBrowser: true,
      authenticationMethod: 'forms',
      authenticationRequired: 'enabled',
      allowedHosts: '',
      analyticsEnabled: false,
      username: 'demo',
      password: '********',
      passwordConfirmation: '',
      oidcAuthority: '',
      oidcClientId: '',
      oidcClientSecret: '',
      oidcUserIdentifier: '',
      oidcScopes: 'openid profile email',
      logLevel: 'info',
      logSizeLimit: 1,
      consoleLogLevel: '',
      branch: 'main',
      apiKey: '0123456789abcdef0123456789abcdef',
      sslCertPath: '',
      sslKeyPath: '',
      sslCertPassword: '',
      urlBase: '',
      trustedNetworks: '',
      instanceName: 'Sonarr',
      applicationUrl: '',
      updateAutomatically: false,
      updateMechanism: 'builtIn',
      updateScriptPath: '',
      proxyEnabled: false,
      proxyType: 'http',
      proxyHostname: '',
      proxyPort: 8080,
      proxyUsername: '',
      proxyPassword: '',
      proxyBypassFilter: '',
      proxyBypassLocalAddresses: true,
      certificateValidation: 'enabled',
      backupFolder: 'Backups',
      backupInterval: 7,
      backupRetention: 28,
    },
    mediamanagement: {
      id: 1,
      autoUnmonitorPreviouslyDownloadedEpisodes: false,
      recycleBin: '',
      recycleBinCleanupDays: 7,
      downloadPropersAndRepacks: 'preferAndUpgrade',
      createEmptySeriesFolders: false,
      deleteEmptyFolders: false,
      fileDate: 'none',
      rescanAfterRefresh: 'always',
      setPermissionsLinux: false,
      chmodFolder: '755',
      chownGroup: '',
      episodeTitleRequired: 'always',
      skipFreeSpaceCheckWhenGrabbing: false,
      skipFreeSpaceCheckWhenImporting: false,
      minimumFreeSpaceWhenImporting: 100,
      copyUsingHardlinks: true,
      useScriptImport: false,
      scriptImportPath: '',
      importExtraFiles: false,
      extraFileExtensions: 'srt',
      enableMediaInfo: true,
      userRejectedExtensions: '',
      seasonPackUpgrade: 'all',
      seasonPackUpgradeThreshold: 100,
    },
    naming: {
      id: 1,
      renameEpisodes: true,
      replaceIllegalCharacters: true,
      colonReplacementFormat: 4,
      customColonReplacementFormat: '',
      multiEpisodeStyle: 5,
      standardEpisodeFormat:
        '{Series Title} - S{season:00}E{episode:00} - {Episode Title} {Quality Full}',
      dailyEpisodeFormat:
        '{Series Title} - {Air-Date} - {Episode Title} {Quality Full}',
      animeEpisodeFormat:
        '{Series Title} - S{season:00}E{episode:00} - {Episode Title} {Quality Full}',
      seriesFolderFormat: '{Series Title}',
      seasonFolderFormat: 'Season {season}',
      specialsFolderFormat: 'Specials',
    },
    indexer: {
      id: 1,
      minimumAge: 0,
      retention: 0,
      maximumSize: 0,
      rssSyncInterval: 15,
    },
    downloadclient: {
      id: 1,
      downloadClientWorkingFolders: '_UNPACK_|_FAILED_',
      enableCompletedDownloadHandling: true,
      autoRedownloadFailed: true,
      autoRedownloadFailedFromInteractiveSearch: true,
    },
    importlist: {
      id: 1,
      listSyncLevel: 'disabled',
      listSyncTag: 0,
    },
    metadata: {
      id: 1,
      preferredMetadataLanguage: 1,
    },
  };
}

export function updateSettings(settings: Record<string, JsonObject>) {
  const general = settings.general;

  return {
    id: 1,
    branch: general.branch,
    updateAutomatically: general.updateAutomatically,
    updateMechanism: general.updateMechanism,
    updateScriptPath: general.updateScriptPath,
  };
}

const SAMPLE = {
  seriesTitle: "The Series Title's!",
  seriesCleanTitle: 'The Series Titles!',
  year: 2010,
  episodeTitle: 'Episode Title (1)',
  multiEpisodeTitle: 'Episode Title',
  quality: 'HDTV-720p',
  qualityFull: 'HDTV-720p Proper',
};

function pad(value: number, format: string | undefined) {
  return String(value).padStart(format ? format.length : 1, '0');
}

function renderFormat(
  format: string,
  season: number,
  episodes: number[],
  airDate = '2013-10-30'
) {
  const values: Record<string, string> = {
    'series title': SAMPLE.seriesTitle,
    'series titleyear': `${SAMPLE.seriesTitle} (${SAMPLE.year})`,
    'series cleantitle': SAMPLE.seriesCleanTitle,
    'series cleantitleyear': `${SAMPLE.seriesCleanTitle} ${SAMPLE.year}`,
    'series titlethe': "Series Title's!, The",
    'series titlefirstcharacter': 'S',
    'series year': String(SAMPLE.year),
    'episode title':
      episodes.length > 1 ? SAMPLE.multiEpisodeTitle : SAMPLE.episodeTitle,
    'episode cleantitle': 'Episode Title 1',
    'quality full': SAMPLE.qualityFull,
    'quality title': SAMPLE.quality,
    'air-date': airDate,
    'air date': airDate.replace(/-/g, ' '),
    'release group': 'RlsGrp',
    'mediainfo simple': 'x264 DTS',
    'mediainfo full': 'x264 DTS [EN+DE]',
    'mediainfo videocodec': 'x264',
    'mediainfo audiocodec': 'DTS',
    imdbid: 'tt12345',
    tvdbid: '12345',
  };

  return format
    .replace(
      /\{(season|episode|absolute)(?::(0+))?\}/gi,
      (_match, token: string, digits?: string) => {
        const lower = token.toLowerCase();

        if (lower === 'season') {
          return pad(season, digits);
        }

        return episodes
          .map((episode, index) =>
            index ? `-E${pad(episode, digits)}` : pad(episode, digits)
          )
          .join('');
      }
    )
    .replace(/\{([^{}]+)\}/g, (_match, token: string) => {
      const key = token.toLowerCase().replace(/[._]/g, ' ').trim();

      return values[key] ?? values[key.replace(/\s+/g, ' ')] ?? '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function namingExamples(settings: JsonObject, query: URLSearchParams) {
  const read = (key: string) => String(query.get(key) ?? settings[key] ?? '');
  const standard = read('standardEpisodeFormat');
  const daily = read('dailyEpisodeFormat');
  const anime = read('animeEpisodeFormat');

  return {
    singleEpisodeExample: `${renderFormat(standard, 1, [1])}.mkv`,
    multiEpisodeExample: `${renderFormat(standard, 1, [1, 2, 3])}.mkv`,
    dailyEpisodeExample: `${renderFormat(daily, 1, [1])}.mkv`,
    animeEpisodeExample: `${renderFormat(anime, 1, [1])}.mkv`,
    animeMultiEpisodeExample: `${renderFormat(anime, 1, [1, 2, 3])}.mkv`,
    seriesFolderExample: renderFormat(read('seriesFolderFormat'), 1, [1]),
    seasonFolderExample: renderFormat(read('seasonFolderFormat'), 1, [1]),
    specialsFolderExample: renderFormat(read('specialsFolderFormat'), 0, [1]),
  };
}
