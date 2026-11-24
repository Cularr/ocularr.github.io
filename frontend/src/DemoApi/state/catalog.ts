import { DAY, ROOT_FOLDER } from '../constants';
import { DemoSeries, DemoWork, SeriesData } from '../DemoTypes';
import { coveredIds, defaultEdition } from './editions';
import { seriesFolder } from './paths';
import { seedSeriesWorks } from './seedWorks';
import { DemoDb, nextId } from './store';

export function toDemoSeries(seriesData: SeriesData, id: number): DemoSeries {
  const {
    works: _works,
    extraMonitoredCollectionId: _extraMonitoredCollectionId,
    library: _library,
    ...rest
  } = seriesData;

  return {
    ...rest,
    metadata: { ...seriesData.metadata, ...defaultEdition(seriesData) },
    id,
    monitored: true,
    added: new Date(Date.now() - (400 + id * 20) * DAY).toISOString(),
    tags: [],
  };
}

let catalog: SeriesData[] = [];

export function setCatalog(seriesList: SeriesData[]) {
  catalog = seriesList;
}

export function catalogSeries() {
  return catalog;
}

const MONITOR_TYPES = [
  'unknown',
  'all',
  'future',
  'missing',
  'existing',
  'firstVolume',
  'lastVolume',
  'latestVolume',
  'pilot',
  'recent',
  'monitorSpecials',
  'unmonitorSpecials',
  'none',
  'skip',
] as const;

type MonitorTypes = (typeof MONITOR_TYPES)[number];

export function readMonitorType(value: unknown) {
  return MONITOR_TYPES.find((monitor) => monitor === value);
}

export function applyMonitor(
  db: DemoDb,
  series: DemoSeries,
  monitor: MonitorTypes
) {
  if (monitor === 'skip' || monitor === 'unknown') {
    return;
  }

  const now = Date.now();
  const works = db.works.filter((work) => work.seriesId === series.id);
  const regular = works.filter(
    (work) => work.inEdition && work.countType !== 'extra'
  );
  const volumes = regular
    .filter((work) => work.kind === 'volume')
    .sort((a, b) => a.number - b.number);
  const pilot = regular
    .filter((work) => work.kind === 'chapter' || work.kind === 'magazine')
    .sort((a, b) => a.number - b.number)[0];

  const within = (root: DemoWork | undefined) => {
    const covered = coveredIds(works, root ? [root.id] : []);

    return (work: DemoWork) =>
      covered.has(work.id) &&
      (work.id === root?.id || work.countType !== 'extra');
  };

  const recent = now - 90 * DAY;
  const rules: Record<
    Exclude<MonitorTypes, 'skip' | 'unknown'>,
    (work: DemoWork) => boolean
  > = {
    all: () => true,
    future: (work) =>
      !work.releaseDateUtc || Date.parse(work.releaseDateUtc) >= now,
    missing: (work) => !work.workFileId,
    existing: (work) => !!work.workFileId,
    firstVolume: within(volumes[0]),
    lastVolume: within(volumes[volumes.length - 1]),
    latestVolume: within(volumes[volumes.length - 1]),
    pilot: within(pilot),
    recent: (work) =>
      !work.releaseDateUtc || Date.parse(work.releaseDateUtc) >= recent,
    monitorSpecials: (work) =>
      work.monitored || (work.inEdition && work.countType === 'extra'),
    unmonitorSpecials: (work) =>
      work.monitored && (!work.inEdition || work.countType !== 'extra'),
    none: () => false,
  };
  const rule = rules[monitor];
  const appliesToAll =
    monitor === 'monitorSpecials' ||
    monitor === 'unmonitorSpecials' ||
    monitor === 'firstVolume' ||
    monitor === 'lastVolume' ||
    monitor === 'latestVolume' ||
    monitor === 'pilot';
  const regularIds = new Set(regular.map((work) => work.id));

  works.forEach((work) => {
    work.monitored = (appliesToAll || regularIds.has(work.id)) && rule(work);
  });
}

export function addSeries(
  db: DemoDb,
  foreignSeriesId: string,
  options: {
    qualityProfileId?: number;
    monitored?: boolean;
    monitor?: MonitorTypes;
    seriesType?: string;
    volumeFolder?: boolean;
    monitorNewItems?: string;
    rootFolderPath?: string;
    tags?: number[];
  }
) {
  const seriesData = catalog.find((s) => s.foreignSeriesId === foreignSeriesId);

  if (
    !seriesData ||
    db.series.some((s) => s.foreignSeriesId === foreignSeriesId)
  ) {
    return null;
  }

  const id = nextId(db);
  const series: DemoSeries = {
    ...toDemoSeries(seriesData, id),
    added: new Date().toISOString(),
    qualityProfileId: options.qualityProfileId ?? seriesData.qualityProfileId,
    monitored: options.monitored ?? true,
    seriesType: options.seriesType ?? seriesData.seriesType,
    volumeFolder: options.volumeFolder,
    monitorNewItems: options.monitorNewItems,
    tags: options.tags ?? [],
    path: `${(options.rootFolderPath ?? ROOT_FOLDER).replace(
      /\/$/,
      ''
    )}/${seriesFolder(seriesData)}`,
  };

  db.series.push(series);
  seedSeriesWorks(db, seriesData, series, false);
  applyMonitor(db, series, options.monitor ?? 'all');

  return series;
}
