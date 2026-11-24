import { ROOT_FOLDER } from '../constants';
import { relativeFilePath } from '../resources/work';
import { folderName, seriesPath } from '../state/paths';
import { DemoDb } from '../state/store';

function libraryFiles(db: DemoDb, directory: string) {
  const series = new Map(db.series.map((s) => [s.id, s]));
  return db.workFiles.flatMap((file) => {
    const owner = series.get(file.seriesId);

    if (!owner) {
      return [];
    }

    const root = `${seriesPath(owner)}/`;

    if (!directory.startsWith(root) && !root.startsWith(directory)) {
      return [];
    }

    const path = root + relativeFilePath(db, file, owner);
    return path.startsWith(directory)
      ? [
          {
            type: 'file',
            path,
            name: folderName(path),
            size: file.size,
            lastModified: file.dateAdded,
          },
        ]
      : [];
  });
}

export function mediaFiles(db: DemoDb, path: string) {
  if (!path) {
    return [];
  }

  const directory = `${path.replace(/\/+$/, '')}/`;
  return libraryFiles(db, directory).map((file) => ({
    path: file.path,
    relativePath: file.path.slice(directory.length),
    name: file.name,
  }));
}

export function fileSystem(
  db: DemoDb,
  path: string,
  includeFiles: boolean,
  allowFolder: boolean
) {
  if (!path) {
    return {
      parent: null,
      directories: ['/', '/config', '/data'].map((drive) => ({
        type: 'drive',
        name: drive,
        path: drive === '/' ? '/' : `${drive}/`,
        size: 0,
        lastModified: null,
      })),
      files: [],
    };
  }

  let normalized = `/${path.split('/').filter(Boolean).join('/')}`;
  const children: Record<string, string[]> = {
    '/': ['config', 'data'],
    '/config': ['Backups', 'logs', 'MediaCover'],
    '/data': ['downloads', 'media'],
    '/data/downloads': ['complete', 'incomplete'],
    '/data/media': [folderName(ROOT_FOLDER)],
    [ROOT_FOLDER]: db.series
      .map((series) => folderName(seriesPath(series)))
      .sort(),
  };

  function contents(folder: string) {
    const prefix = folder === '/' ? '/' : `${folder}/`;
    const names = new Set(children[folder] ?? []);
    const files = [];

    if (db.series.some((s) => prefix.startsWith(`${seriesPath(s)}/`))) {
      for (const file of libraryFiles(db, prefix)) {
        const rest = file.path.slice(prefix.length);
        const slash = rest.indexOf('/');

        if (slash >= 0) {
          names.add(rest.slice(0, slash));
        } else {
          files.push(file);
        }
      }
    }

    return { names, files };
  }

  let listing = contents(normalized);
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || '/';
  const folderExists =
    listing.names.size > 0 ||
    listing.files.length > 0 ||
    children[parent]?.includes(folderName(normalized));

  if (!path.endsWith('/') && !(allowFolder && folderExists)) {
    normalized = parent;
    listing = contents(normalized);
  }

  const base = normalized === '/' ? '' : normalized;

  return {
    parent:
      normalized === '/'
        ? null
        : `${normalized.split('/').slice(0, -1).join('/')}/`,
    directories: [...listing.names].sort().map((name) => ({
      type: 'folder',
      name,
      path: `${base}/${name}/`,
      size: 0,
      lastModified: null,
    })),
    files: includeFiles ? listing.files : [],
  };
}
