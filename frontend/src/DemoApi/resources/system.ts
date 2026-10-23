import { DAY, INSTALLED_VERSION, LATEST_VERSION } from '../constants';
import { DemoCommand, JsonObject } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { DemoDb } from '../state/store';
import { seriesResource } from './series';

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
      fileName: `Sonarr.main.${LATEST_VERSION}.linux-x64.tar.gz`,
      url: '',
      installed: installedLatest,
      installedOn: installedLatest ? new Date(today).toISOString() : '',
      installable: !installedLatest,
      latest: true,
      changes: {
        new: [
          'Show custom format score in the queue',
          'Option to import episodes with a lower score',
        ],
        fixed: [
          'Calendar not respecting the first day of week',
          'Season pack imports skipping specials',
        ],
      },
      hash: 'demo3120',
    },
    {
      id: 0,
      version: INSTALLED_VERSION,
      branch: 'main',
      releaseDate: new Date(today - 19 * DAY).toISOString(),
      fileName: `Sonarr.main.${INSTALLED_VERSION}.linux-x64.tar.gz`,
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
  const seriesResources = db.series.map((s) => seriesResource(db, s));
  const files = db.episodeFiles;
  const sizeOnDisk = files.reduce((total, f) => total + f.size, 0);
  const aired = db.episodes.filter((e) => Date.parse(e.airDateUtc) < now);
  const seasons = seriesResources.flatMap(
    (s) => (s.seasons ?? []) as { statistics: { percentOfEpisodes: number } }[]
  );
  const qualityNames = Array.from(new Set(files.map((f) => f.quality)));

  return {
    id: 0,
    seriesCount: db.series.length,
    monitoredSeriesCount: db.series.filter((s) => s.monitored).length,
    completedSeriesCount: seriesResources.filter(
      (s) =>
        (s.statistics as { percentOfEpisodes: number }).percentOfEpisodes ===
        100
    ).length,
    continuingSeriesCount: db.series.filter((s) => s.status === 'continuing')
      .length,
    endedSeriesCount: db.series.filter((s) => s.status === 'ended').length,
    upcomingSeriesCount: db.series.filter((s) => s.status === 'upcoming')
      .length,
    deletedSeriesCount: 0,
    standardSeriesCount: db.series.length,
    dailySeriesCount: 0,
    animeSeriesCount: 0,
    seasonCount: seasons.length,
    completedSeasonCount: seasons.filter(
      (s) => s.statistics.percentOfEpisodes === 100
    ).length,
    totalEpisodeCount: db.episodes.length,
    monitoredEpisodeCount: db.episodes.filter((e) => e.monitored).length,
    downloadedEpisodeCount: files.length,
    missingEpisodeCount: aired.filter((e) => !e.episodeFileId).length,
    unairedEpisodeCount: db.episodes.length - aired.length,
    episodeFileCount: files.length,
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
        episodeFileCount: profileFiles.length,
        sizeOnDisk: profileFiles.reduce((total, f) => total + f.size, 0),
      };
    }),
    qualityStatistics: qualityNames.map((name) => {
      const qualityFiles = files.filter((f) => f.quality === name);

      return {
        quality: qualityModel(name).quality,
        episodeFileCount: qualityFiles.length,
        sizeOnDisk: qualityFiles.reduce((total, f) => total + f.size, 0),
      };
    }),
    tagStatistics: [],
  };
}
