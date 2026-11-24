import { seedCollections } from '../collections/seed';
import { SeriesFile } from '../DemoTypes';
import { PROFILE_IDS } from '../qualities/profiles';
import { defaultSettings } from '../settings';
import { setCatalog, toDemoSeries } from './catalog';
import { seedBlocklist, seedHistory, seedQueue } from './seedActivity';
import { seedSeriesWorks } from './seedWorks';
import { DemoDb } from './store';

const FIRST_ID = 1000;

export function restoreDb(file: SeriesFile, saved: DemoDb) {
  setCatalog(file.series);

  return saved;
}

export function createDb(file: SeriesFile): DemoDb {
  const db: DemoDb = {
    series: [],
    works: [],
    workFiles: [],
    queue: [],
    history: [],
    blocklist: [],
    commands: [],
    collections: seedCollections(),
    settings: defaultSettings(),
    updateInstalled: false,
    nextId: FIRST_ID,
  };

  const library = file.series.filter((entry) => entry.library);

  setCatalog(file.series);
  library.forEach((entry, index) => {
    const series = toDemoSeries(entry, index + 1);

    db.series.push(series);
    seedSeriesWorks(db, entry, series, true);
  });
  db.collections.qualityprofile = db.collections.qualityprofile.map((profile) =>
    profile.id === PROFILE_IDS.medium
      ? {
          ...profile,
          upgradeAllowed: true,
        }
      : profile
  );

  seedQueue(db);
  seedHistory(db);
  seedBlocklist(db);

  return db;
}
