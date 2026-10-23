import { INDEXERS } from '../collections/seed';
import { HOUR } from '../constants';
import { Protocol } from '../DemoTypes';
import { seriesPath } from './paths';
import { buildRelease, sceneName } from './releaseFactory';
import { isPlaceholderTitle } from './seedEpisodes';
import { DemoDb, nextId } from './store';

function latestAired(db: DemoDb, seriesId: number) {
  const now = Date.now();

  return db.episodes
    .filter(
      (e) =>
        e.seriesId === seriesId &&
        Date.parse(e.airDateUtc) < now &&
        !isPlaceholderTitle(e.title)
    )
    .sort((a, b) => Date.parse(b.airDateUtc) - Date.parse(a.airDateUtc))[0];
}

export function seedQueue(db: DemoDb) {
  const now = Date.now();
  const seeds: {
    tvdbId: number;
    quality: string;
    protocol: Protocol;
    group: string;
    client: string;
    progress: number;
    duration: number;
    failAt: number | null;
  }[] = [
    {
      tvdbId: 372264,
      quality: 'WEBDL-1080p',
      protocol: 'usenet',
      group: 'NOCTURNE',
      client: 'SABnzbd',
      progress: 0.46,
      duration: 110000,
      failAt: null,
    },
    {
      tvdbId: 402910,
      quality: 'WEBDL-720p',
      protocol: 'torrent',
      group: 'KESTREL',
      client: 'qBittorrent',
      progress: 0.71,
      duration: 150000,
      failAt: null,
    },
    {
      tvdbId: 399959,
      quality: 'WEBDL-1080p',
      protocol: 'usenet',
      group: 'LAMPLIGHT',
      client: 'SABnzbd',
      progress: 0.12,
      duration: 90000,
      failAt: 0.38,
    },
  ];

  seeds.forEach((seed, index) => {
    const series = db.series.find((s) => s.tvdbId === seed.tvdbId);
    const episode = series ? latestAired(db, series.id) : undefined;

    if (!series || !episode) {
      return;
    }

    db.episodeFiles = db.episodeFiles.filter(
      (f) => f.id !== episode.episodeFileId
    );
    episode.episodeFileId = 0;

    db.queue.push({
      id: index + 1,
      release: buildRelease(
        db,
        series,
        [episode],
        seed.quality,
        seed.protocol,
        seed.group,
        index
      ),
      downloadClient: seed.client,
      added: now - seed.progress * seed.duration,
      duration: seed.duration,
      failAt: seed.failAt,
      state: 'downloading',
      stateChanged: now,
    });
  });
}

export function seedHistory(db: DemoDb) {
  const recentFiles = [...db.episodeFiles]
    .sort((a, b) => Date.parse(b.dateAdded) - Date.parse(a.dateAdded))
    .slice(0, 12);

  recentFiles.forEach((file) => {
    const episode = db.episodes.find((e) => e.episodeFileId === file.id);
    const series = db.series.find((s) => s.id === file.seriesId);

    if (!episode || !series) {
      return;
    }

    const title = `${sceneName(series, episode)}.${
      file.quality.split('-')[1] ?? '1080p'
    }.WEB.h264-${file.releaseGroup}`;
    const imported = Date.parse(file.dateAdded);

    db.history.push({
      id: nextId(db),
      seriesId: series.id,
      episodeId: episode.id,
      sourceTitle: title,
      quality: file.quality,
      date: new Date(imported - 20 * 60 * 1000).toISOString(),
      eventType: 'grabbed',
      data: {
        indexer: INDEXERS[0].name,
        releaseGroup: file.releaseGroup,
        downloadClient: 'SABnzbd',
        downloadClientName: 'SABnzbd',
        size: String(file.size),
        protocol: 'usenet',
      },
    });

    db.history.push({
      id: nextId(db),
      seriesId: series.id,
      episodeId: episode.id,
      sourceTitle: title,
      quality: file.quality,
      date: new Date(imported).toISOString(),
      eventType: 'downloadFolderImported',
      data: {
        downloadClient: 'SABnzbd',
        downloadClientName: 'SABnzbd',
        droppedPath: `/data/downloads/usenet/complete/${title}`,
        importedPath: `${seriesPath(series)}/Season ${
          episode.seasonNumber
        }/${title}.mkv`,
        size: String(file.size),
      },
    });
  });

  db.history.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function seedBlocklist(db: DemoDb) {
  const series = db.series.find((s) => s.tvdbId === 289590);
  const episode = db.episodes.find(
    (e) =>
      e.seriesId === series?.id && e.seasonNumber === 1 && e.episodeNumber === 1
  );

  if (!series || !episode) {
    return;
  }

  db.blocklist.push({
    id: nextId(db),
    seriesId: series.id,
    episodeIds: [episode.id],
    sourceTitle: `${sceneName(series, episode)}.1080p.BluRay.x264-SALT`,
    quality: 'Bluray-1080p',
    protocol: 'usenet',
    indexer: INDEXERS[1].name,
    message: 'Unpacking failed, missing repair blocks',
    date: new Date(Date.parse(episode.airDateUtc) + 3 * HOUR).toISOString(),
  });
}
