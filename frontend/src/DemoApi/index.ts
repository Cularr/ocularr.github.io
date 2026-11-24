import { PROVIDERS_PATH, SERIES_PATH } from './assetPaths';
import { URL_BASE } from './constants';
import { ProvidersFile, SeriesFile } from './DemoTypes';
import { browserLanguage } from './languages';
import { loadSnapshot, saveSnapshot } from './persistence';
import { setProviders } from './providers/registry';
import { startSimulation } from './simulation/index';
import { createDb, restoreDb } from './state/db';
import { DemoDb } from './state/store';
import { currentVersion } from './state/version';
import { loadTranslations } from './translations';
import { createResolver, installFetch, nativeFetch } from './transport/http';
import { installXhr } from './transport/xhr';

const SNAPSHOT_VERSION = `${SERIES_PATH}|${PROVIDERS_PATH}|3`;

function readTheme() {
  try {
    const theme = window.parent.localStorage.getItem('theme');

    return theme === 'light' || theme === 'dark' ? theme : 'auto';
  } catch {
    return 'auto';
  }
}

function loadJson<T>(path: string) {
  return nativeFetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${path} (HTTP ${response.status})`);
    }

    return response.json() as Promise<T>;
  });
}

function restoreRoute() {
  const route = new URLSearchParams(window.location.search).get('route');

  if (!route || !route.startsWith('/') || route.startsWith('//')) {
    return;
  }

  try {
    const target = new URL(`${URL_BASE}${route}`, window.location.origin);

    if (
      target.origin === window.location.origin &&
      target.pathname.startsWith(`${URL_BASE}/`)
    ) {
      window.history.replaceState(
        null,
        '',
        `${target.pathname}${target.search}${target.hash}`
      );
    }
  } catch {
    return;
  }
}

restoreRoute();

const theme = readTheme();

const dbReady: Promise<DemoDb> = Promise.all([
  loadJson<SeriesFile>(SERIES_PATH),
  loadJson<ProvidersFile>(PROVIDERS_PATH),
])
  .then(([seriesFile, providers]) => {
    setProviders(providers);

    const saved = loadSnapshot(SNAPSHOT_VERSION);
    const db = saved ? restoreDb(seriesFile, saved) : createDb(seriesFile);

    if (!saved) {
      db.settings.ui.uiLanguage = browserLanguage(navigator.languages);
    }

    db.collections.sourcecredit = seriesFile.sourceCredits;
    db.settings.ui = { ...db.settings.ui, theme };
    startSimulation(db);

    return loadTranslations(nativeFetch, Number(db.settings.ui.uiLanguage ?? 1))
      .catch(() => ({}))
      .then(() => db);
  })
  .then((db) => {
    const save = () => saveSnapshot(SNAPSHOT_VERSION, db);

    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        save();
      }
    });

    return db;
  });

let saveTimeout = 0;

const resolve = createResolver(
  dbReady,
  URL_BASE,
  (db) => ({
    apiRoot: '/api/v1',
    apiKey: 'demo',
    urlBase: URL_BASE,
    theme,
    version: currentVersion(db),
    instanceName: String(db.settings.general.instanceName ?? 'Ocularr'),
    isProduction: true,
    release: 'main',
  }),
  () => {
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
      dbReady.then((db) => saveSnapshot(SNAPSHOT_VERSION, db));
    }, 300);
  }
);

installFetch(resolve);

installXhr(resolve);
