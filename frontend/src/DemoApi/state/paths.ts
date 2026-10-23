import { ROOT_FOLDER } from '../constants';

interface Titled {
  title: string;
  year: number;
  path?: string;
}

export function seriesFolder(series: Titled) {
  return `${series.title} (${series.year})`;
}

export function seriesPath(series: Titled) {
  return series.path ?? `${ROOT_FOLDER}/${seriesFolder(series)}`;
}

export function folderName(path: string) {
  return path.split('/').pop() ?? path;
}
