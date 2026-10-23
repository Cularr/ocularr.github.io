import { seedCollections } from '../collections/seed';
import { ShowsFile } from '../DemoTypes';
import { getQuality } from '../qualities/model';
import { PROFILE_IDS } from '../qualities/profiles';
import { defaultSettings } from '../settings';
import { setCatalog, toDemoSeries } from './catalog';
import { seedBlocklist, seedHistory, seedQueue } from './seedActivity';
import { seedShowEpisodes } from './seedEpisodes';
import { DemoDb } from './store';

const FIRST_ID = 1000;

export function restoreDb(file: ShowsFile, saved: DemoDb) {
  setCatalog(file.shows);

  return saved;
}

export function createDb(file: ShowsFile): DemoDb {
  const db: DemoDb = {
    series: [],
    episodes: [],
    episodeFiles: [],
    queue: [],
    history: [],
    blocklist: [],
    commands: [],
    collections: seedCollections(),
    settings: defaultSettings(),
    updateInstalled: false,
    nextId: FIRST_ID,
  };

  const library = file.shows.filter((show) => show.library);

  setCatalog(file.shows);
  db.series = library.map((show, index) => toDemoSeries(show, index + 1));

  library.forEach((show, index) => seedShowEpisodes(db, show, index + 1, true));
  db.collections.qualityprofile = db.collections.qualityprofile.map((profile) =>
    profile.id === PROFILE_IDS.hd1080p
      ? {
          ...profile,
          upgradeAllowed: true,
          cutoff: getQuality('Bluray-1080p').id,
        }
      : profile
  );

  seedQueue(db);
  seedHistory(db);
  seedBlocklist(db);

  return db;
}
