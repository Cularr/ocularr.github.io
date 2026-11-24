import { DemoWork, DemoWorkFile } from '../DemoTypes';
import { getQuality, qualityWeight } from '../qualities/model';
import { cutoffWeight } from '../qualities/profiles';
import { DemoDb } from './store';

export function isQueued(db: DemoDb, workId: number) {
  return db.queue.some((item) => item.release.workIds.includes(workId));
}

export function isCutoffUnmet(db: DemoDb, file: DemoWorkFile) {
  const series = db.series.find((s) => s.id === file.seriesId);
  const profile = db.collections.qualityprofile.find(
    (p) => p.id === series?.qualityProfileId
  );

  return (
    !!profile?.upgradeAllowed &&
    qualityWeight(file.quality) < cutoffWeight(profile)
  );
}

export function findSeries(db: DemoDb, id: string | number) {
  return db.series.find((s) => s.id === Number(id));
}

export function filterValues(query: URLSearchParams, key: string) {
  return query
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function filterIds(query: URLSearchParams, key: string) {
  return filterValues(query, key).map(Number);
}

export function enumFilter(
  query: URLSearchParams,
  key: string,
  names: Record<number, string>
) {
  const values = filterValues(query, key).map((value) =>
    /^\d+$/.test(value) ? names[Number(value)] : value.toLowerCase()
  );

  return (value: string) =>
    !values.length || values.includes(value.toLowerCase());
}

export function matchesSeriesTags(
  series: ReturnType<typeof findSeries>,
  tags: number[]
) {
  return !tags.length || !!series?.tags.some((tag) => tags.includes(tag));
}

interface WorkQuery {
  monitored?: boolean;
  includeQueued?: boolean;
  filter?: (work: DemoWork) => boolean;
}

interface MissingWorkQuery extends WorkQuery {
  includeSpecials?: boolean;
}

interface CutoffWorkQuery extends WorkQuery {
  qualityIds?: number[];
}

export function isMonitored(db: DemoDb, work: DemoWork) {
  return (
    work.monitored && !!db.series.find((s) => s.id === work.seriesId)?.monitored
  );
}

function newestFirst(a: DemoWork, b: DemoWork) {
  return Date.parse(b.releaseDateUtc) - Date.parse(a.releaseDateUtc);
}

export function missingWorks(
  db: DemoDb,
  {
    monitored = true,
    includeQueued = false,
    includeSpecials = true,
    filter,
  }: MissingWorkQuery = {}
) {
  const now = Date.now();

  return db.works
    .filter(
      (e) =>
        isMonitored(db, e) === monitored &&
        !e.workFileId &&
        e.inEdition &&
        e.kind !== 'partialChapter' &&
        (includeSpecials || e.countType !== 'extra') &&
        (!e.releaseDateUtc || Date.parse(e.releaseDateUtc) < now) &&
        (includeQueued || !isQueued(db, e.id)) &&
        (!filter || filter(e))
    )
    .sort(newestFirst);
}

export function cutoffUnmetWorks(
  db: DemoDb,
  {
    monitored = true,
    includeQueued = false,
    qualityIds = [],
    filter,
  }: CutoffWorkQuery = {}
) {
  const files = new Map(db.workFiles.map((file) => [file.id, file]));

  return db.works
    .filter((e) => {
      const file = files.get(e.workFileId);

      return (
        !!file &&
        e.inEdition &&
        isMonitored(db, e) === monitored &&
        isCutoffUnmet(db, file) &&
        (!qualityIds.length ||
          qualityIds.includes(getQuality(file.quality).id)) &&
        (includeQueued || !isQueued(db, e.id)) &&
        (!filter || filter(e))
      );
    })
    .sort(newestFirst);
}
