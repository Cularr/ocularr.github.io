import { Collections } from '../collections/items';
import {
  DemoBlocklist,
  DemoCommand,
  DemoHistory,
  DemoQueueItem,
  DemoSeries,
  DemoWork,
  DemoWorkFile,
  JsonObject,
} from '../DemoTypes';

export interface DemoDb {
  series: DemoSeries[];
  works: DemoWork[];
  workFiles: DemoWorkFile[];
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
