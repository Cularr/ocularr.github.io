import { DemoDb } from './state/store';

const KEY = 'ocularr-demo-state';

const LOCK_NAME = `${KEY}:save`;

const MAX_AGE = 12 * 60 * 60 * 1000;

const TAB_ID = Math.random().toString(36).slice(2);

interface Snapshot {
  revision: string;
  version: string;
  savedAt: number;
  db: DemoDb;
}

let knownRevision: string | null = null;

function storedRevision() {
  const head = window.localStorage.getItem(KEY)?.slice(0, 100) ?? '';

  return /^\{"revision":"([^"]+)"/.exec(head)?.[1] ?? null;
}

export function loadSnapshot(version: string): DemoDb | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const snapshot = raw ? (JSON.parse(raw) as Snapshot) : null;

    knownRevision = snapshot?.revision ?? null;

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

function writeSnapshot(version: string, db: DemoDb) {
  try {
    if (storedRevision() !== knownRevision) {
      return;
    }

    const savedAt = Date.now();
    const revision = `${savedAt}:${TAB_ID}`;
    const snapshot: Snapshot = { revision, version, savedAt, db };

    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    knownRevision = revision;
  } catch {
    return;
  }
}

export function saveSnapshot(version: string, db: DemoDb) {
  const locks = navigator.locks as LockManager | undefined;

  if (!locks) {
    return;
  }

  locks
    .request(LOCK_NAME, () => writeSnapshot(version, db))
    .catch(() => undefined);
}
