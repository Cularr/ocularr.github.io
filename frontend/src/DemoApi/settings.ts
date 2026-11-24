import { URL_BASE } from './constants';
import { JsonObject } from './DemoTypes';
import { TOKEN_EXAMPLES } from './namingTokens';

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
      port: 8484,
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
      urlBase: URL_BASE,
      trustedNetworks: '',
      instanceName: 'Ocularr',
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
      autoUnmonitorPreviouslyDownloadedChapters: false,
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
      chapterTitleRequired: 'always',
      skipFreeSpaceCheckWhenGrabbing: false,
      skipFreeSpaceCheckWhenImporting: false,
      minimumFreeSpaceWhenImporting: 100,
      copyUsingHardlinks: true,
      useScriptImport: false,
      scriptImportPath: '',
      importExtraFiles: false,
      extraFileExtensions: 'srt',
      enableMediaInfo: true,
      convertToCbz: false,
      sharedWorkFiles: 'hardLink',
      userRejectedExtensions: '',
      volumePackUpgrade: 'all',
      volumePackUpgradeThreshold: 100,
    },
    naming: {
      id: 1,
      renameChapters: true,
      replaceIllegalCharacters: true,
      colonReplacementFormat: 4,
      customColonReplacementFormat: '',
      multiChapterStyle: 5,
      hierarchicalChapterFormat:
        '{Series Title} - v{volume:00} c{chapter:00} - {Chapter Title} {Quality Full}',
      chronologicalChapterFormat:
        '{Series Title} - {Release-Date} - {Chapter Title} {Quality Full}',
      sequentialChapterFormat:
        '{Series Title} - v{volume:00} c{chapter:00} - {Chapter Title} {Quality Full}',
      seriesFolderFormat: '{Series Title}',
      volumeFolderFormat: 'Volume {volume}',
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
  chapterTitle: 'Chapter Title (1)',
  multiChapterTitle: 'Chapter Title',
  quality: 'Scan MQ',
  qualityFull: 'Scan MQ Proper',
};

function pad(value: number, format: string | undefined) {
  const sign = value < 0 ? '-' : '';
  const [whole, fraction] = Math.abs(value).toString().split('.');

  return (
    sign +
    whole.padStart(format?.length ?? 1, '0') +
    (fraction ? `.${fraction}` : '')
  );
}

const CHAPTER_FRACTIONS = { '¼': '25', '½': '5', '¾': '75' };

function formatChapter(chapter: number | string, digits: string | undefined) {
  if (typeof chapter === 'number') {
    return pad(chapter, digits);
  }

  const label = chapter
    .trim()
    .replace(
      /^(\d*)([¼½¾])$/,
      (_match, whole: string, fraction: keyof typeof CHAPTER_FRACTIONS) =>
        `${whole}.${CHAPTER_FRACTIONS[fraction]}`
    );

  return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(label)
    ? pad(Number(label), digits)
    : chapter;
}

type AbsoluteNumbering = {
  numbers: (number | undefined)[];
  style: number;
};

function renderAbsolute(
  format: string,
  numbering: AbsoluteNumbering | undefined
) {
  return format.replace(
    /(?:(?<=\})([- ._]+?))?(\{absolute(?::(0+))?\})(?:([- ._]+?)(?=\{))?/gi,
    (
      match,
      before: string | undefined,
      token: string,
      digits: string | undefined,
      after: string | undefined
    ) => {
      const prefix = before ?? '';
      const suffix = after ?? '';

      if (!numbering || numbering.numbers.some((number) => number == null)) {
        return match.replace(token, '');
      }

      const { numbers, style } = numbering;
      const separator = after ?? before ?? '-';
      let joiner = '-';

      if (style === 1) {
        joiner = separator;
      } else if (style === 2) {
        joiner = separator.trim() || ' ';
      }

      const selected =
        style === 4 || style === 5
          ? numbers.filter(
              (_number, index) => index === 0 || index === numbers.length - 1
            )
          : numbers;

      return (
        prefix +
        selected.map((number) => pad(number!, digits)).join(joiner) +
        suffix
      );
    }
  );
}

function chapterRange(
  chapters: (number | string)[],
  volumePrefix: string,
  prefix: string,
  digits: string | undefined,
  style: number,
  separator: string
) {
  const [first, ...rest] = chapters.map((chapter) =>
    formatChapter(chapter, digits)
  );
  const start = `${volumePrefix}${prefix}${first}`;
  const last = rest[rest.length - 1];
  const scenePrefix = prefix.replace(/^[- ._]+/, '');

  if (!rest.length) {
    return start;
  }

  switch (style) {
    case 1:
      return (
        start +
        rest
          .map((chapter) => `${separator}${volumePrefix}${prefix}${chapter}`)
          .join('')
      );
    case 2:
      return start + rest.map((chapter) => `${prefix}${chapter}`).join('');
    case 3:
      return (
        start + rest.map((chapter) => `-${scenePrefix}${chapter}`).join('')
      );
    case 4:
      return `${start}-${last}`;
    case 5:
      return `${start}-${scenePrefix}${last}`;
    default:
      return `${start}-${rest.join('-')}`;
  }
}

