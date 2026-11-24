import { DemoQueueItem, DemoRelease, DemoWork } from '../DemoTypes';
import { queueProgress, queueStatus } from '../resources/queue';
import { seriesResource } from '../resources/series';
import { workFileResource, workResource } from '../resources/work';
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

function emitWork(db: DemoDb, work: DemoWork) {
  const series = db.series.find((s) => s.id === work.seriesId);

  broadcast('work', 'updated', workResource(db, work));
  broadcast('calendar', 'updated', workResource(db, work, true));
  broadcast('wanted/missing', 'updated', workResource(db, work, true));

  if (series) {
    broadcast('series', 'updated', seriesResource(db, series));
  }
}

export function enqueue(
  db: DemoDb,
  release: DemoRelease,
  failAt: number | null = null
) {
  if (release.workIds.some((id) => isQueued(db, id))) {
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
    workId: release.workIds[0],
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

  db.works
    .filter((e) => release.workIds.includes(e.id))
    .forEach((work) => emitWork(db, work));

  emitQueue(db);

  return item;
}

export function searchWorks(db: DemoDb, works: DemoWork[]) {
  const lastSearchTime = new Date().toISOString();

  works.forEach((work) => {
    Object.assign(work, { lastSearchTime });

    const release = bestRelease(db, work);

    if (release) {
      enqueue(db, release);
    }
  });
}

function importItem(db: DemoDb, item: DemoQueueItem) {
  const now = new Date().toISOString();
  const works = db.works.filter((e) => item.release.workIds.includes(e.id));

  db.queue = db.queue.filter((q) => q.id !== item.id);

  works.forEach((work) => {
    const fileId = nextId(db);
    const file = {
      id: fileId,
      seriesId: work.seriesId,
      volumeNumber: work.volumeNumber ?? 0,
      quality: item.release.quality,
      size: qualitySize(item.release.quality, fileId),
      releaseGroup: item.release.releaseGroup,
      releaseType:
        item.release.releaseType ??
        (item.release.fullVolume ? 'volumePack' : 'singleChapter'),
      dateAdded: now,
    };

    const replaced = work.workFileId;

    if (replaced) {
      db.workFiles = db.workFiles.filter((f) => f.id !== replaced);
      broadcast('workfile', 'deleted', { id: replaced });
    }

    db.workFiles.push(file);
    work.workFileId = fileId;

    db.history.unshift({
      id: nextId(db),
      seriesId: work.seriesId,
      workId: work.id,
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

    const resource = workFileResource(db, file);

    db.history[0].data.importedPath = resource.path;
    broadcast('workfile', 'updated', resource);
    emitWork(db, work);
  });

  emitQueue(db);
}

function blocklistItem(db: DemoDb, item: DemoQueueItem, message: string) {
  db.blocklist.unshift({
    id: nextId(db),
    seriesId: item.release.seriesId,
    workIds: item.release.workIds,
    sourceTitle: item.release.title,
    quality: item.release.quality,
    protocol: item.release.protocol,
    indexer: item.release.indexer,
    message,
    date: new Date().toISOString(),
  });
}

function itemWorks(db: DemoDb, item: DemoQueueItem) {
  return db.works.filter((e) => item.release.workIds.includes(e.id));
}

export function failItem(db: DemoDb, item: DemoQueueItem) {
  const message = 'Password protected archive';

  db.queue = db.queue.filter((q) => q.id !== item.id);
  blocklistItem(db, item, message);
  db.history.unshift({
    id: nextId(db),
    seriesId: item.release.seriesId,
    workId: item.release.workIds[0],
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

  itemWorks(db, item).forEach((work) => emitWork(db, work));
  emitQueue(db);

  if (options.blocklist && !options.skipRedownload) {
    searchWorks(db, itemWorks(db, item));
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
