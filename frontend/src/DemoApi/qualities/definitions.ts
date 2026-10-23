import { QualityInfo } from '../DemoTypes';

export interface QualityDefinition extends QualityInfo {
  weight: number;
  minSize: number;
  maxSize: number | null;
  preferredSize: number;
  groupName?: string;
}

type QualityRow = [
  id: number,
  name: string,
  source: string,
  resolution: number,
  weight: number,
  minSize: number,
  maxSize: number | null,
  groupName?: string
];

const PREFERRED_SIZE = 95;

const ROWS: QualityRow[] = [
  [0, 'Unknown', 'unknown', 0, 1, 1, 199.9],
  [1, 'SDTV', 'television', 480, 2, 2, 100],
  [12, 'WEBRip-480p', 'webRip', 480, 3, 2, 100, 'WEB 480p'],
  [8, 'WEBDL-480p', 'web', 480, 3, 2, 100, 'WEB 480p'],
  [2, 'DVD', 'dvd', 480, 4, 2, 100],
  [13, 'Bluray-480p', 'bluray', 480, 5, 2, 100],
  [22, 'Bluray-576p', 'bluray', 576, 6, 2, 100],
  [4, 'HDTV-720p', 'television', 720, 7, 3, 125],
  [9, 'HDTV-1080p', 'television', 1080, 8, 4, 125],
  [10, 'Raw-HD', 'televisionRaw', 1080, 9, 4, null],
  [14, 'WEBRip-720p', 'webRip', 720, 10, 3, 130, 'WEB 720p'],
  [5, 'WEBDL-720p', 'web', 720, 10, 3, 130, 'WEB 720p'],
  [6, 'Bluray-720p', 'bluray', 720, 11, 4, 130],
  [15, 'WEBRip-1080p', 'webRip', 1080, 12, 4, 130, 'WEB 1080p'],
  [3, 'WEBDL-1080p', 'web', 1080, 12, 4, 130, 'WEB 1080p'],
  [7, 'Bluray-1080p', 'bluray', 1080, 13, 4, 155],
  [20, 'Bluray-1080p Remux', 'blurayRaw', 1080, 14, 35, null],
  [16, 'HDTV-2160p', 'television', 2160, 15, 35, 199.9],
  [17, 'WEBRip-2160p', 'webRip', 2160, 16, 35, null, 'WEB 2160p'],
  [18, 'WEBDL-2160p', 'web', 2160, 16, 35, null, 'WEB 2160p'],
  [19, 'Bluray-2160p', 'bluray', 2160, 17, 35, null],
  [21, 'Bluray-2160p Remux', 'blurayRaw', 2160, 18, 35, null],
];

export const QUALITIES: QualityDefinition[] = ROWS.map(
  ([id, name, source, resolution, weight, minSize, maxSize, groupName]) => ({
    id,
    name,
    source,
    resolution,
    weight,
    minSize,
    maxSize,
    preferredSize: PREFERRED_SIZE,
    groupName,
  })
);
