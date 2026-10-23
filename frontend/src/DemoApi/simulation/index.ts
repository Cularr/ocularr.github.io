import { missingEpisodes } from '../state/queries';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import { enqueue, tick } from './queue';
import { bestRelease } from './releases';

const FAILING_DOWNLOAD_AT = 0.35;

const FAILING_DOWNLOAD_EVERY = 90;

function seedFailingDownload(db: DemoDb) {
  if (db.queue.some((item) => item.failAt !== null)) {
    return;
  }

  const candidates = missingEpisodes(db);
  const episode = candidates[Math.floor(Math.random() * candidates.length)];
  const release = episode ? bestRelease(db, episode) : undefined;

  if (release) {
    enqueue(db, release, FAILING_DOWNLOAD_AT);
  }
}

export function startSimulation(db: DemoDb) {
  let count = 0;

  window.setInterval(() => {
    tick(db);
    count += 1;

    if (count % 3 === 0 && db.queue.length) {
      broadcast('queue', 'sync');
      broadcast('queue/details', 'sync');
    }

    if (count % FAILING_DOWNLOAD_EVERY === 0) {
      seedFailingDownload(db);
    }
  }, 1000);
}
