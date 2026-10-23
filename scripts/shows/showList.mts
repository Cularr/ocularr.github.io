export interface ShowConfig {
  tvdbId: number;
  qualityProfileId: number;
  library: boolean;
  airing?: {
    anchor: number;
    dayOffset: number;
    missing?: number[];
  };
}

export const SHOWS: ShowConfig[] = [
  {
    tvdbId: 372264,
    qualityProfileId: 4,
    library: true,
    airing: { anchor: 3, dayOffset: 0, missing: [2] },
  },
  {
    tvdbId: 402910,
    qualityProfileId: 6,
    library: true,
    airing: { anchor: 6, dayOffset: 2 },
  },
  {
    tvdbId: 383203,
    qualityProfileId: 4,
    library: true,
    airing: { anchor: 4, dayOffset: -3 },
  },
  {
    tvdbId: 399959,
    qualityProfileId: 4,
    library: true,
    airing: { anchor: 5, dayOffset: -1 },
  },
  {
    tvdbId: 371980,
    qualityProfileId: 5,
    library: true,
    airing: { anchor: -1, dayOffset: 3 },
  },
  {
    tvdbId: 411364,
    qualityProfileId: 4,
    library: true,
    airing: { anchor: 2, dayOffset: 1, missing: [1] },
  },
  { tvdbId: 81189, qualityProfileId: 4, library: true },
  { tvdbId: 273181, qualityProfileId: 4, library: true },
  { tvdbId: 360893, qualityProfileId: 5, library: true },
  { tvdbId: 334824, qualityProfileId: 5, library: true },
  { tvdbId: 289590, qualityProfileId: 4, library: true },
  { tvdbId: 371028, qualityProfileId: 5, library: true },
  { tvdbId: 403294, qualityProfileId: 4, library: true },
  { tvdbId: 280619, qualityProfileId: 4, library: false },
  { tvdbId: 393189, qualityProfileId: 4, library: false },
  { tvdbId: 314614, qualityProfileId: 4, library: false },
];
