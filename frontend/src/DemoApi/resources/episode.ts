import { ENGLISH, ROOT_FOLDER } from '../constants';
import {
  DemoEpisode,
  DemoEpisodeFile,
  DemoSeries,
  JsonObject,
} from '../DemoTypes';
import { qualityModel } from '../qualities/model';
import { seriesPath } from '../state/paths';
import { isCutoffUnmet, isQueued } from '../state/queries';
import { DemoDb } from '../state/store';
import { seriesResource } from './series';

function localDate(value: string) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function fileName(db: DemoDb, file: DemoEpisodeFile, series?: DemoSeries) {
  const numbers = db.episodes
    .filter((e) => e.episodeFileId === file.id)
    .map((e) => `E${String(e.episodeNumber).padStart(2, '0')}`)
    .join('');
  const season = String(file.seasonNumber).padStart(2, '0');

  return `${series?.title ?? 'Series'} - S${season}${numbers || 'E01'} - ${
    file.quality
  }.mkv`;
}

const EPISODE_TVDB_OFFSET = 900000;

export function episodeFileResource(
  db: DemoDb,
  file: DemoEpisodeFile
): JsonObject {
  const series = db.series.find((s) => s.id === file.seriesId);
  let resolution = '1920x1080';

  if (file.quality.includes('2160')) {
    resolution = '3840x2160';
  } else if (file.quality.includes('720')) {
    resolution = '1280x720';
  }

  return {
    id: file.id,
    seriesId: file.seriesId,
    seasonNumber: file.seasonNumber,
    relativePath: `Season ${file.seasonNumber}/${fileName(db, file, series)}`,
    path: `${series ? seriesPath(series) : ROOT_FOLDER}/Season ${
      file.seasonNumber
    }/${fileName(db, file, series)}`,
    size: file.size,
    dateAdded: file.dateAdded,
    sceneName: '',
    releaseGroup: file.releaseGroup,
    languages: [ENGLISH],
    quality: qualityModel(file.quality),
    customFormats: [],
    customFormatScore: 0,
    indexerFlags: 0,
    releaseType: 'singleEpisode',
    qualityCutoffNotMet: isCutoffUnmet(db, file),
    mediaInfo: {
      id: 0,
      audioBitrate: 384000,
      audioChannels: 5.1,
      audioCodec: 'EAC3',
      audioLanguages: 'eng',
      audioStreamCount: 1,
      videoBitDepth: 8,
      videoBitrate: 6000000,
      videoCodec: 'h264',
      videoFps: 23.976,
      videoDynamicRange: '',
      videoDynamicRangeType: '',
      resolution,
      runTime: '48:12',
      scanType: 'Progressive',
      subtitles: 'eng',
      audioStreams: [],
      subtitleStreams: [],
    },
  };
}

export function episodeResource(
  db: DemoDb,
  episode: DemoEpisode,
  includeSeries = false,
  includeEpisodeFile = false
): JsonObject {
  const series = db.series.find((s) => s.id === episode.seriesId);
  const file = db.episodeFiles.find((f) => f.id === episode.episodeFileId);

  return {
    id: episode.id,
    seriesId: episode.seriesId,
    tvdbId: EPISODE_TVDB_OFFSET + episode.id,
    episodeFileId: file ? file.id : 0,
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    airDate: localDate(episode.airDateUtc),
    airDateUtc: episode.airDateUtc,
    runtime: series?.runtime ?? 45,
    overview: '',
    hasFile: !!file,
    monitored: episode.monitored,
    grabbed: isQueued(db, episode.id),
    unverifiedSceneNumbering: false,
    finaleType:
      episode.episodeNumber > 1 && lastInSeason(db, episode)
        ? 'season'
        : undefined,
    series: includeSeries && series ? seriesResource(db, series) : undefined,
    episodeFile:
      includeEpisodeFile && file ? episodeFileResource(db, file) : undefined,
  };
}

function lastInSeason(db: DemoDb, episode: DemoEpisode) {
  return !db.episodes.some(
    (e) =>
      e.seriesId === episode.seriesId &&
      e.seasonNumber === episode.seasonNumber &&
      e.episodeNumber > episode.episodeNumber
  );
}
