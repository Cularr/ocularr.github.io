import { createHash } from 'crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL_BASE } from '../frontend/src/DemoApi/constants.ts';
import { slug } from '../frontend/src/DemoApi/slug.ts';

export default function finalizeDemo(demoDir: string) {
  function hashed(baseName: string, extension: string) {
    const source = path.join(demoDir, `${baseName}${extension}`);
    const previous = readdirSync(demoDir).filter(
      (file) =>
        file.startsWith(`${baseName}.`) &&
        file.endsWith(extension) &&
        file !== `${baseName}${extension}`
    );

    if (!existsSync(source)) {
      if (!previous.length) {
        throw new Error(`${baseName}${extension} is missing from ${demoDir}`);
      }

      return `${URL_BASE}/${previous[0]}`;
    }

    previous.forEach((file) => rmSync(path.join(demoDir, file)));

    const hash = createHash('sha256')
      .update(readFileSync(source))
      .digest('hex')
      .slice(0, 10);
    const name = `${baseName}.${hash}${extension}`;

    renameSync(source, path.join(demoDir, name));

    return `${URL_BASE}/${name}`;
  }

  function hashedDirectory(baseName: string) {
    const source = path.join(demoDir, baseName);
    const previous = readdirSync(demoDir).filter(
      (file) => file.startsWith(`${baseName}.`) && file !== baseName
    );

    if (!existsSync(source)) {
      const directory = previous.find((file) =>
        statSync(path.join(demoDir, file)).isDirectory()
      );

      if (!directory) {
        throw new Error(`${baseName} is missing from ${demoDir}`);
      }

      return `${URL_BASE}/${directory}`;
    }

    previous.forEach((file) =>
      rmSync(path.join(demoDir, file), { recursive: true, force: true })
    );

    const hash = createHash('sha256');

    readdirSync(source)
      .sort()
      .forEach((file) => {
        hash.update(file);
        hash.update(readFileSync(path.join(source, file)));
      });

    const name = `${baseName}.${hash.digest('hex').slice(0, 10)}`;

    renameSync(source, path.join(demoDir, name));

    return `${URL_BASE}/${name}`;
  }

  const apiPath = hashed('demo-api', '.js');
  const showsPath = hashed('shows', '.json');
  const providersPath = hashed('providers', '.json');
  const localizationPath = hashedDirectory('localization');

  const indexPath = path.join(demoDir, 'index.html');
  const index = readFileSync(indexPath, 'utf8').replace(
    /<script src="\/demo\/demo-api[^"]*"[^>]*><\/script>/,
    `<script src="${apiPath}" data-shows="${showsPath}" data-providers="${providersPath}" data-localization="${localizationPath}"></script>`
  );

  writeFileSync(indexPath, index);

  const APP_ROUTES = [
    'add/new',
    'add/import',
    'calendar',
    'seasonpass',
    'series',
    'serieseditor',
    'statistics',
    'activity/queue',
    'activity/history',
    'activity/blocklist',
    'wanted/missing',
    'wanted/cutoffunmet',
    'settings',
    'settings/mediamanagement',
    'settings/profiles',
    'settings/quality',
    'settings/customformats',
    'settings/indexers',
    'settings/downloadclients',
    'settings/importlists',
    'settings/connect',
    'settings/metadata',
    'settings/metadatasource',
    'settings/tags',
    'settings/general',
    'settings/ui',
    'system/status',
    'system/tasks',
    'system/backup',
    'system/updates',
    'system/events',
    'system/logs/files',
    'system/logs/files/update',
  ];

  const ROUTE_ROOTS = [
    'add',
    'calendar',
    'seasonpass',
    'series',
    'serieseditor',
    'statistics',
    'activity',
    'wanted',
    'settings',
    'system',
  ];

  ROUTE_ROOTS.forEach((root) =>
    rmSync(path.join(demoDir, root), { recursive: true, force: true })
  );

  const shows = JSON.parse(
    readFileSync(
      path.join(demoDir, showsPath.replace(`${URL_BASE}/`, '')),
      'utf8'
    )
  ) as { shows: { title: string }[] };

  [
    ...APP_ROUTES,
    ...shows.shows.map((show) => `series/${slug(show.title)}`),
  ].forEach((route) => {
    const directory = path.join(demoDir, route);

    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'index.html'), index);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  finalizeDemo(path.resolve(import.meta.dirname, '..', 'demo'));
}
