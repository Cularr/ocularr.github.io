import { DemoDb } from './state/store';

const KEY = 'sonarr-demo-state';

const MAX_AGE = 12 * 60 * 60 * 1000;

interface Snapshot {
  version: string;
  savedAt: number;
  db: DemoDb;
}

export function loadSnapshot(version: string): DemoDb | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const snapshot = raw ? (JSON.parse(raw) as Snapshot) : null;

    if (
      !snapshot ||
      snapshot.version !== version ||
      Date.now() - snapshot.savedAt > MAX_AGE
    ) {
      return null;
    }

    snapshot.db.commands.forEach((command) => {
      if (command.status !== 'completed') {
        command.status = 'completed';
        command.ended = new Date().toISOString();
      }
    });

    return snapshot.db;
  } catch {
    return null;
  }
}

export function saveSnapshot(version: string, db: DemoDb) {
  try {
    const snapshot: Snapshot = { version, savedAt: Date.now(), db };

    window.sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    return;
  }
}
