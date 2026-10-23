export type Protocol = 'usenet' | 'torrent';

type SeriesStatus = 'continuing' | 'ended' | 'upcoming';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type JsonObject = { [key: string]: JsonValue | undefined };

export interface QualityInfo {
  id: number;
  name: string;
  source: string;
  resolution: number;
}

interface ShowAiring {
  anchor: number;
  dayOffset: number;
  missing?: number[];
}

interface ShowEpisode {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDateUtc: string;
}

export interface ShowData {
  tvdbId: number;
  title: string;
  overview: string;
  year: number;
  status: 'continuing' | 'ended';
  runtime: number;
  airTime: string;
  network: string;
  genres: string[];
  certification: string;
  rating: number;
  imdbId: string;
  tmdbId: number;
  tvMazeId: number;
  hasPoster: boolean;
  hasFanart: boolean;
  hasBanner: boolean;
  qualityProfileId: number;
  library: boolean;
  airing: ShowAiring | null;
  episodes: ShowEpisode[];
}

export interface ShowsFile {
  generated: string;
  shows: ShowData[];
}

export interface DemoSeries {
  id: number;
  tvdbId: number;
  imdbId: string;
  tmdbId: number;
  tvMazeId: number;
  hasPoster: boolean;
  hasFanart: boolean;
  hasBanner: boolean;
  title: string;
  year: number;
  network: string;
  status: SeriesStatus;
  runtime: number;
  airTime: string;
  qualityProfileId: number;
  genres: string[];
  certification: string;
  rating: number;
  overview: string;
  monitored: boolean;
  seasonMonitored: Record<number, boolean>;
  added: string;
  tags: number[];
  seriesType?: string;
  seasonFolder?: boolean;
  monitorNewItems?: string;
  path?: string;
}

export interface DemoEpisode {
  id: number;
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDateUtc: string;
  monitored: boolean;
  episodeFileId: number;
}

export interface DemoEpisodeFile {
  id: number;
  seriesId: number;
  seasonNumber: number;
  quality: string;
  size: number;
  releaseGroup: string;
  dateAdded: string;
}

export interface DemoRelease {
  guid: string;
  seriesId: number;
  episodeIds: number[];
  title: string;
  protocol: Protocol;
  indexerId: number;
  indexer: string;
  quality: string;
  size: number;
  ageHours: number;
  seeders: number | null;
  leechers: number | null;
  customFormatScore: number;
  releaseGroup: string;
  rejections: string[];
  fullSeason?: boolean;
}

export interface DemoQueueItem {
  id: number;
  release: DemoRelease;
  downloadClient: string;
  added: number;
  duration: number;
  failAt: number | null;
  state: 'downloading' | 'importing' | 'failed';
  stateChanged: number;
}

export interface DemoHistory {
  id: number;
  seriesId: number;
  episodeId: number;
  sourceTitle: string;
  quality: string;
  date: string;
  eventType: string;
  data: JsonObject;
}

export interface DemoBlocklist {
  id: number;
  seriesId: number;
  episodeIds: number[];
  sourceTitle: string;
  quality: string;
  protocol: Protocol;
  indexer: string;
  message: string;
  date: string;
}

export interface DemoCommand {
  id: number;
  name: string;
  body: JsonObject;
  status: 'queued' | 'started' | 'completed';
  queued: string;
  started: string;
  ended: string;
}

export interface ProviderSelectOption {
  value: number;
  name: string;
  order: number;
  hint?: string;
}

export interface ProviderField {
  order: number;
  name: string;
  label: string;
  unit?: string;
  helpText?: string;
  helpTextWarning?: string;
  helpLink?: string;
  value: JsonValue;
  type: string;
  advanced: boolean;
  selectOptions?: ProviderSelectOption[];
  selectOptionsProviderAction?: string;
  section?: string;
  hidden?: string;
  privacy: string;
  placeholder?: string;
  isFloat: boolean;
  labelTokens?: Record<string, string>;
  helpTextTokens?: Record<string, string>;
  helpTextWarningTokens?: Record<string, string>;
}

export interface ProviderDefinition {
  implementation: string;
  implementationName: string;
  implementationNameKey?: string;
  implementationNameTokens?: Record<string, string>;
  configContract: string;
  infoLink: string;
  protocol?: Protocol;
  listType?: string;
  minRefreshInterval?: string;
  link?: string;
  supports?: Record<string, boolean>;
  supportsRss?: boolean;
  supportsSearch?: boolean;
  fields: ProviderField[];
  presets: { name: string; values: Record<string, JsonValue> }[];
}

export type ProvidersFile = Record<string, ProviderDefinition[]>;
