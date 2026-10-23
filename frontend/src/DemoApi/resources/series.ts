import { ENGLISH, URL_BASE } from '../constants';
import { DemoEpisode, DemoSeries, JsonObject } from '../DemoTypes';
import { cleanTitle, slug } from '../slug';
import { folderName, seriesFolder, seriesPath } from '../state/paths';
import { DemoDb } from '../state/store';

function seriesSlug(series: DemoSeries) {
  return slug(series.title);
}

function statistics(db: DemoDb, episodes: DemoEpisode[]) {
  const now = Date.now();
  const files = db.episodeFiles.filter((f) =>
    episodes.some((e) => e.episodeFileId === f.id)
  );
  const aired = episodes.filter(
    (e) => e.episodeFileId || (e.monitored && Date.parse(e.airDateUtc) < now)
  );
  const episodeFileCount = files.length;
  const episodeCount = aired.length;

  return {
    episodeCount,
    episodeFileCount,
    totalEpisodeCount: episodes.length,
    monitoredEpisodeCount: episodes.filter((e) => e.monitored).length,
    sizeOnDisk: files.reduce((total, f) => total + f.size, 0),
    percentOfEpisodes: episodeCount
      ? (episodeFileCount / episodeCount) * 100
      : 0,
    releaseGroups: Array.from(new Set(files.map((f) => f.releaseGroup))),
    releaseTypes: [],
    episodeFileQualities: [],
  };
}

function seriesImages(series: DemoSeries) {
  const base = `${URL_BASE}/MediaCover/${series.tvdbId}`;
  const images: JsonObject[] = [];

  if (series.hasPoster) {
    images.push({
      coverType: 'poster',
      url: `${base}/poster.jpg`,
      remoteUrl: `${base}/poster.jpg`,
    });
  }

  if (series.hasBanner) {
    images.push({
      coverType: 'banner',
      url: `${base}/banner.jpg`,
      remoteUrl: `${base}/banner.jpg`,
    });
  }

  if (series.hasFanart) {
    images.push({
      coverType: 'fanart',
      url: `${base}/fanart.jpg`,
      remoteUrl: `${base}/fanart.jpg`,
    });
  }

  return images;
}

function seasonAirings(
  episodes: DemoEpisode[],
  seasonNumber: number,
  now: number
) {
  const times = episodes
    .filter((e) => e.seasonNumber === seasonNumber)
    .map((e) => Date.parse(e.airDateUtc))
    .sort((a, b) => a - b);
  const previous = times.filter((time) => time <= now).pop();
  const next = times.find((time) => time > now);

  return {
    previousAiring: previous ? new Date(previous).toISOString() : undefined,
    nextAiring: next ? new Date(next).toISOString() : undefined,
  };
}

