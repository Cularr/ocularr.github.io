import { INDEXERS } from '../collections/seed';
import { HOUR } from '../constants';
import { DemoRelease, DemoSeries, DemoWork, Protocol } from '../DemoTypes';
import { DemoDb } from './store';

export const RELEASE_GROUPS = [
  'PAPERBOAT',
  'LAMPLIGHT',
  'NOCTURNE',
  'SALT',
  'KESTREL',
];

const QUALITY_SIZES: Record<string, number> = {
  'Digital MQ': 0.8,
  'Scan MQ': 0.9,
  'WebRip HQ': 2.3,
  'Digital HQ': 2.9,
  'Scan HQ': 2.6,
  'Retail HQ': 4.4,
  'Digital UHQ': 8.6,
  'Retail UHQ': 11.2,
};

export function qualitySize(quality: string, seed: number) {
  const base = QUALITY_SIZES[quality] ?? 2;

  return Math.round((base + (seed % 7) * 0.04) * 16 * 1024 * 1024);
}

export function sceneName(series: DemoSeries, work: DemoWork) {
  const volume = String(work.volumeNumber ?? 0).padStart(2, '0');
  const number = String(work.number).padStart(2, '0');

  return `${series.title
    .replace('&', 'and')
    .replace(/[^A-Za-z0-9]+/g, '.')}.v${volume}.c${number}`;
}

export function buildRelease(
  db: DemoDb,
  series: DemoSeries,
  works: DemoWork[],
  quality: string,
  protocol: Protocol,
  group: string,
  index: number
): DemoRelease {
  const indexers = INDEXERS.filter((i) => i.protocol === protocol);
  const indexer = indexers[index % indexers.length];
  const first = works[0];
  const isTorrent = protocol === 'torrent';

  return {
    guid: `${protocol}-${first.id}-${quality}-${group}-${db.nextId}-${index}`,
    seriesId: series.id,
    workIds: works.map((e) => e.id),
    title: `${sceneName(series, first)}.${quality.replace(/ /g, '.')}-${group}`,
    protocol,
    indexerId: indexer.id,
    indexer: indexer.name,
    quality,
    size: qualitySize(quality, first.id + index),
    ageHours: Math.max(
      1,
      Math.round(
        (Date.now() - (Date.parse(first.releaseDateUtc) || Date.now())) / HOUR
      )
    ),
    seeders: isTorrent ? 40 + ((first.id * (index + 7)) % 380) : null,
    leechers: isTorrent ? 2 + ((first.id * (index + 1)) % 30) : null,
    customFormatScore: 0,
    releaseGroup: group,
    releaseType: works.length > 1 ? 'multiChapter' : 'singleChapter',
    rejections: [],
  };
}
