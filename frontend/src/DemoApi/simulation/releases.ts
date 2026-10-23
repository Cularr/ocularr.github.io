import { DemoEpisode, DemoRelease, Protocol } from '../DemoTypes';
import { qualityWeight } from '../qualities/model';
import { allowedQualityNames } from '../qualities/profiles';
import { isCutoffUnmet } from '../state/queries';
import {
  buildRelease,
  RELEASE_GROUPS,
  sceneName,
} from '../state/releaseFactory';
import { DemoDb } from '../state/store';

const RELEASE_CANDIDATES: { quality: string; protocol: Protocol }[] = [
  { quality: 'WEBDL-2160p', protocol: 'usenet' },
  { quality: 'WEBDL-1080p', protocol: 'usenet' },
  { quality: 'WEBDL-1080p', protocol: 'torrent' },
  { quality: 'WEBRip-1080p', protocol: 'torrent' },
  { quality: 'HDTV-1080p', protocol: 'usenet' },
  { quality: 'WEBDL-720p', protocol: 'torrent' },
  { quality: 'WEBDL-720p', protocol: 'usenet' },
  { quality: 'HDTV-720p', protocol: 'usenet' },
];

const SEASON_PACK_CANDIDATES = 6;

function allowedQualities(db: DemoDb, seriesId: number) {
  const series = db.series.find((s) => s.id === seriesId);

  return allowedQualityNames(
    db.collections.qualityprofile.find((p) => p.id === series?.qualityProfileId)
  );
}

export function releasesForEpisode(
  db: DemoDb,
  episode: DemoEpisode
): DemoRelease[] {
  const series = db.series.find((s) => s.id === episode.seriesId);

  if (!series) {
    return [];
  }

  const allowed = allowedQualities(db, series.id);
  const blocked = new Set(db.blocklist.map((item) => item.sourceTitle));

  return RELEASE_CANDIDATES.map((candidate, index) => {
    const group = RELEASE_GROUPS[(episode.id + index) % RELEASE_GROUPS.length];
    const release = buildRelease(
      db,
      series,
      [episode],
      candidate.quality,
      candidate.protocol,
      group,
      index
    );

    release.guid = `${episode.id}-${index}`;

    if (
      candidate.quality === 'WEBDL-1080p' &&
      candidate.protocol === 'usenet'
    ) {
      release.customFormatScore = 25;
    }

    if (!allowed.has(candidate.quality)) {
      release.rejections.push(`${candidate.quality} is not wanted in profile`);
    }

    if (blocked.has(release.title)) {
      release.rejections.push('Release is blocklisted');
    }

    return release;
  });
}

export function releasesForSeason(
  db: DemoDb,
  seriesId: number,
  seasonNumber: number
): DemoRelease[] {
  const series = db.series.find((s) => s.id === seriesId);
  const now = Date.now();
  const episodes = db.episodes
    .filter((e) => e.seriesId === seriesId && e.seasonNumber === seasonNumber)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  if (!series || !episodes.length) {
    return [];
  }

  const allowed = allowedQualities(db, series.id);
  const blocked = new Set(db.blocklist.map((item) => item.sourceTitle));
  const allAired = episodes.every((e) => Date.parse(e.airDateUtc) < now);
  const season = `S${String(seasonNumber).padStart(2, '0')}`;
  const packs = RELEASE_CANDIDATES.slice(0, SEASON_PACK_CANDIDATES).map(
    (candidate, index) => {
      const group = RELEASE_GROUPS[(seriesId + index) % RELEASE_GROUPS.length];
      const release = buildRelease(
        db,
        series,
        episodes,
        candidate.quality,
        candidate.protocol,
        group,
        index
      );
      const [, resolution = '1080p'] = candidate.quality.split('-');
      const source = candidate.quality.startsWith('HDTV')
        ? 'HDTV.x264'
        : 'WEB.h264';

      release.guid = `season-${seriesId}-${seasonNumber}-${index}`;
      release.title = `${sceneName(series, episodes[0]).replace(
        /\.S\d+E\d+$/,
        ''
      )}.${season}.${resolution}.${source}-${group}`;
      release.size = release.size * episodes.length;
      release.fullSeason = true;

      if (!allowed.has(candidate.quality)) {
        release.rejections.push(
          `${candidate.quality} is not wanted in profile`
        );
      }

      if (!allAired) {
        release.rejections.push('Not all episodes in season have aired');
      }

      if (blocked.has(release.title)) {
        release.rejections.push('Release is blocklisted');
      }

      return release;
    }
  );

  return [
    ...packs,
    ...episodes
      .filter((e) => Date.parse(e.airDateUtc) < now)
      .slice(0, 3)
      .flatMap((e) => releasesForEpisode(db, e).slice(0, 3)),
  ];
}

export function findRelease(db: DemoDb, guid: string) {
  const seasonMatch = /^season-(\d+)-(\d+)-\d+$/.exec(guid);

  if (seasonMatch) {
    return releasesForSeason(
      db,
      Number(seasonMatch[1]),
      Number(seasonMatch[2])
    ).find((r) => r.guid === guid);
  }

  const episode = db.episodes.find((e) => e.id === Number(guid.split('-')[0]));

  return episode
    ? releasesForEpisode(db, episode).find((r) => r.guid === guid)
    : undefined;
}

export function bestRelease(db: DemoDb, episode: DemoEpisode) {
  const file = db.episodeFiles.find((f) => f.id === episode.episodeFileId);

  if (file && !isCutoffUnmet(db, file)) {
    return undefined;
  }

  return releasesForEpisode(db, episode)
    .filter(
      (release) =>
        release.rejections.length === 0 &&
        (!file || qualityWeight(release.quality) > qualityWeight(file.quality))
    )
    .sort(
      (a, b) =>
        qualityWeight(b.quality) - qualityWeight(a.quality) ||
        b.customFormatScore - a.customFormatScore
    )[0];
}