export function seriesResource(db: DemoDb, series: DemoSeries): JsonObject {
  const now = Date.now();
  const episodes = db.episodes.filter((e) => e.seriesId === series.id);
  const seasonNumbers = Array.from(
    new Set(episodes.map((e) => e.seasonNumber))
  ).sort((a, b) => a - b);
  const sorted = [...episodes].sort(
    (a, b) => Date.parse(a.airDateUtc) - Date.parse(b.airDateUtc)
  );
  const next = sorted.find((e) => Date.parse(e.airDateUtc) > now);
  const previous = [...sorted]
    .reverse()
    .find((e) => Date.parse(e.airDateUtc) <= now);
  const first = sorted[0];
  const stats = statistics(db, episodes);

  return {
    id: series.id,
    title: series.title,
    sortTitle: series.title.toLowerCase().replace(/^the /, ''),
    titleSlug: seriesSlug(series),
    cleanTitle: cleanTitle(series.title),
    alternateTitles: [],
    status: series.status,
    ended: series.status === 'ended',
    overview: series.overview,
    network: series.network,
    airTime: series.airTime,
    images: seriesImages(series),
    originalLanguage: ENGLISH,
    language: ENGLISH,
    originalTitle: series.title,
    cleanOriginalTitle: cleanTitle(series.title),
    folders: [
      {
        language: ENGLISH,
        folder: folderName(seriesPath(series)),
      },
    ],
    isExcluded: false,
    translations: [],
    seasonType: 'official',
    seasonTypes: [
      {
        name: 'Aired',
        type: 'official',
        seasonNumbers,
        episodeCount: episodes.length,
      },
    ],
    originalCountry: 'us',
    seasons: seasonNumbers.map((seasonNumber) => ({
      seasonNumber,
      title: null,
      monitored: series.seasonMonitored[seasonNumber] ?? true,
      statistics: {
        ...statistics(
          db,
          episodes.filter((e) => e.seasonNumber === seasonNumber)
        ),
        ...seasonAirings(episodes, seasonNumber, now),
      },
      images: [],
    })),
    year: series.year,
    path: seriesPath(series),
    qualityProfileId: series.qualityProfileId,
    seasonFolder: series.seasonFolder ?? true,
    monitored: series.monitored,
    monitorNewItems: series.monitorNewItems ?? 'all',
    useSceneNumbering: false,
    runtime: series.runtime,
    tvdbId: series.tvdbId,
    tvRageId: 0,
    tvMazeId: series.tvMazeId,
    tmdbId: series.tmdbId,
    firstAired: first?.airDateUtc,
    lastAired: series.status === 'ended' ? previous?.airDateUtc : undefined,
    nextAiring: next?.airDateUtc,
    previousAiring: previous?.airDateUtc,
    seriesType: series.seriesType ?? 'standard',
    imdbId: series.imdbId,
    certification: series.certification,
    genres: series.genres,
    tags: series.tags,
    added: series.added,
    ratings: { votes: 1200 + series.id * 37, value: series.rating },
    statistics: { ...stats, seasonCount: seasonNumbers.length },
    rootFolderPath: seriesPath(series).replace(/\/[^/]+$/, ''),
  };
}

export function lookupResource(series: DemoSeries, seasonNumbers: number[]) {
  return {
    title: series.title,
    sortTitle: series.title.toLowerCase().replace(/^the /, ''),
    titleSlug: seriesSlug(series),
    cleanTitle: cleanTitle(series.title),
    alternateTitles: [],
    status: series.status,
    ended: series.status === 'ended',
    overview: series.overview,
    network: series.network,
    airTime: series.airTime,
    images: seriesImages(series),
    originalLanguage: ENGLISH,
    language: ENGLISH,
    originalTitle: series.title,
    cleanOriginalTitle: cleanTitle(series.title),
    translations: [],
    originalCountry: 'us',
    seasonType: 'official',
    seasonTypes: [],
    seasons: seasonNumbers.map((seasonNumber) => ({
      seasonNumber,
      title: null,
      monitored: true,
      images: [],
    })),
    folders: [{ language: ENGLISH, folder: seriesFolder(series) }],
    isExcluded: false,
    year: series.year,
    qualityProfileId: 0,
    seasonFolder: false,
    monitored: false,
    monitorNewItems: 'all',
    useSceneNumbering: false,
    runtime: series.runtime,
    tvdbId: series.tvdbId,
    tvRageId: 0,
    tvMazeId: series.tvMazeId,
    tmdbId: series.tmdbId,
    seriesType: 'standard',
    imdbId: series.imdbId,
    certification: series.certification,
    genres: series.genres,
    tags: [],
    added: '0001-01-01T00:00:00Z',
    ratings: { votes: 900, value: series.rating },
    statistics: {
      seasonCount: seasonNumbers.length,
      episodeFileCount: 0,
      episodeCount: 0,
      totalEpisodeCount: 0,
      sizeOnDisk: 0,
      releaseGroups: [],
      percentOfEpisodes: 0,
    },
  };
}
