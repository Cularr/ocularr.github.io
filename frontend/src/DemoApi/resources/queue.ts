import { ENGLISH } from '../constants';
import { DemoQueueItem, DemoWork, JsonObject } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { DemoDb } from '../state/store';
import { seriesResource } from './series';
import { workResource } from './work';

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

function volumeIds(db: DemoDb, works: DemoWork[]) {
  const byId = new Map(db.works.map((work) => [work.id, work]));
  const parentsOf = (work: DemoWork) =>
    work.parentWorkIds.flatMap((id) => byId.get(id) ?? []);

  const ancestorsOf = (work: DemoWork) => {
    const found = new Map<number, DemoWork>();
    const pending = parentsOf(work);

    while (pending.length) {
      const parent = pending.pop()!;

      if (!found.has(parent.id)) {
        found.set(parent.id, parent);
        pending.push(...parentsOf(parent));
      }
    }

    return [...found.values()];
  };

  return [
    ...new Set(
      works.flatMap((work) => {
        if (work.kind === 'volume') {
          return [work.id];
        }

        const parents =
          work.kind === 'partialChapter' ? ancestorsOf(work) : parentsOf(work);

        return parents
          .filter((parent) => parent.kind === 'volume')
          .map((parent) => parent.id);
      })
    ),
  ];
}

function queueVolumes(works: DemoWork[]) {
  const volumes = new Map<number, DemoWork[]>();

  works.forEach((work) => {
    if (work.volumeNumber != null) {
      volumes.set(work.volumeNumber, [
        ...(volumes.get(work.volumeNumber) ?? []),
        work,
      ]);
    }
  });

  return [...volumes]
    .sort(([a], [b]) => a - b)
    .map(([volumeNumber, volumeWorks]) => ({
      volumeNumber,
      workCount: volumeWorks.length,
      worksWithFilesCount: volumeWorks.filter((e) => e.workFileId).length,
    }));
}

export function queueResource(
  db: DemoDb,
  item: DemoQueueItem,
  includeSeries = true,
  includeWorks = true
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
  const works = db.works.filter((e) => item.release.workIds.includes(e.id));

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
    workIds: item.release.workIds,
    volumeWorkIds: volumeIds(db, works),
    volumes: queueVolumes(works),
    chaptersWithFilesCount: works.filter((e) => e.workFileId).length,
    isSplitPart: false,
    isFullVolume: !!item.release.fullVolume,
    languages: [ENGLISH],
    quality: qualityModel(item.release.quality),
    customFormats: [],
    customFormatScore: item.release.customFormatScore,
    size: item.release.size,
    title: item.release.title,
    sizeLeft,
    timeLeft: [Math.floor(minutes / 60), minutes % 60, seconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(':'),
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
    works: includeWorks ? works.map((e) => workResource(db, e)) : undefined,
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
