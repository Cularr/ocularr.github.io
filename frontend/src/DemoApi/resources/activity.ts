import { ENGLISH, HOUR } from '../constants';
import {
  DemoBlocklist,
  DemoHistory,
  DemoRelease,
  JsonObject,
} from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { FULL_VOLUME_NOT_RELEASED } from '../simulation/releases';
import { DemoDb } from '../state/store';
import { seriesResource } from './series';
import { workResource } from './work';

export function releaseResource(db: DemoDb, release: DemoRelease): JsonObject {
  const series = db.series.find((s) => s.id === release.seriesId);
  const works = db.works.filter(
    (e) => e.seriesId === release.seriesId && release.workIds.includes(e.id)
  );
  const first = works[0];
  const rejected = release.rejections.length > 0;

  return {
    id: 0,
    parsedInfo: {
      quality: qualityModel(release.quality),
      releaseGroup: release.releaseGroup,
      releaseHash: '',
      fullVolume: !!release.fullVolume,
      volumeNumbers: first?.volumeNumber == null ? [] : [first.volumeNumber],
      seriesTitle: series?.title ?? '',
      chapterNumbers: release.fullVolume ? [] : works.map((e) => e.number),
      packChapterNumbers: [],
      isChronological: series?.metadata.ordering === 'chronological',
      isAbsoluteNumbering: false,
      isPossibleSpecialChapter: false,
      isSplitChapter: false,
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
      foreignSeriesId: series?.foreignSeriesId,
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
      rejections: release.rejections.map((message) => {
        let reason = 'qualityNotWanted';

        if (message.includes('blocklisted')) {
          reason = 'blocklisted';
        } else if (message === FULL_VOLUME_NOT_RELEASED) {
          reason = 'fullVolumeNotReleased';
        }

        return { message, reason, type: 'permanent' };
      }),
    },
    qualityWeight: 0,
    languages: [ENGLISH],
    mappedSeriesId: release.seriesId,
    mappedVolumeNumber: first?.volumeNumber,
    mappedChapterNumbers: works.map((e) => e.number),
    mappedAbsoluteChapterNumbers: works.flatMap((work) =>
      work.absoluteNumber == null ? [] : [work.absoluteNumber]
    ),
    mappedWorkInfo: works.map((e) => ({
      id: e.id,
      volumeNumber: e.volumeNumber,
      chapterNumber: e.number,
      numberLabel: e.numberLabel,
      absoluteChapterNumber: e.absoluteNumber,
      kind: e.kind,
      title: e.title,
    })),
    workRequested: true,
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
  includeWork: boolean
): JsonObject {
  const series = db.series.find((s) => s.id === history.seriesId);
  const work = db.works.find((e) => e.id === history.workId);

  return {
    id: history.id,
    workId: history.workId,
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
    work: includeWork && work ? workResource(db, work) : undefined,
  };
}

export function blocklistResource(db: DemoDb, item: DemoBlocklist): JsonObject {
  const series = db.series.find((s) => s.id === item.seriesId);

  return {
    id: item.id,
    seriesId: item.seriesId,
    workIds: item.workIds,
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
