import { DAY, ROOT_FOLDER } from '../constants';
import { DemoEpisode, DemoSeries, ShowData } from '../DemoTypes';
import { seriesFolder } from './paths';
import { seedShowEpisodes } from './seedEpisodes';
import { DemoDb, nextId } from './store';

export function toDemoSeries(show: ShowData, id: number): DemoSeries {
  const {
    episodes: _episodes,
    airing: _airing,
    library: _library,
    ...rest
  } = show;

  return {
    ...rest,
    id,
    monitored: true,
    seasonMonitored: {},
    added: new Date(Date.now() - (400 + id * 20) * DAY).toISOString(),
    tags: [],
  };
}

let catalog: ShowData[] = [];

export function setCatalog(shows: ShowData[]) {
  catalog = shows;
}

export function catalogShows() {
  return catalog;
}

export function applyMonitor(db: DemoDb, series: DemoSeries, monitor: string) {
  const now = Date.now();
  const episodes = db.episodes.filter((e) => e.seriesId === series.id);
  const seasons = Array.from(new Set(episodes.map((e) => e.seasonNumber))).sort(
    (a, b) => a - b
  );
  const firstSeason = seasons[0];
  const lastSeason = seasons[seasons.length - 1];
  const latestAiredSeason = Math.max(
    firstSeason ?? 1,
    ...episodes
      .filter((e) => Date.parse(e.airDateUtc) < now)
      .map((e) => e.seasonNumber)
  );
  const recent = now - 90 * DAY;
  const rules: Record<string, (episode: DemoEpisode) => boolean> = {
    all: () => true,
    future: (e) => Date.parse(e.airDateUtc) > now,
    missing: (e) => !e.episodeFileId || Date.parse(e.airDateUtc) > now,
    existing: (e) => !!e.episodeFileId,
    firstSeason: (e) => e.seasonNumber === firstSeason,
    lastSeason: (e) => e.seasonNumber === lastSeason,
    latestSeason: (e) => e.seasonNumber === latestAiredSeason,
    pilot: (e) => e.seasonNumber === firstSeason && e.episodeNumber === 1,
    recent: (e) => Date.parse(e.airDateUtc) > recent,
    none: () => false,
  };
  const rule = rules[monitor];

  if (!rule) {
    return;
  }

  episodes.forEach((episode) => {
    episode.monitored = rule(episode);
  });

  seasons.forEach((seasonNumber) => {
    series.seasonMonitored[seasonNumber] = episodes.some(
      (e) => e.seasonNumber === seasonNumber && e.monitored
    );
  });

  series.monitored = monitor !== 'none' || series.monitored;
}

export function addSeries(
  db: DemoDb,
  tvdbId: number,
  options: {
    qualityProfileId?: number;
    monitored?: boolean;
    monitor?: string;
    seriesType?: string;
    seasonFolder?: boolean;
    monitorNewItems?: string;
    rootFolderPath?: string;
    tags?: number[];
  }
) {
  const show = catalog.find((s) => s.tvdbId === tvdbId);

  if (!show || db.series.some((s) => s.tvdbId === tvdbId)) {
    return null;
  }

  const id = nextId(db);
  const series: DemoSeries = {
    ...toDemoSeries(show, id),
    added: new Date().toISOString(),
    qualityProfileId: options.qualityProfileId ?? show.qualityProfileId,
    monitored: options.monitored ?? true,
    seriesType: options.seriesType,
    seasonFolder: options.seasonFolder,
    monitorNewItems: options.monitorNewItems,
    tags: options.tags ?? [],
    path: `${(options.rootFolderPath ?? ROOT_FOLDER).replace(
      /\/$/,
      ''
    )}/${seriesFolder(show)}`,
  };

  db.series.push(series);
  seedShowEpisodes(db, { ...show, airing: null }, id, false);
  applyMonitor(db, series, options.monitor ?? 'all');

  return series;
}
