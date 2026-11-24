import { ENGLISH } from '../constants';
import { DemoSeries, DemoWork, JsonObject, QualityInfo } from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { cleanTitle, slug } from '../slug';
import { folderName, seriesFolder, seriesPath } from '../state/paths';
import { DemoDb } from '../state/store';

function seriesSlug(series: DemoSeries) {
  return slug(series.title);
}

export function seriesStatistics(
  db: DemoDb,
  series: DemoSeries,
  volume?: DemoWork
) {
  const now = Date.now();
  const seriesWorks = db.works.filter((work) => work.seriesId === series.id);
  let works = seriesWorks.filter((work) => work.inEdition);
  let files = db.workFiles.filter((file) => file.seriesId === series.id);

  if (volume) {
    const chapters = seriesWorks.filter(
      (work) =>
        work.kind === 'chapter' && work.parentWorkIds.includes(volume.id)
    );
    const chapterIds = new Set(chapters.map((work) => work.id));
    const partials = seriesWorks.filter(
      (work) =>
        work.kind === 'partialChapter' &&
        work.parentWorkIds.some((id) => chapterIds.has(id))
    );
    const memberFileIds = new Set(
      [volume, ...chapters, ...partials].map((work) => work.workFileId)
    );

    works = chapters.length ? chapters : [volume];
    files = files.filter((file) => memberFileIds.has(file.id));
  }

  const fileIds = new Set(files.map((file) => file.id));
  const workFileCount = works.filter((work) =>
    fileIds.has(work.workFileId)
  ).length;
  const chapterTotal = works.filter(
    (work) =>
      fileIds.has(work.workFileId) ||
      (work.monitored &&
        (!work.releaseDateUtc || Date.parse(work.releaseDateUtc) <= now))
  ).length;
  const qualities = Array.from(
    new Map(
      files.map((file) => {
        const { quality } = qualityModel(file.quality);
        return [quality.id, quality];
      })
    ).values()
  );

  if (!volume) {
    const profile = db.collections.qualityprofile.find(
      (item) => item.id === series.qualityProfileId
    );
    const items = (profile?.items ?? []) as JsonObject[];
    const indexes = new Map<number, number>();

    items.forEach((item, index) => {
      const children = (item.items ?? []) as JsonObject[];

      for (const entry of [item, ...children]) {
        const quality = entry.quality as QualityInfo | undefined;

        if (quality && !indexes.has(quality.id)) {
          indexes.set(quality.id, index);
        }
      }
    });

    qualities.sort(
      (a, b) => (indexes.get(a.id) ?? 0) - (indexes.get(b.id) ?? 0)
    );
  }

  return {
    chapterCount: chapterTotal,
    totalChapterCount: works.length,
    monitoredChapterCount: works.filter((e) => e.monitored).length,
    fileCount: files.length,
    workFileCount,
    percentOfChapters: chapterTotal ? (workFileCount * 100) / chapterTotal : 0,
    workFileQualities: qualities,
    sizeOnDisk: files.reduce((total, f) => total + f.size, 0),
    releaseGroups: Array.from(new Set(files.map((f) => f.releaseGroup))),
    releaseTypes: Array.from(
      new Set(files.map((file) => file.releaseType ?? 'singleChapter'))
    ),
  };
}

function seriesEditionWorks(db: DemoDb, seriesId: number) {
  return db.works.filter(
    (work) => work.seriesId === seriesId && work.inEdition
  );
}

function baseResource(series: DemoSeries) {
  return {
    title: series.title,
    sortTitle: series.title.toLowerCase().replace(/^the /, ''),
    titleSlug: seriesSlug(series),
    cleanTitle: cleanTitle(series.title),
    alternateTitles: [],
    status: series.status === 'ended' ? 'completed' : 'ongoing',
    ended: series.status === 'ended',
    overview: series.overview,
    originalLanguage: ENGLISH,
    language: ENGLISH,
    originalTitle: series.title,
    cleanOriginalTitle: cleanTitle(series.title),
    isExcluded: false,
    translations: [],
    originalCountry: 'us',
    year: series.year,
    monitorNewItems: series.monitorNewItems ?? 'all',
    seriesType: series.seriesType ?? 'manga',
    genres: series.genres,
    ...series.metadata,
    foreignSeriesId: series.foreignSeriesId,
  };
}

export function seriesResource(db: DemoDb, series: DemoSeries): JsonObject {
  const now = Date.now();
  const works = seriesEditionWorks(db, series.id);
  const releaseDates = works
    .filter((work) => work.monitored)
    .map((work) => Date.parse(work.releaseDateUtc))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const next = releaseDates.find((date) => date >= now);
  const previous = releaseDates.filter((date) => date < now).pop();
  const volumes = works
    .filter((work) => work.kind === 'volume')
    .sort((a, b) => a.number - b.number);
  const path = seriesPath(series);

  return {
    ...baseResource(series),
    id: series.id,
    folders: [{ language: ENGLISH, folder: folderName(path) }],
    path,
    qualityProfileId: series.qualityProfileId,
    monitored: series.monitored,
    nextReleasing:
      next === undefined ? undefined : new Date(next).toISOString(),
    previousReleasing:
      previous === undefined ? undefined : new Date(previous).toISOString(),
    tags: series.tags,
    added: series.added,
    ratings: { votes: 1200 + series.id * 37, value: series.rating },
    statistics: {
      ...seriesStatistics(db, series),
      volumeCount: volumes.filter((volume) => (volume.volumeNumber ?? 0) > 0)
        .length,
    },
    volumeFolder: series.volumeFolder ?? true,
    volumes: volumes.map((volume) => ({
      workId: volume.id,
      volumeNumber: volume.volumeNumber,
      numberLabel: volume.numberLabel,
      title: volume.title,
      monitored: volume.monitored,
      statistics: seriesStatistics(db, series, volume),
    })),
    rootFolderPath: path.replace(/\/[^/]+$/, ''),
  };
}

export function lookupResource(series: DemoSeries) {
  return {
    ...baseResource(series),
    folders: [{ language: ENGLISH, folder: seriesFolder(series) }],
    qualityProfileId: 0,
    volumeFolder: false,
    monitored: false,
    volumes: [],
    tags: [],
    added: '0001-01-01T00:00:00Z',
    ratings: { votes: 900, value: series.rating },
  };
}
