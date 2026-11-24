export type Protocol = 'usenet' | 'torrent';

export type ReleaseType =
  | 'unknown'
  | 'singleChapter'
  | 'multiChapter'
  | 'volumePack'
  | 'multiVolumePack';

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
  tier: string;
}

export interface SeriesWork {
  id: number;
  kind: 'unknown' | 'chapter' | 'volume' | 'magazine' | 'partialChapter';
  countType: 'main' | 'extra';
  number: number;
  numberLabel?: string;
  volumeNumber: number | null;
  absoluteNumber?: number;
  title: string;
  releaseDateUtc: string;
  inEdition: boolean;
  parentWorkIds: number[];
  pageCount?: number;
  isbn?: string;
  overview?: string;
}

export interface SeriesData {
  extraMonitoredCollectionId?: string;
  seriesType: string;
  foreignSeriesId: string;
  metadata: JsonObject;
  title: string;
  overview: string;
  year: number;
  status: 'continuing' | 'ended';
  genres: string[];
  rating: number;
  hasPoster: boolean;
  hasFanart: boolean;
  hasBanner: boolean;
  qualityProfileId: number;
  library: boolean;
  works: SeriesWork[];
}

export interface SeriesFile {
  sourceCredits: JsonObject[];
  series: SeriesData[];
}

export interface DemoSeries {
  id: number;
  foreignSeriesId: string;
  metadata: JsonObject;
  hasPoster: boolean;
  hasFanart: boolean;
  hasBanner: boolean;
  title: string;
  year: number;
  status: SeriesStatus;
  qualityProfileId: number;
  genres: string[];
  rating: number;
  overview: string;
  monitored: boolean;
  added: string;
  tags: number[];
  seriesType?: string;
  volumeFolder?: boolean;
  monitorNewItems?: string;
  path?: string;
}

export interface DemoWork extends SeriesWork {
  seriesId: number;
  monitored: boolean;
  workFileId: number;
}

export interface DemoWorkFile {
  releaseType?: ReleaseType;
  relativePath?: string;
  comicTags?: Record<string, string>;
  id: number;
  seriesId: number;
  volumeNumber: number;
  quality: string;
  size: number;
  releaseGroup: string;
  dateAdded: string;
}

export interface DemoRelease {
  releaseType?: ReleaseType;
  guid: string;
  seriesId: number;
  workIds: number[];
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
  fullVolume?: boolean;
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
  workId: number;
  sourceTitle: string;
  quality: string;
  date: string;
  eventType: string;
  data: JsonObject;
}

export interface DemoBlocklist {
  id: number;
  seriesId: number;
  workIds: number[];
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
