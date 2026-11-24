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
  tier: string,
  weight: number,
  minSize: number,
  maxSize: number | null,
  preferredSize: number
];

const ROWS: QualityRow[] = [
  [0, 'Unknown', 'unknown', 'unknown', 1, 0.005, 20, 0.3],
  [10, 'Cam ELQ', 'cam', 'elq', 10, 0.01, 1, 0.08],
  [20, 'WebRip ELQ', 'webRip', 'elq', 11, 0.01, 1, 0.08],
  [30, 'Scan ELQ', 'scan', 'elq', 12, 0.01, 1, 0.08],
  [11, 'Cam LQ', 'cam', 'lq', 20, 0.02, 3, 0.2],
  [21, 'WebRip LQ', 'webRip', 'lq', 21, 0.02, 3, 0.2],
  [31, 'Scan LQ', 'scan', 'lq', 22, 0.02, 5, 0.3],
  [41, 'Retail LQ', 'retail', 'lq', 23, 0.02, 5, 0.3],
  [51, 'Hybrid LQ', 'hybrid', 'lq', 24, 0.02, 5, 0.3],
  [61, 'Digital LQ', 'digital', 'lq', 25, 0.02, 5, 0.3],
  [12, 'Cam MQ', 'cam', 'mq', 30, 0.03, 5, 0.4],
  [22, 'WebRip MQ', 'webRip', 'mq', 31, 0.03, 5, 0.4],
  [32, 'Scan MQ', 'scan', 'mq', 32, 0.03, 8, 0.6],
  [42, 'Retail MQ', 'retail', 'mq', 33, 0.03, 8, 0.6],
  [52, 'Hybrid MQ', 'hybrid', 'mq', 34, 0.03, 8, 0.6],
  [62, 'Digital MQ', 'digital', 'mq', 35, 0.03, 8, 0.6],
  [23, 'WebRip HQ', 'webRip', 'hq', 41, 0.08, 10, 0.8],
  [33, 'Scan HQ', 'scan', 'hq', 42, 0.1, 12, 1.2],
  [43, 'Retail HQ', 'retail', 'hq', 43, 0.1, 12, 1.2],
  [53, 'Hybrid HQ', 'hybrid', 'hq', 44, 0.1, 12, 1.2],
  [63, 'Digital HQ', 'digital', 'hq', 45, 0.1, 12, 1.2],
  [34, 'Scan UHQ', 'scan', 'uhq', 52, 0.2, 20, 2.5],
  [44, 'Retail UHQ', 'retail', 'uhq', 53, 0.2, 20, 2.5],
  [54, 'Hybrid UHQ', 'hybrid', 'uhq', 54, 0.2, 20, 2.5],
  [64, 'Digital UHQ', 'digital', 'uhq', 55, 0.2, 20, 2.5],
  [74, 'Master', 'master', 'uhq', 56, 0.3, null, 4],
  [65, 'Digital Vector', 'digital', 'vector', 65, 0.005, 10, 0.2],
  [75, 'Master Vector', 'master', 'vector', 66, 0.005, null, 0.2],
];

export const QUALITIES: QualityDefinition[] = ROWS.map(
  ([id, name, source, tier, weight, minSize, maxSize, preferredSize]) => ({
    id,
    name,
    source,
    tier,
    weight,
    minSize,
    maxSize,
    preferredSize,
    groupName: tier.toUpperCase(),
  })
);
