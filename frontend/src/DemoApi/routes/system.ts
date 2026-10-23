import { DAY, HOUR, INSTALLED_VERSION, MINUTE } from '../constants';
import {
  languageIdentifier,
  languageResource,
  languageResources,
} from '../languages';
import { statisticsResource, updateResources } from '../resources/system';
import { currentVersion } from '../state/version';
import { fileSystem } from './fileSystem';
import { parseTitle } from './parse';
import { notAvailable, paged, Route } from './request';

const INDEXER_FLAGS = [
  'Freeleech',
  'Halfleech',
  'DoubleUpload',
  'Internal',
  'Scene',
  'Freeleech75',
  'Freeleech25',
  'Nuked',
];

const SYSTEM_TASKS: [string, string, number][] = [
  ['Application Update Check', 'ApplicationUpdateCheck', 360],
  ['Backup', 'Backup', 10080],
  ['Check Health', 'CheckHealth', 360],
  ['Clean Up Recycle Bin', 'CleanUpRecycleBin', 1440],
  ['Housekeeping', 'Housekeeping', 1440],
  ['Import List Sync', 'ImportListSync', 360],
  ['Messaging Cleanup', 'MessagingCleanup', 5],
  ['Refresh Monitored Downloads', 'RefreshMonitoredDownloads', 1],
  ['Refresh Series', 'RefreshSeries', 720],
  ['RSS Sync', 'RssSync', 15],
];

export const systemRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/language$/,
    handler: () => languageResources(),
  },
  {
    method: 'GET',
    pattern: /^\/language\/(-?\d+)$/,
    handler: (_db, _request, [id]) => languageResource(Number(id)),
  },
  {
    method: 'GET',
    pattern: /^\/localization\/language$/,
    handler: (db) => ({
      identifier: languageIdentifier(Number(db.settings.ui.uiLanguage)),
    }),
  },
  {
    method: 'GET',
    pattern: /^\/indexerflag$/,
    handler: () =>
      INDEXER_FLAGS.map((name, index) => ({
        id: 2 ** index,
        name,
        nameLower: name.toLowerCase(),
      })),
  },
  {
    method: 'GET',
    pattern: /^\/diskspace$/,
    handler: () => [
      {
        id: 0,
        path: '/data',
        label: 'data',
        freeSpace: 3.8e12,
        totalSpace: 8e12,
      },
      {
        id: 0,
        path: '/config',
        label: 'config',
        freeSpace: 42e9,
        totalSpace: 64e9,
      },
    ],
  },
  {
    method: 'GET',
    pattern: /^\/filesystem$/,
    handler: (db, request) => fileSystem(db, request.query.get('path') ?? ''),
  },
  {
    method: 'GET',
    pattern: /^\/filesystem\/type$/,
    handler: () => ({ type: 'folder' }),
  },
  {
    method: 'GET',
    pattern: /^\/filesystem\/mediafiles$/,
    handler: () => [],
  },
  {
    method: 'GET',
    pattern: /^\/parse$/,
    handler: (db, request) => parseTitle(db, request.query.get('title') ?? ''),
  },
  {
    method: 'GET',
    pattern:
      /^\/(rename|rename\/bulk|manualimport|health|log\/file|log\/file\/update|system\/backup|system\/routes)$/,
    handler: () => [],
  },
  {
    method: 'GET',
    pattern: /^\/system\/routes\/duplicate$/,
    handler: () => ({}),
  },
  {
    method: 'POST',
    pattern: /^\/manualimport$/,
    handler: () => [],
  },
  {
    method: 'POST',
    pattern: /^\/system\/backup\/restore\/(upload|\d+)$/,
    handler: () =>
      notAvailable('Restoring backups is not available in the demo'),
  },
  {
    method: 'DELETE',
    pattern: /^\/system\/backup\/(\d+)$/,
    handler: () => ({}),
  },
  {
    method: 'POST',
    pattern: /^\/system\/(restart|shutdown)$/,
    handler: () => ({}),
  },
  {
    method: 'GET',
    pattern: /^\/statistics$/,
    handler: (db) => statisticsResource(db),
  },
  {
    method: 'GET',
    pattern: /^\/update$/,
    handler: (db) => updateResources(db.updateInstalled),
  },
  {
    method: 'GET',
    pattern: /^\/system\/status$/,
    handler: (db) => ({
      appName: 'Sonarr',
      instanceName: String(db.settings.general.instanceName ?? 'Sonarr'),
      version: currentVersion(db),
      buildTime: new Date(Date.now() - 20 * DAY).toISOString(),
      isDebug: false,
      isProduction: true,
      isAdmin: false,
      isUserInteractive: false,
      startupPath: '/app/sonarr/bin',
      appData: '/config',
      osName: 'debian',
      osVersion: '12',
      isNetCore: true,
      isLinux: true,
      isOsx: false,
      isWindows: false,
      isDocker: true,
      mode: 'console',
      branch: String(db.settings.general.branch ?? 'main'),
      authentication: 'forms',
      migrationVersion: 220,
      urlBase: '',
      runtimeVersion: '8.0.10',
      runtimeName: '.NET',
      startTime: new Date(Date.now() - 3 * DAY).toISOString(),
      packageVersion: '',
      packageAuthor: '',
      packageUpdateMechanism: 'builtIn',
      packageUpdateMechanismMessage: '',
      databaseVersion: '3.46.1',
      databaseType: 'sqLite',
    }),
  },
  {
    method: 'GET',
    pattern: /^\/system\/task(?:\/(\d+))?$/,
    handler: (_db, _request, [id]) => {
      const tasks = SYSTEM_TASKS.map(([name, taskName, interval], index) => ({
        id: index + 1,
        name,
        taskName,
        interval,
        lastExecution: new Date(Date.now() - 600000).toISOString(),
        lastStartTime: new Date(Date.now() - 601000).toISOString(),
        nextExecution: new Date(Date.now() + interval * 60000).toISOString(),
        lastDuration: '00:00:01.5000000',
      }));

      return id ? tasks.find((task) => task.id === Number(id)) : tasks;
    },
  },
  {
    method: 'GET',
    pattern: /^\/log$/,
    handler: (_db, request) =>
      paged(
        request,
        [
          {
            id: 1,
            time: new Date().toISOString(),
            level: 'info',
            logger: 'RssSyncService',
            message:
              'RSS Sync Completed. Reports found: 312, Reports grabbed: 1',
          },
          {
            id: 2,
            time: new Date(Date.now() - 15 * MINUTE).toISOString(),
            level: 'info',
            logger: 'DownloadDecisionMaker',
            message: 'Processing 312 releases',
          },
          {
            id: 3,
            time: new Date(Date.now() - HOUR).toISOString(),
            level: 'info',
            logger: 'Bootstrap',
            message: `Starting Sonarr - /app/sonarr/bin/Sonarr - Version ${INSTALLED_VERSION}`,
          },
        ],
        (item) => item
      ),
  },
];
