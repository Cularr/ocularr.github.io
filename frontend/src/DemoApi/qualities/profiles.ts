import { JsonObject } from '../DemoTypes';
import { QUALITIES, QualityDefinition } from './definitions';
import { getQuality, qualityInfo, qualityWeight, sizes } from './model';

export const PROFILE_IDS = {
  medium: 4,
  high: 5,
  ultra: 6,
};

export function defaultQualityProfile(
  id: number,
  name: string,
  cutoff: string,
  allowed: string[]
): JsonObject {
  const groups = new Map<number, QualityDefinition[]>();
  const items: JsonObject[] = [];
  let groupId = 1000;
  let cutoffId = getQuality(cutoff).id;

  QUALITIES.forEach((quality) => {
    const group = ['unknown', 'cam', 'master'].includes(quality.source)
      ? -quality.weight
      : Math.floor(quality.weight / 10);
    groups.set(group, [...(groups.get(group) ?? []), quality]);
  });

  groups.forEach((group) => {
    if (group.length === 1) {
      const [quality] = group;

      items.push({
        quality: qualityInfo(quality),
        items: [],
        allowed: allowed.includes(quality.name),
        ...sizes(quality),
      });

      return;
    }

    const groupAllowed = group.some((q) => allowed.includes(q.name));

    items.push({
      id: groupId,
      name: group[0].groupName,
      items: group.map((quality) => ({
        quality: qualityInfo(quality),
        items: [],
        allowed: groupAllowed,
        ...sizes(quality),
      })),
      allowed: groupAllowed,
    });

    if (group.some((q) => q.name === cutoff)) {
      cutoffId = groupId;
    }

    groupId += 1;
  });

  return {
    id,
    name,
    upgradeAllowed: false,
    partialUpgradeAllowed: false,
    cutoff: cutoffId,
    items,
    minFormatScore: 0,
    cutoffFormatScore: 0,
    minUpgradeFormatScore: 1,
    formatItems: [],
  };
}

export function defaultQualityProfiles(): JsonObject[] {
  return [
    defaultQualityProfile(1, 'Any', 'WebRip LQ', [
      'WebRip LQ',
      'Scan LQ',
      'Retail LQ',
      'Hybrid LQ',
      'Digital LQ',
      'WebRip MQ',
      'Scan MQ',
      'Retail MQ',
      'Hybrid MQ',
      'Digital MQ',
      'WebRip HQ',
      'Scan HQ',
      'Retail HQ',
      'Hybrid HQ',
      'Digital HQ',
      'Scan UHQ',
      'Retail UHQ',
      'Hybrid UHQ',
      'Digital UHQ',
    ]),
    defaultQualityProfile(2, 'ELQ', 'Scan ELQ', ['Scan ELQ', 'WebRip ELQ']),
    defaultQualityProfile(3, 'LQ', 'WebRip LQ', [
      'WebRip LQ',
      'Scan LQ',
      'Retail LQ',
      'Hybrid LQ',
      'Digital LQ',
    ]),
    defaultQualityProfile(4, 'MQ', 'WebRip MQ', [
      'WebRip MQ',
      'Scan MQ',
      'Retail MQ',
      'Hybrid MQ',
      'Digital MQ',
    ]),
    defaultQualityProfile(5, 'HQ', 'WebRip HQ', [
      'WebRip HQ',
      'Scan HQ',
      'Retail HQ',
      'Hybrid HQ',
      'Digital HQ',
    ]),
    defaultQualityProfile(6, 'UHQ', 'Scan UHQ', [
      'Scan UHQ',
      'Retail UHQ',
      'Hybrid UHQ',
      'Digital UHQ',
    ]),
    defaultQualityProfile(7, 'MQ & HQ', 'WebRip MQ', [
      'WebRip MQ',
      'Scan MQ',
      'Retail MQ',
      'Hybrid MQ',
      'Digital MQ',
      'WebRip HQ',
      'Scan HQ',
      'Retail HQ',
      'Hybrid HQ',
      'Digital HQ',
    ]),
  ];
}

export function allowedQualityNames(profile: JsonObject | undefined) {
  const names = new Set<string>();

  function visit(items: JsonObject[]) {
    items.forEach((item) => {
      const children = (item.items ?? []) as JsonObject[];

      if (children.length) {
        if (item.allowed) {
          children
            .filter((child) => child.allowed)
            .forEach((child) => {
              names.add((child.quality as { name: string }).name);
            });
        }

        return;
      }

      if (item.allowed && item.quality) {
        names.add((item.quality as { name: string }).name);
      }
    });
  }

  visit((profile?.items ?? []) as JsonObject[]);

  return names;
}

export function cutoffWeight(profile: JsonObject | undefined) {
  if (!profile) {
    return 0;
  }

  const items = (profile.items ?? []) as JsonObject[];
  const group = items.find((item) => item.id === profile.cutoff);

  if (group) {
    const [first] = (group.items ?? []) as { quality: { name: string } }[];

    return first ? qualityWeight(first.quality.name) : 0;
  }

  const quality = QUALITIES.find((q) => q.id === profile.cutoff);

  return quality ? quality.weight : 0;
}
