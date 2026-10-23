import { INDEXERS } from '../collections/seed';
import { HOUR } from '../constants';
import { DemoEpisode, DemoRelease, DemoSeries, Protocol } from '../DemoTypes';
import { DemoDb } from './store';

export const RELEASE_GROUPS = [
  'PAPERBOAT',
  'LAMPLIGHT',
  'NOCTURNE',
  'SALT',
  'KESTREL',
];

const QUALITY_SIZES: Record<string, number> = {
  'WEBDL-720p': 0.8,
  'HDTV-720p': 0.9,
  'WEBRip-1080p': 2.3,
  'WEBDL-1080p': 2.9,
  'HDTV-1080p': 2.6,
  'Bluray-1080p': 4.4,
  'WEBDL-2160p': 8.6,
  'Bluray-2160p': 11.2,
};

export function qualitySize(quality: string, seed: number) {
  const base = QUALITY_SIZES[quality] ?? 2;

  return Math.round((base + (seed % 7) * 0.04) * 1024 * 1024 * 1024);
}

export function sceneName(series: DemoSeries, episode: DemoEpisode) {
  const season = String(episode.seasonNumber).padStart(2, '0');
  const number = String(episode.episodeNumber).padStart(2, '0');

  return `${series.title
    .replace('&', 'and')
    .replace(/[^A-Za-z0-9]+/g, '.')}.S${season}E${number}`;
}

export function buildRelease(
  db: DemoDb,
  series: DemoSeries,
  episodes: DemoEpisode[],
  quality: string,
  protocol: Protocol,
  group: string,
  index: number
): DemoRelease {
  const indexers = INDEXERS.filter((i) => i.protocol === protocol);
  const indexer = indexers[index % indexers.length];
  const first = episodes[0];
  const resolution = quality.split('-')[1] ?? '1080p';
  const source = quality.startsWith('HDTV') ? 'HDTV.x264' : 'WEB.h264';
  const isTorrent = protocol === 'torrent';

  return {
    guid: `${protocol}-${first.id}-${quality}-${group}-${db.nextId}-${index}`,
    seriesId: series.id,
    episodeIds: episodes.map((e) => e.id),
    title: `${sceneName(series, first)}.${resolution}.${source}-${group}`,
    protocol,
    indexerId: indexer.id,
    indexer: indexer.name,
    quality,
    size: qualitySize(quality, first.id + index),
    ageHours: Math.max(
      1,
      Math.round((Date.now() - Date.parse(first.airDateUtc)) / HOUR)
    ),
    seeders: isTorrent ? 40 + ((first.id * (index + 7)) % 380) : null,
    leechers: isTorrent ? 2 + ((first.id * (index + 1)) % 30) : null,
    customFormatScore: 0,
    releaseGroup: group,
    rejections: [],
  };
}
