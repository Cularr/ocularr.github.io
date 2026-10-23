import { ROOT_FOLDER } from '../constants';
import { folderName, seriesPath } from '../state/paths';
import { DemoDb } from '../state/store';

export function fileSystem(db: DemoDb, path: string) {
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

  const normalized = `/${path.split('/').filter(Boolean).join('/')}`;
  const children: Record<string, string[]> = {
    '/': ['config', 'data'],
    '/config': ['Backups', 'logs', 'MediaCover'],
    '/data': ['downloads', 'media'],
    '/data/downloads': ['complete', 'incomplete'],
    '/data/media': ['movies', 'tv'],
    [ROOT_FOLDER]: db.series
      .map((series) => folderName(seriesPath(series)))
      .sort(),
  };
  const base = normalized === '/' ? '' : normalized;

  return {
    parent:
      normalized === '/'
        ? null
        : `${normalized.split('/').slice(0, -1).join('/')}/`,
    directories: (children[normalized] ?? []).map((name) => ({
      type: 'folder',
      name,
      path: `${base}/${name}/`,
      size: 0,
      lastModified: null,
    })),
    files: [],
  };
}
