import { ENGLISH } from '../constants';
import { DemoQueueItem, JsonObject } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { DemoDb } from '../state/store';
import { episodeResource } from './episode';
import { seriesResource } from './series';

const QUEUE_STATES = {
  downloading: {
    trackedDownloadState: 'downloading',
    trackedDownloadStatus: 'ok',
    status: 'downloading',
  },
  importing: {
    trackedDownloadState: 'importing',
    trackedDownloadStatus: 'ok',
    status: 'completed',
  },
  failed: {
    trackedDownloadState: 'failedPending',
    trackedDownloadStatus: 'error',
    status: 'failed',
  },
};

export function queueProgress(item: DemoQueueItem, now = Date.now()) {
  if (item.state !== 'downloading') {
    return item.failAt ?? 1;
  }

  return Math.min(1, (now - item.added) / item.duration);
}

export function queueResource(
  db: DemoDb,
  item: DemoQueueItem,
  includeSeries = true,
  includeEpisodes = true
): JsonObject {
  const now = Date.now();
  const progress = queueProgress(item, now);
  const sizeLeft = Math.round(item.release.size * (1 - progress));
  const secondsLeft = Math.max(
    0,
    Math.round(item.duration * (1 - progress)) / 1000
  );
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = Math.floor(secondsLeft % 60);
  const series = db.series.find((s) => s.id === item.release.seriesId);
  const episodes = db.episodes.filter((e) =>
    item.release.episodeIds.includes(e.id)
  );

  const { trackedDownloadState, trackedDownloadStatus, status } =
    QUEUE_STATES[item.state];
  const statusMessages =
    item.state === 'failed'
      ? [
          {
            title: item.release.title,
            messages: [
              'Password protected archive, release will be blocklisted',
            ],
          },
        ]
      : [];

  return {
    id: item.id,
    seriesId: item.release.seriesId,
    episodeIds: item.release.episodeIds,
    seasonNumbers: Array.from(new Set(episodes.map((e) => e.seasonNumber))),
    episodesWithFilesCount: episodes.filter((e) => e.episodeFileId).length,
    isFullSeason: !!item.release.fullSeason,
    languages: [ENGLISH],
    quality: qualityModel(item.release.quality),
    customFormats: [],
    customFormatScore: item.release.customFormatScore,
    size: item.release.size,
    title: item.release.title,
    sizeLeft,
    timeLeft: `00:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`,
    estimatedCompletionTime: new Date(now + secondsLeft * 1000).toISOString(),
    added: new Date(item.added).toISOString(),
    status,
    trackedDownloadStatus,
    trackedDownloadState,
    statusMessages,
    errorMessage: item.state === 'failed' ? 'Password protected archive' : '',
    downloadId: `demo-${item.id}`,
    protocol: item.release.protocol,
    downloadClient: item.downloadClient,
    downloadClientHasPostImportCategory: false,
    indexer: item.release.indexer,
    outputPath: `/data/downloads/${item.release.protocol}/${item.release.title}`,
    series: includeSeries && series ? seriesResource(db, series) : undefined,
    episodes: includeEpisodes
      ? episodes.map((e) => episodeResource(db, e))
      : undefined,
  };
}

export function queueStatus(db: DemoDb): JsonObject {
  const hasErrors = db.queue.some((item) => item.state === 'failed');

  return {
    id: 0,
    totalCount: db.queue.length,
    count: db.queue.length,
    unknownCount: 0,
    errors: hasErrors,
    warnings: false,
    unknownErrors: false,
    unknownWarnings: false,
  };
}
