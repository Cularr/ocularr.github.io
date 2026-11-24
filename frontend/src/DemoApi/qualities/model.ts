import { JsonObject, QualityInfo } from '../DemoTypes';
import { QUALITIES, QualityDefinition } from './definitions';

export function getQuality(name: string) {
  return QUALITIES.find((q) => q.name === name) ?? QUALITIES[0];
}

export function qualityInfo(quality: QualityInfo) {
  return {
    id: quality.id,
    name: quality.name,
    source: quality.source,
    tier: quality.tier,
  };
}

export function qualityModel(name: string) {
  return {
    quality: qualityInfo(getQuality(name)),
    revision: { version: 1, real: 0, isRepack: false },
  };
}

export function qualityDefinitions(): JsonObject[] {
  return QUALITIES.map((quality, index) => ({
    id: index + 1,
    quality: qualityInfo(quality),
    title: quality.name,
    weight: quality.weight,
    minSize: quality.minSize,
    maxSize: quality.maxSize,
    preferredSize: quality.preferredSize,
  }));
}

export function sizes(quality: QualityDefinition) {
  return {
    minSize: quality.minSize,
    maxSize: quality.maxSize,
    preferredSize: quality.preferredSize,
  };
}

export function qualityWeight(name: string) {
  return getQuality(name).weight;
}