export function renderFormat(
  format: string,
  volume: number,
  chapterNumbers: (number | string)[],
  releaseDate = '2013-10-30',
  fileValues?: Record<string, string>,
  absoluteNumbering?: AbsoluteNumbering,
  chapterStyle = 5
) {
  const values: Record<string, string> = fileValues ?? {
    ...TOKEN_EXAMPLES,
    'series title': SAMPLE.seriesTitle,
    'series titleyear': `${SAMPLE.seriesTitle} (${SAMPLE.year})`,
    'series cleantitle': SAMPLE.seriesCleanTitle,
    'series cleantitleyear': `${SAMPLE.seriesCleanTitle} ${SAMPLE.year}`,
    'series titlethe': "Series Title's!, The",
    'series titlefirstcharacter': 'S',
    'series year': String(SAMPLE.year),
    'chapter title':
      chapterNumbers.length > 1
        ? SAMPLE.multiChapterTitle
        : SAMPLE.chapterTitle,
    'chapter cleantitle': 'Chapter Title 1',
    'quality full': SAMPLE.qualityFull,
    'quality title': SAMPLE.quality,
    'release-date': releaseDate,
    'release date': releaseDate.replace(/-/g, ' '),
    'release group': 'RlsGrp',
  };

  return renderAbsolute(format, absoluteNumbering)
    .replace(
      /(?:(?<=\})([- ._]+?))?((?:v(?:ol(?:ume)?)?[-_. ]*)?)\{volume(?::(0+))?\}([-_. ]*(?:c(?:h(?:ap(?:ter)?)?)?[-_. ]*|x|\W[cx]))\{chapter(?::(0+))?\}(?:([- ._]+?)(?=\{))?|\{(volume|chapter)(?::(0+))?\}|\{([^{}]+)\}/gi,
      (
        _match,
        before: string | undefined,
        volumePrefix: string | undefined,
        volumeDigits: string | undefined,
        chapterPrefix: string | undefined,
        chapterDigits: string | undefined,
        after: string | undefined,
        numbering: string | undefined,
        digits: string | undefined,
        token: string
      ) => {
        if (chapterPrefix !== undefined) {
          const range = chapterRange(
            chapterNumbers,
            (volumePrefix ?? '') + pad(volume, volumeDigits),
            chapterPrefix,
            chapterDigits,
            chapterStyle,
            after ?? before ?? ''
          );

          return (before ?? '') + range + (after ?? '');
        }

        if (numbering) {
          return numbering.toLowerCase() === 'volume'
            ? pad(volume, digits)
            : chapterRange(chapterNumbers, '', '', digits, 4, '');
        }

        const key = token.toLowerCase().replace(/[._]/g, ' ').trim();

        return values[key] ?? values[key.replace(/\s+/g, ' ')] ?? '';
      }
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function namingExamples(settings: JsonObject, query: URLSearchParams) {
  const read = (key: string) => String(query.get(key) ?? settings[key] ?? '');
  const hierarchical = read('hierarchicalChapterFormat');
  const chronological = read('chronologicalChapterFormat');
  const sequential = read('sequentialChapterFormat');
  const style = Number(read('multiChapterStyle'));
  const sequentialExample = (chapters: number[], numbers: number[]) =>
    renderFormat(
      sequential,
      1,
      chapters,
      undefined,
      undefined,
      { numbers, style },
      style
    );

  return {
    hierarchicalChapterExample: `${renderFormat(hierarchical, 1, [1])}.cbz`,
    multiChapterExample: `${renderFormat(
      hierarchical,
      1,
      [1, 2, 3],
      undefined,
      undefined,
      undefined,
      style
    )}.cbz`,
    chronologicalChapterExample: `${renderFormat(chronological, 1, [1])}.cbz`,
    sequentialChapterExample: `${sequentialExample([1], [1])}.cbz`,
    sequentialMultiChapterExample: `${sequentialExample(
      [1, 2, 3],
      [1, 2, 3]
    )}.cbz`,
    seriesFolderExample: renderFormat(read('seriesFolderFormat'), 1, [1]),
    volumeFolderExample: renderFormat(read('volumeFolderFormat'), 1, [1]),
    specialsFolderExample: renderFormat(read('specialsFolderFormat'), 0, [1]),
  };
}
