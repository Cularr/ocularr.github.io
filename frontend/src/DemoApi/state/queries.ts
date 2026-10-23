import { DemoEpisode, DemoEpisodeFile } from '../DemoTypes';
import { qualityWeight } from '../qualities/model';
import { cutoffWeight } from '../qualities/profiles';
import { DemoDb } from './store';

export function isQueued(db: DemoDb, episodeId: number) {
  return db.queue.some((item) => item.release.episodeIds.includes(episodeId));
}

export function isCutoffUnmet(db: DemoDb, file: DemoEpisodeFile) {
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

interface EpisodeQuery {
  monitored?: boolean;
  includeQueued?: boolean;
  filter?: (episode: DemoEpisode) => boolean;
}

function newestFirst(a: DemoEpisode, b: DemoEpisode) {
  return Date.parse(b.airDateUtc) - Date.parse(a.airDateUtc);
}

export function missingEpisodes(
  db: DemoDb,
  { monitored = true, includeQueued = false, filter }: EpisodeQuery = {}
) {
  const now = Date.now();

  return db.episodes
    .filter(
      (e) =>
        e.monitored === monitored &&
        !e.episodeFileId &&
        Date.parse(e.airDateUtc) < now &&
        (includeQueued || !isQueued(db, e.id)) &&
        (!filter || filter(e))
    )
    .sort(newestFirst);
}

export function cutoffUnmetEpisodes(
  db: DemoDb,
  { includeQueued = false, filter }: EpisodeQuery = {}
) {
  const files = new Map(db.episodeFiles.map((file) => [file.id, file]));

  return db.episodes
    .filter((e) => {
      const file = files.get(e.episodeFileId);

      return (
        !!file &&
        e.monitored &&
        isCutoffUnmet(db, file) &&
        (includeQueued || !isQueued(db, e.id)) &&
        (!filter || filter(e))
      );
    })
    .sort(newestFirst);
}
