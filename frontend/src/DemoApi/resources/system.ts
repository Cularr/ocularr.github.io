import { DAY, INSTALLED_VERSION, LATEST_VERSION } from '../constants';
import { DemoCommand, JsonObject } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { DemoDb } from '../state/store';
import { seriesStatistics } from './series';

export function commandResource(command: DemoCommand): JsonObject {
  return {
    id: command.id,
    name: command.name,
    commandName: command.name.replace(/([a-z])([A-Z])/g, '$1 $2'),
    message: command.status === 'completed' ? 'Completed' : '',
    completionMessage: 'Completed',
    body: {
      sendUpdatesToClient: true,
      updateScheduledTask: true,
      completionMessage: 'Completed',
      requiresDiskAccess: false,
      isExclusive: false,
      isLongRunning: false,
      name: command.name,
      trigger: 'manual',
      suppressMessages: false,
      ...command.body,
    },
    priority: 'normal',
    status: command.status,
    result: command.status === 'completed' ? 'successful' : 'unknown',
    queued: command.queued,
    started: command.started,
    ended: command.ended,
    duration: '00:00:01.2000000',
    trigger: 'manual',
    stateChangeTime: command.ended || command.started,
    sendUpdatesToClient: true,
    updateScheduledTask: true,
    lastExecutionTime: command.started,
  };
}

export function updateResources(installedLatest: boolean): JsonObject[] {
  const today = Date.now();

  return [
    {
      id: 0,
      version: LATEST_VERSION,
      branch: 'main',
      releaseDate: new Date(today - 2 * DAY).toISOString(),
      fileName: `Ocularr.main.${LATEST_VERSION}.linux-x64.tar.gz`,
      url: '',
      installed: installedLatest,
      installedOn: installedLatest ? new Date(today).toISOString() : '',
      installable: !installedLatest,
      latest: true,
      changes: {
        new: [
          'Show custom format score in the queue',
          'Option to import chapters with a lower score',
        ],
        fixed: [
          'Calendar not respecting the first day of week',
          'Volume pack imports skipping specials',
        ],
      },
      hash: 'demo3120',
    },
    {
      id: 0,
      version: INSTALLED_VERSION,
      branch: 'main',
      releaseDate: new Date(today - 19 * DAY).toISOString(),
      fileName: `Ocularr.main.${INSTALLED_VERSION}.linux-x64.tar.gz`,
      url: '',
      installed: !installedLatest,
      installedOn: new Date(today - 18 * DAY).toISOString(),
      installable: false,
      latest: false,
      changes: {
        new: ['Filter interactive search by protocol'],
        fixed: [
          'Remote path mapping with trailing slashes',
          'Series folder rename for titles with colons',
        ],
      },
      hash: 'demo3098',
    },
  ];
}

export function statisticsResource(db: DemoDb): JsonObject {
  const now = Date.now();
  const files = db.workFiles;
  const sizeOnDisk = files.reduce((total, f) => total + f.size, 0);
  const workCounts: Record<string, number> = {};

  for (const kind of ['volume', 'chapter', 'magazine']) {
    const works = db.works.filter((e) => e.kind === kind && e.inEdition);
    const fileIds = new Set(works.map((e) => e.workFileId).filter(Boolean));
    const downloaded = works.filter((e) => e.workFileId).length;
    const unreleased = works.filter(
      (e) => Date.parse(e.releaseDateUtc) > now
    ).length;
    workCounts[`${kind}TotalCount`] = works.length;
    workCounts[`${kind}MonitoredCount`] = works.filter(
      (e) => e.monitored
    ).length;
    workCounts[`${kind}DownloadedCount`] = downloaded;
    workCounts[`${kind}MissingCount`] = works.length - downloaded - unreleased;
    workCounts[`${kind}UnreleasedCount`] = unreleased;
    workCounts[`${kind}FileCount`] = fileIds.size;
    workCounts[`${kind}SizeOnDisk`] = files
      .filter((f) => fileIds.has(f.id))
      .reduce((sum, f) => sum + f.size, 0);
    workCounts[`${kind}sWithFilesCount`] = downloaded;
  }

  const qualityNames = Array.from(new Set(files.map((f) => f.quality)));

  return {
    id: 0,
    seriesCount: db.series.length,
    monitoredSeriesCount: db.series.filter((s) => s.monitored).length,
    completedSeriesCount: db.series.filter((series) => {
      const { chapterCount, workFileCount } = seriesStatistics(db, series);
      return chapterCount > 0 && chapterCount === workFileCount;
    }).length,
    ...workCounts,
    ongoingSeriesCount: db.series.filter((s) => s.status === 'continuing')
      .length,
    completedPublicationSeriesCount: db.series.filter(
      (s) => s.status === 'ended'
    ).length,
    upcomingSeriesCount: db.series.filter((s) => s.status === 'upcoming')
      .length,
    ...Object.fromEntries(
      [
        'manga',
        'manhwa',
        'manhua',
        'comic',
        'doujinshi',
        'oneShot',
        'magazine',
        'unknown',
      ].map((type) => [
        `${type}SeriesCount`,
        db.series.filter((s) => s.seriesType === type).length,
      ])
    ),
    unknownStatusSeriesCount: 0,
    cancelledSeriesCount: 0,
    hiatusSeriesCount: 0,
    deletedSeriesCount: 0,
    workFileCount: files.length,
    sizeOnDisk,
    qualityProfileStatistics: db.collections.qualityprofile.map((profile) => {
      const series = db.series.filter((s) => s.qualityProfileId === profile.id);
      const profileFiles = files.filter((f) =>
        series.some((s) => s.id === f.seriesId)
      );

      return {
        qualityProfileId: profile.id,
        name: profile.name,
        seriesCount: series.length,
        workFileCount: profileFiles.length,
        sizeOnDisk: profileFiles.reduce((total, f) => total + f.size, 0),
      };
    }),
    qualityStatistics: qualityNames.map((name) => {
      const qualityFiles = files.filter((f) => f.quality === name);

      return {
        quality: qualityModel(name).quality,
        workFileCount: qualityFiles.length,
        sizeOnDisk: qualityFiles.reduce((total, f) => total + f.size, 0),
      };
    }),
    tagStatistics: [],
  };
}
