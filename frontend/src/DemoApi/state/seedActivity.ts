import { INDEXERS } from '../collections/seed';
import { HOUR } from '../constants';
import { DemoQueueItem, Protocol } from '../DemoTypes';
import { failItem } from '../simulation/queue';
import { seriesPath } from './paths';
import { buildRelease, sceneName } from './releaseFactory';
import { isPlaceholderTitle } from './seedWorks';
import { DemoDb, nextId } from './store';

function latestReleased(db: DemoDb, seriesId: number) {
  const now = Date.now();

  return db.works
    .filter(
      (e) =>
        e.seriesId === seriesId &&
        e.monitored &&
        Date.parse(e.releaseDateUtc) < now &&
        !isPlaceholderTitle(e.title)
    )
    .sort(
      (a, b) => Date.parse(b.releaseDateUtc) - Date.parse(a.releaseDateUtc)
    )[0];
}

export function seedQueue(db: DemoDb) {
  const now = Date.now();
  const seeds: {
    foreignSeriesId: string;
    quality: string;
    protocol: Protocol;
    group: string;
    client: string;
    progress: number;
    duration: number;
    failAt: number | null;
  }[] = [
    {
      foreignSeriesId: 'f9f3e80a-37bb-8715-9bdd-6d5b1042f4c6',
      quality: 'Digital HQ',
      protocol: 'usenet',
      group: 'NOCTURNE',
      client: 'SABnzbd',
      progress: 0.46,
      duration: 6 * HOUR,
      failAt: null,
    },
    {
      foreignSeriesId: '3e4b8dbd-8af1-8056-a8ae-b8643731a45a',
      quality: 'Digital MQ',
      protocol: 'torrent',
      group: 'KESTREL',
      client: 'qBittorrent',
      progress: 0.71,
      duration: 8 * HOUR,
      failAt: null,
    },
    {
      foreignSeriesId: 'e6b9ad4f-6993-8117-9d80-cace85f48369',
      quality: 'Digital HQ',
      protocol: 'usenet',
      group: 'LAMPLIGHT',
      client: 'SABnzbd',
      progress: 0.38,
      duration: 90000,
      failAt: 0.38,
    },
  ];

  seeds.forEach((seed, index) => {
    const series = db.series.find(
      (s) => s.foreignSeriesId === seed.foreignSeriesId
    );
    const work = series ? latestReleased(db, series.id) : undefined;

    if (!series || !work) {
      return;
    }

    db.workFiles = db.workFiles.filter((f) => f.id !== work.workFileId);
    work.workFileId = 0;

    const item: DemoQueueItem = {
      id: index + 1,
      release: buildRelease(
        db,
        series,
        [work],
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
    };

    db.queue.push(item);

    if (seed.failAt !== null && seed.progress >= seed.failAt) {
      failItem(db, item);
    }
  });
}

export function seedHistory(db: DemoDb) {
  const recentFiles = [...db.workFiles]
    .sort((a, b) => Date.parse(b.dateAdded) - Date.parse(a.dateAdded))
    .slice(0, 12);

  recentFiles.forEach((file) => {
    const work = db.works.find((e) => e.workFileId === file.id);
    const series = db.series.find((s) => s.id === file.seriesId);

    if (!work || !series) {
      return;
    }

    const title = `${sceneName(series, work)}.${file.quality.replace(
      / /g,
      '.'
    )}-${file.releaseGroup}`;
    const imported = Date.parse(file.dateAdded);

    db.history.push({
      id: nextId(db),
      seriesId: series.id,
      workId: work.id,
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
      workId: work.id,
      sourceTitle: title,
      quality: file.quality,
      date: new Date(imported).toISOString(),
      eventType: 'downloadFolderImported',
      data: {
        downloadClient: 'SABnzbd',
        downloadClientName: 'SABnzbd',
        droppedPath: `/data/downloads/usenet/complete/${title}`,
        importedPath: `${seriesPath(series)}/Volume ${
          file.volumeNumber
        }/${title}.cbz`,
        size: String(file.size),
      },
    });
  });

  db.history.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function seedBlocklist(db: DemoDb) {
  const series = db.series.find(
    (s) => s.foreignSeriesId === '3e4b8dbd-8af1-8056-a8ae-b8643731a45a'
  );
  const work = db.works.find(
    (e) => e.seriesId === series?.id && e.volumeNumber === 1 && e.number === 1
  );

  if (!series || !work || !work.releaseDateUtc) {
    return;
  }

  db.blocklist.push({
    id: nextId(db),
    seriesId: series.id,
    workIds: [work.id],
    sourceTitle: `${sceneName(series, work)}.Retail.HQ-SALT`,
    quality: 'Retail HQ',
    protocol: 'usenet',
    indexer: INDEXERS[1].name,
    message: 'Unpacking failed, missing repair blocks',
    date: new Date(Date.parse(work.releaseDateUtc) + 3 * HOUR).toISOString(),
  });
}
