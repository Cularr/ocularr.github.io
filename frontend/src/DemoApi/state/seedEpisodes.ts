import { ShowData } from '../DemoTypes';
import { PROFILE_IDS } from '../qualities/profiles';
import { qualitySize, RELEASE_GROUPS } from './releaseFactory';
import { DemoDb, nextId } from './store';

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function airDate(offset: number, airTime: string) {
  const [hours, minutes] = airTime.split(':').map(Number);
  const date = startOfToday();

  date.setDate(date.getDate() + offset);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function qualityFor(show: ShowData, seasonNumber: number, lastSeason: number) {
  if (show.qualityProfileId === PROFILE_IDS.ultraHd) {
    return show.status === 'ended' ? 'Bluray-2160p' : 'WEBDL-2160p';
  }

  if (show.qualityProfileId === PROFILE_IDS.hd720p1080p) {
    return 'WEBDL-720p';
  }

  return show.status === 'continuing' && seasonNumber === lastSeason
    ? 'WEBDL-1080p'
    : 'Bluray-1080p';
}

export function isPlaceholderTitle(title: string) {
  return !title || /^(tba|tbd|episode \d+)$/i.test(title.trim());
}

function scheduleFor(show: ShowData, lastSeason: number) {
  const airing = show.airing;
  const lastEpisodes = show.episodes.filter(
    (e) => e.seasonNumber === lastSeason
  );
  const titledCount = lastEpisodes.findIndex((e) =>
    isPlaceholderTitle(e.title)
  );
  const airedLimit = titledCount === -1 ? lastEpisodes.length : titledCount;
  const anchor = airing
    ? Math.min(airing.anchor, airedLimit - (airing.dayOffset > 0 ? 0 : 1))
    : 0;

  return (seasonNumber: number, episodeNumber: number, airDateUtc: string) => {
    if (!airing || seasonNumber !== lastSeason) {
      return { date: new Date(airDateUtc), isMissing: false };
    }

    const index = lastEpisodes.findIndex(
      (e) => e.episodeNumber === episodeNumber
    );
    const offset = (index - anchor) * 7 + airing.dayOffset;
    const isMissing = (airing.missing ?? []).some(
      (weeksAgo) => index === anchor - weeksAgo
    );

    return { date: airDate(offset, show.airTime), isMissing };
  };
}

export function seedShowEpisodes(
  db: DemoDb,
  show: ShowData,
  seriesId: number,
  withFiles: boolean
) {
  const now = Date.now();
  const lastSeason = Math.max(...show.episodes.map((e) => e.seasonNumber), 1);
  const schedule = scheduleFor(show, lastSeason);

  show.episodes.forEach((source) => {
    const { seasonNumber, episodeNumber } = source;
    const { date, isMissing } = schedule(
      seasonNumber,
      episodeNumber,
      source.airDateUtc
    );
    const hasFile = withFiles && date.getTime() < now && !isMissing;
    const id = nextId(db);
    const quality = qualityFor(show, seasonNumber, lastSeason);
    let episodeFileId = 0;

    if (hasFile) {
      episodeFileId = nextId(db);

      db.episodeFiles.push({
        id: episodeFileId,
        seriesId,
        seasonNumber,
        quality,
        size: qualitySize(quality, id),
        releaseGroup: RELEASE_GROUPS[id % RELEASE_GROUPS.length],
        dateAdded: new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      });
    }

    db.episodes.push({
      id,
      seriesId,
      seasonNumber,
      episodeNumber,
      title: source.title,
      airDateUtc: date.toISOString(),
      monitored: true,
      episodeFileId,
    });
  });
}
