import { ENGLISH } from '../constants';
import { JsonObject } from '../DemoTypes';
import { getQuality, qualityModel } from '../qualities/model';
import { episodeResource } from '../resources/episode';
import { seriesResource } from '../resources/series';
import { DemoDb } from '../state/store';

export function parseTitle(db: DemoDb, title: string): JsonObject {
  const episodeMatch =
    /^(.*?)[ ._-]+S(\d{1,2})E(\d{1,3})(?:-?E(\d{1,3}))?/i.exec(title);
  const seasonMatch = /^(.*?)[ ._-]+S(\d{1,2})(?![E\d])/i.exec(title);
  const match = episodeMatch ?? seasonMatch;
  const seriesTitle = (match?.[1] ?? title).replace(/[._]/g, ' ').trim();
  const seasonNumber = match ? Number(match[2]) : null;
  const episodeNumbers = episodeMatch
    ? [
        Number(episodeMatch[3]),
        ...(episodeMatch[4] ? [Number(episodeMatch[4])] : []),
      ]
    : [];
  const resolution =
    /2160p|1080p|720p|480p/i.exec(title)?.[0]?.toLowerCase() ?? '';
  let source = 'HDTV';

  if (/web[ ._-]?dl|\bweb\b/i.test(title)) {
    source = 'WEBDL';
  }

  if (/webrip/i.test(title)) {
    source = 'WEBRip';
  }

  if (/blu[ -]?ray|bdrip|brrip/i.test(title)) {
    source = 'Bluray';
  }

  const quality = getQuality(resolution ? `${source}-${resolution}` : '');
  let releaseType = episodeMatch ? 'singleEpisode' : 'seasonPack';

  if (episodeNumbers.length > 1) {
    releaseType = 'multiEpisode';
  }

  const releaseGroup = /-([A-Za-z0-9]+)(?:\.[a-z0-9]{2,4})?$/.exec(title)?.[1];
  const clean = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const series = db.series.find(
    (s) => clean(s.title) === clean(seriesTitle.replace(/\s\(?\d{4}\)?$/, ''))
  );
  const episodes = series
    ? db.episodes.filter(
        (e) =>
          e.seriesId === series.id &&
          e.seasonNumber === seasonNumber &&
          (!episodeNumbers.length || episodeNumbers.includes(e.episodeNumber))
      )
    : [];

  return {
    id: 0,
    title,
    parsedEpisodeInfo: match
      ? {
          releaseTitle: title,
          seriesTitle,
          seriesTitleInfo: {
            title: seriesTitle,
            titleWithoutYear: seriesTitle,
            year: 0,
          },
          quality: qualityModel(quality.name),
          seasonNumbers: seasonNumber === null ? [] : [seasonNumber],
          episodeNumbers,
          absoluteEpisodeNumbers: [],
          specialAbsoluteEpisodeNumbers: [],
          languages: [ENGLISH],
          fullSeason: !episodeMatch,
          isPartialSeason: false,
          isMultiSeason: false,
          isSeasonExtra: false,
          special: false,
          releaseHash: '',
          seasonPart: 0,
          releaseGroup,
          releaseTokens: title.slice(match[0].length),
          isDaily: false,
          isAbsoluteNumbering: false,
          isPossibleSpecialEpisode: false,
          isPossibleSceneSeasonSpecial: false,
          isSeasonTitle: false,
          isSplitEpisode: false,
          isMiniSeries: false,
          releaseType,
        }
      : null,
    series: series ? seriesResource(db, series) : undefined,
    episodes: episodes.map((e) => episodeResource(db, e)),
    languages: [ENGLISH],
    customFormats: [],
    customFormatScore: 0,
  };
}
