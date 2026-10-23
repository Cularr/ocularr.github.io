import { Collections } from '../collections/items';
import {
  DemoBlocklist,
  DemoCommand,
  DemoEpisode,
  DemoEpisodeFile,
  DemoHistory,
  DemoQueueItem,
  DemoSeries,
  JsonObject,
} from '../DemoTypes';

export interface DemoDb {
  series: DemoSeries[];
  episodes: DemoEpisode[];
  episodeFiles: DemoEpisodeFile[];
  queue: DemoQueueItem[];
  history: DemoHistory[];
  blocklist: DemoBlocklist[];
  commands: DemoCommand[];
  collections: Collections;
  settings: Record<string, JsonObject>;
  updateInstalled: boolean;
  nextId: number;
}

export function nextId(db: DemoDb) {
  db.nextId += 1;

  return db.nextId;
}
