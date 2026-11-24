import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import { tick } from './queue';

export function startSimulation(db: DemoDb) {
  let count = 0;

  window.setInterval(() => {
    tick(db);
    count += 1;

    if (count % 3 === 0 && db.queue.length) {
      broadcast('queue', 'sync');
      broadcast('queue/details', 'sync');
    }
  }, 1000);
}
