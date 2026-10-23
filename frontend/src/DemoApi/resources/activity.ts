import { ENGLISH, HOUR } from '../constants';
import {
  DemoBlocklist,
  DemoHistory,
  DemoRelease,
  JsonObject,
} from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { DemoDb } from '../state/store';
import { episodeResource } from './episode';
import { seriesResource } from './series';

export function releaseResource(db: DemoDb, release: DemoRelease): JsonObject {
  const series = db.series.find((s) => s.id === release.seriesId);
  const episodes = db.episodes.filter((e) => release.episodeIds.includes(e.id));
  const first = episodes[0];
  const rejected = release.rejections.length > 0;

  return {
    id: 0,
    parsedInfo: {
      quality: qualityModel(release.quality),
      releaseGroup: release.releaseGroup,
      releaseHash: '',
      fullSeason: !!release.fullSeason,
      seasonNumbers: first ? [first.seasonNumber] : [],
      seriesTitle: series?.title ?? '',
      episodeNumbers: release.fullSeason
        ? []
        : episodes.map((e) => e.episodeNumber),
      isDaily: false,
      isAbsoluteNumbering: false,
      isPossibleSpecialEpisode: false,
      special: false,
    },
    release: {
      guid: release.guid,
      age: Math.floor(release.ageHours / 24),
      ageHours: release.ageHours,
      ageMinutes: release.ageHours * 60,
      size: release.size,
      indexerId: release.indexerId,
      indexer: release.indexer,
      title: release.title,
      tvdbId: series?.tvdbId ?? 0,
      tvRageId: 0,
      publishDate: new Date(Date.now() - release.ageHours * HOUR).toISOString(),
      commentUrl: '',
      downloadUrl: '',
      infoUrl: '',
      protocol: release.protocol,
      indexerFlags: 0,
      seeders: release.seeders ?? undefined,
      leechers: release.leechers ?? undefined,
    },
    decision: {
      approved: !rejected,
      temporarilyRejected: false,
      rejected,
      rejections: release.rejections.map((message) => ({
        message,
        reason: message.includes('blocklisted')
          ? 'blocklisted'
          : 'qualityNotWanted',
        type: 'permanent',
      })),
    },
    qualityWeight: 0,
    languages: [ENGLISH],
    mappedSeriesId: release.seriesId,
    mappedSeasonNumber: first?.seasonNumber,
    mappedEpisodeNumbers: episodes.map((e) => e.episodeNumber),
    mappedEpisodeInfo: episodes.map((e) => ({
      id: e.id,
      episodeFileId: e.episodeFileId,
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      title: e.title,
    })),
    episodeRequested: true,
    downloadAllowed: true,
    releaseWeight: 0,
    customFormats: [],
    customFormatScore: release.customFormatScore,
  };
}

export function historyResource(
  db: DemoDb,
  history: DemoHistory,
  includeSeries: boolean,
  includeEpisode: boolean
): JsonObject {
  const series = db.series.find((s) => s.id === history.seriesId);
  const episode = db.episodes.find((e) => e.id === history.episodeId);

  return {
    id: history.id,
    episodeId: history.episodeId,
    seriesId: history.seriesId,
    sourceTitle: history.sourceTitle,
    languages: [ENGLISH],
    quality: qualityModel(history.quality),
    customFormats: [],
    customFormatScore: 0,
    qualityCutoffNotMet: false,
    date: history.date,
    downloadId: `demo-history-${history.id}`,
    eventType: history.eventType,
    data: history.data,
    series: includeSeries && series ? seriesResource(db, series) : undefined,
    episode:
      includeEpisode && episode ? episodeResource(db, episode) : undefined,
  };
}

export function blocklistResource(db: DemoDb, item: DemoBlocklist): JsonObject {
  const series = db.series.find((s) => s.id === item.seriesId);

  return {
    id: item.id,
    seriesId: item.seriesId,
    episodeIds: item.episodeIds,
    sourceTitle: item.sourceTitle,
    title: item.sourceTitle,
    languages: [ENGLISH],
    quality: qualityModel(item.quality),
    customFormats: [],
    date: item.date,
    protocol: item.protocol,
    indexer: item.indexer,
    message: item.message,
    source: 'DownloadClient',
    series: series ? seriesResource(db, series) : undefined,
  };
}
