import { ENGLISH, ROOT_FOLDER } from '../constants';
import { DemoSeries, DemoWork, DemoWorkFile, JsonObject } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { seriesPath } from '../state/paths';
import { isCutoffUnmet, isQueued } from '../state/queries';
import { DemoDb } from '../state/store';
import { seriesResource } from './series';

function fileName(db: DemoDb, file: DemoWorkFile, series?: DemoSeries) {
  const numbers = db.works
    .filter((e) => e.workFileId === file.id)
    .map((e) => `c${String(e.number).padStart(2, '0')}`)
    .join('');
  const volume = String(file.volumeNumber).padStart(2, '0');

  return `${series?.title ?? 'Series'} - v${volume}${numbers || 'c01'} - ${
    file.quality
  }.cbz`;
}

export function relativeFilePath(
  db: DemoDb,
  file: DemoWorkFile,
  series?: DemoSeries
) {
  return (
    file.relativePath ??
    `Volume ${file.volumeNumber}/${fileName(db, file, series)}`
  );
}

export function workFileResource(db: DemoDb, file: DemoWorkFile): JsonObject {
  const series = db.series.find((s) => s.id === file.seriesId);
  const work = db.works.find((item) => item.workFileId === file.id);
  const relativePath = relativeFilePath(db, file, series);
  return {
    id: file.id,
    seriesId: file.seriesId,
    volumeNumber: file.volumeNumber,
    relativePath,
    path: `${series ? seriesPath(series) : ROOT_FOLDER}/${relativePath}`,
    size: file.size,
    dateAdded: file.dateAdded,
    sceneName: '',
    releaseGroup: file.releaseGroup,
    languages: [ENGLISH],
    quality: qualityModel(file.quality),
    customFormats: [],
    customFormatScore: 0,
    indexerFlags: 0,
    releaseType: file.releaseType ?? 'singleChapter',
    qualityCutoffNotMet: isCutoffUnmet(db, file),
    mediaInfo: {
      id: 0,
      containerFormat: 'CBZ',
      imageFormat: 'JPEG',
      pageCount: work?.pageCount,
    },
  };
}

export function workResource(
  db: DemoDb,
  work: DemoWork,
  includeSeries = false,
  includeWorkFile = false
): JsonObject {
  const series = db.series.find((s) => s.id === work.seriesId);
  const file = db.workFiles.find((f) => f.id === work.workFileId);

  const { workFileId: _workFileId, ...fields } = work;

  return {
    ...fields,
    releaseDate: work.releaseDateUtc.slice(0, 10) || undefined,
    releaseDateUtc: work.releaseDateUtc || undefined,
    fileState: file ? 'direct' : 'missing',
    workFileIds: file ? [file.id] : [],
    workFiles:
      includeWorkFile && file ? [workFileResource(db, file)] : undefined,
    linkedSeries: [],
    importedSplitParts: 0,
    isPartiallyImported: false,
    hasFile: !!file,
    grabbed: isQueued(db, work.id),
    series: includeSeries && series ? seriesResource(db, series) : undefined,
  };
}
