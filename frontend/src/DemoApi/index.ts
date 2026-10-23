import { PROVIDERS_PATH, SHOWS_PATH } from './assetPaths';
import { URL_BASE } from './constants';
import { ProvidersFile, ShowsFile } from './DemoTypes';
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

const SNAPSHOT_VERSION = `${SHOWS_PATH}|${PROVIDERS_PATH}|2`;

function readTheme() {
  try {
    const theme = window.parent.localStorage.getItem('theme');

    return theme === 'light' || theme === 'dark' ? theme : 'auto';
  } catch {
    return 'auto';
  }
}

function loadJson<T>(path: string) {
  return nativeFetch(path).then((response) => response.json() as Promise<T>);
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
  loadJson<ShowsFile>(SHOWS_PATH),
  loadJson<ProvidersFile>(PROVIDERS_PATH),
])
  .then(([shows, providers]) => {
    setProviders(providers);

    const saved = loadSnapshot(SNAPSHOT_VERSION);
    const db = saved ? restoreDb(shows, saved) : createDb(shows);

    if (!saved) {
      db.settings.ui.uiLanguage = browserLanguage(navigator.languages);
    }

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
    window.setInterval(save, 15000);

    return db;
  });

let saveTimeout = 0;

const resolve = createResolver(
  dbReady,
  URL_BASE,
  (db) => ({
    apiRoot: '/api/v5',
    apiKey: 'demo',
    urlBase: URL_BASE,
    theme,
    version: currentVersion(db),
    instanceName: String(db.settings.general.instanceName ?? 'Sonarr'),
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
