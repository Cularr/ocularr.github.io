import { DemoSeries, SeriesData } from '../DemoTypes';
import { PROFILE_IDS } from '../qualities/profiles';
import { applyLayout, collectionsOf, coveredIds } from './editions';
import { qualitySize, RELEASE_GROUPS } from './releaseFactory';
import { DemoDb, nextId } from './store';

function qualityFor(
  seriesData: SeriesData,
  volumeNumber: number,
  lastVolume: number
) {
  const tiers: Record<number, string> = {
    [PROFILE_IDS.medium]: 'MQ',
    [PROFILE_IDS.high]: 'HQ',
    [PROFILE_IDS.ultra]: 'UHQ',
  };
  const source =
    seriesData.status === 'continuing' && volumeNumber === lastVolume
      ? 'Digital'
      : 'Retail';

  return `${source} ${tiers[seriesData.qualityProfileId] ?? 'MQ'}`;
}

export function isPlaceholderTitle(title: string) {
  return !title || /^(tba|tbd|work \d+)$/i.test(title.trim());
}

export function seedSeriesWorks(
  db: DemoDb,
  seriesData: SeriesData,
  series: DemoSeries,
  withFiles: boolean
) {
  const now = Date.now();
  const seriesId = series.id;
  const lastVolume = Math.max(
    ...seriesData.works.map((e) => e.volumeNumber ?? 0),
    1
  );
  const works: SeriesData['works'] = seriesData.works.map((e) => ({
    ...e,
  }));
  applyLayout(series, works);
  const extra =
    withFiles &&
    seriesData.extraMonitoredCollectionId &&
    collectionsOf(series.metadata).find(
      (c) => c.collectionId === seriesData.extraMonitoredCollectionId
    );
  const additional = extra
    ? coveredIds(works, extra.workIds)
    : new Set<number>();

  works.forEach((source) => {
    const volumeNumber = source.volumeNumber ?? 0;
    const date = new Date(source.releaseDateUtc);
    const monitored =
      (!!source.inEdition || additional.has(source.id)) &&
      source.countType !== 'extra';
    const hasFile = monitored && withFiles && date.getTime() < now;
    const id = source.id;
    const quality = qualityFor(seriesData, volumeNumber, lastVolume);
    let workFileId = 0;

    if (hasFile) {
      workFileId = nextId(db);

      db.workFiles.push({
        id: workFileId,
        seriesId,
        volumeNumber,
        quality,
        size: qualitySize(quality, id),
        releaseGroup: RELEASE_GROUPS[id % RELEASE_GROUPS.length],
        releaseType: source.kind === 'volume' ? 'volumePack' : 'singleChapter',
        dateAdded: new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      });
    }

    db.works.push({
      ...source,
      seriesId,
      monitored,
      workFileId,
    });
  });
}
