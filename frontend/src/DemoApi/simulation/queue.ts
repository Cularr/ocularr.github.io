import { DemoEpisode, DemoQueueItem, DemoRelease } from '../DemoTypes';
import { episodeFileResource, episodeResource } from '../resources/episode';
import { queueProgress, queueStatus } from '../resources/queue';
import { seriesResource } from '../resources/series';
import { isQueued } from '../state/queries';
import { qualitySize } from '../state/releaseFactory';
import { DemoDb, nextId } from '../state/store';
import { broadcast } from '../transport/signalR';
import { bestRelease } from './releases';

function emitQueue(db: DemoDb) {
  broadcast('queue', 'sync');
  broadcast('queue/details', 'sync');
  broadcast('queue/status', 'updated', queueStatus(db));
}

function emitEpisode(db: DemoDb, episode: DemoEpisode) {
  const series = db.series.find((s) => s.id === episode.seriesId);

  broadcast('episode', 'updated', episodeResource(db, episode));
  broadcast('calendar', 'updated', episodeResource(db, episode, true));
  broadcast('wanted/missing', 'updated', episodeResource(db, episode, true));

  if (series) {
    broadcast('series', 'updated', seriesResource(db, series));
  }
}

export function enqueue(
  db: DemoDb,
  release: DemoRelease,
  failAt: number | null = null
) {
  if (release.episodeIds.some((id) => isQueued(db, id))) {
    return null;
  }

  const now = Date.now();
  const item: DemoQueueItem = {
    id: nextId(db),
    release,
    downloadClient: release.protocol === 'usenet' ? 'SABnzbd' : 'qBittorrent',
    added: now,
    duration: 22000 + (release.size % 7) * 3000,
    failAt,
    state: 'downloading',
    stateChanged: now,
  };

  db.queue.push(item);
  db.history.unshift({
    id: nextId(db),
    seriesId: release.seriesId,
    episodeId: release.episodeIds[0],
    sourceTitle: release.title,
    quality: release.quality,
    date: new Date(now).toISOString(),
    eventType: 'grabbed',
    data: {
      indexer: release.indexer,
      releaseGroup: release.releaseGroup,
      downloadClient: item.downloadClient,
      downloadClientName: item.downloadClient,
      size: String(release.size),
      protocol: release.protocol,
    },
  });

  db.episodes
    .filter((e) => release.episodeIds.includes(e.id))
    .forEach((episode) => emitEpisode(db, episode));

  emitQueue(db);

  return item;
}

export function searchEpisodes(db: DemoDb, episodes: DemoEpisode[]) {
  episodes.forEach((episode) => {
    const release = bestRelease(db, episode);

    if (release) {
      enqueue(db, release);
    }
  });
}

function importItem(db: DemoDb, item: DemoQueueItem) {
  const now = new Date().toISOString();
  const episodes = db.episodes.filter((e) =>
    item.release.episodeIds.includes(e.id)
  );

  db.queue = db.queue.filter((q) => q.id !== item.id);

  episodes.forEach((episode) => {
    const fileId = nextId(db);
    const file = {
      id: fileId,
      seriesId: episode.seriesId,
      seasonNumber: episode.seasonNumber,
      quality: item.release.quality,
      size: qualitySize(item.release.quality, fileId),
      releaseGroup: item.release.releaseGroup,
      dateAdded: now,
    };

    const replaced = episode.episodeFileId;

    if (replaced) {
      db.episodeFiles = db.episodeFiles.filter((f) => f.id !== replaced);
      broadcast('episodefile', 'deleted', { id: replaced });
    }

    db.episodeFiles.push(file);
    episode.episodeFileId = fileId;

    db.history.unshift({
      id: nextId(db),
      seriesId: episode.seriesId,
      episodeId: episode.id,
      sourceTitle: item.release.title,
      quality: item.release.quality,
      date: now,
      eventType: 'downloadFolderImported',
      data: {
        downloadClient: item.downloadClient,
        downloadClientName: item.downloadClient,
        droppedPath: `/data/downloads/${item.release.protocol}/${item.release.title}`,
        size: String(file.size),
      },
    });

    const resource = episodeFileResource(db, file);

    db.history[0].data.importedPath = resource.path;
    broadcast('episodefile', 'updated', resource);
    emitEpisode(db, episode);
  });

  emitQueue(db);
}

function blocklistItem(db: DemoDb, item: DemoQueueItem, message: string) {
  db.blocklist.unshift({
    id: nextId(db),
    seriesId: item.release.seriesId,
    episodeIds: item.release.episodeIds,
    sourceTitle: item.release.title,
    quality: item.release.quality,
    protocol: item.release.protocol,
    indexer: item.release.indexer,
    message,
    date: new Date().toISOString(),
  });
}

function itemEpisodes(db: DemoDb, item: DemoQueueItem) {
  return db.episodes.filter((e) => item.release.episodeIds.includes(e.id));
}

function failItem(db: DemoDb, item: DemoQueueItem) {
  const message = 'Password protected archive';

  db.queue = db.queue.filter((q) => q.id !== item.id);
  blocklistItem(db, item, message);
  db.history.unshift({
    id: nextId(db),
    seriesId: item.release.seriesId,
    episodeId: item.release.episodeIds[0],
    sourceTitle: item.release.title,
    quality: item.release.quality,
    date: new Date().toISOString(),
    eventType: 'downloadFailed',
    data: {
      message,
      indexer: item.release.indexer,
    },
  });

  emitQueue(db);
}

export function removeQueueItem(
  db: DemoDb,
  id: number,
  options: { blocklist: boolean; skipRedownload: boolean }
) {
  const item = db.queue.find((q) => q.id === id);

  if (!item) {
    return;
  }

  db.queue = db.queue.filter((q) => q.id !== id);

  if (options.blocklist) {
    blocklistItem(db, item, 'Manually removed from the queue');
  }

  itemEpisodes(db, item).forEach((episode) => emitEpisode(db, episode));
  emitQueue(db);

  if (options.blocklist && !options.skipRedownload) {
    searchEpisodes(db, itemEpisodes(db, item));
  }
}

export function tick(db: DemoDb) {
  const now = Date.now();
  let changed = false;

  [...db.queue].forEach((item) => {
    const progress = queueProgress(item, now);

    if (item.state === 'downloading') {
      if (item.failAt !== null && progress >= item.failAt) {
        item.state = 'failed';
        item.stateChanged = now;
        changed = true;
      } else if (progress >= 1) {
        item.state = 'importing';
        item.stateChanged = now;
        changed = true;
      }
    } else if (item.state === 'importing' && now - item.stateChanged > 3000) {
      importItem(db, item);
    } else if (item.state === 'failed' && now - item.stateChanged > 6000) {
      failItem(db, item);
    }
  });

  if (changed) {
    emitQueue(db);
  }
}
