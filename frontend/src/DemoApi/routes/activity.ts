import { ENGLISH } from '../constants';
import { DemoHistory, DemoQueueItem } from '../DemoTypes';
import { getQuality, qualityWeight } from '../qualities/model';
import { blocklistResource, historyResource } from '../resources/activity';
import { queueProgress, queueResource, queueStatus } from '../resources/queue';
import { ResponseError } from '../responseError';
import { removeQueueItem } from '../simulation/queue';
import { volumeWorks } from '../simulation/releases';
import { enumFilter, filterIds } from '../state/queries';
import { nextId } from '../state/store';
import {
  DemoRequest,
  idsFrom,
  numberList,
  objectBody,
  paged,
  Route,
  seriesSortTitle,
} from './request';

const QUEUE_STATUSES = {
  downloading: 'downloading',
  importing: 'completed',
  failed: 'failed',
};

const PROTOCOLS = ['unknown', 'usenet', 'torrent'];

const QUEUE_STATUS_NAMES = [
  'unknown',
  'queued',
  'paused',
  'downloading',
  'completed',
  'failed',
  'warning',
  'delay',
  'downloadclientunavailable',
  'fallback',
];

const REMOVAL_METHODS = ['removeFromClient', 'changeCategory', 'ignore'];

const BLOCKLIST_METHODS = [
  'doNotBlocklist',
  'blocklistAndSearch',
  'blocklistOnly',
];

function badRequest(message: string): never {
  throw new ResponseError(400, { message, description: '' });
}

function removalOptions(request: DemoRequest) {
  const removalMethod = request.query.get('removalMethod') ?? '';
  const blocklistMethod = request.query.get('blocklistMethod') ?? '';

  if (!REMOVAL_METHODS.includes(removalMethod)) {
    badRequest('removalMethod must be provided');
  }

  if (!BLOCKLIST_METHODS.includes(blocklistMethod)) {
    badRequest('blocklistMethod must be provided');
  }

  if (removalMethod === 'changeCategory') {
    badRequest('The download client does not support category changing.');
  }

  return {
    blocklist: blocklistMethod !== 'doNotBlocklist',
    skipRedownload: blocklistMethod === 'blocklistOnly',
  };
}

const HISTORY_EVENT_TYPES = [
  'unknown',
  'grabbed',
  'seriesFolderImported',
  'downloadFolderImported',
  'downloadFailed',
  'workFileDeleted',
  'workFileRenamed',
  'downloadIgnored',
  'workFileRetagged',
];

function eventTypeFilter(request: DemoRequest) {
  const types = request.query
    .getAll('eventType')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) =>
      /^\d+$/.test(value)
        ? HISTORY_EVENT_TYPES[Number(value)]?.toLowerCase()
        : value
    );

  return (history: DemoHistory) =>
    !types.length || types.includes(history.eventType.toLowerCase());
}

function mediaFilter({ query }: DemoRequest) {
  const languages = filterIds(query, 'languages');
  const qualities = filterIds(query, 'quality');
  const matchesLanguage = !languages.length || languages.includes(ENGLISH.id);

  return (quality: string) =>
    matchesLanguage &&
    (!qualities.length || qualities.includes(getQuality(quality).id));
}

export const activityRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/queue$/,
    handler: (db, request) => {
      const seriesIds = numberList(request.query, 'seriesIds');
      const protocolParam = request.query.get('protocol');
      const matchesMedia = mediaFilter(request);
      const matchesStatus = enumFilter(
        request.query,
        'status',
        QUEUE_STATUS_NAMES
      );
      const protocol = /^\d+$/.test(protocolParam ?? '')
        ? PROTOCOLS[Number(protocolParam)]
        : protocolParam;

      const firstWork = (item: DemoQueueItem) =>
        db.works.find((work) => work.id === item.release.workIds[0]);
      const workDate = (item: DemoQueueItem) => firstWork(item)?.releaseDateUtc;
      const workTitle = (item: DemoQueueItem) => firstWork(item)?.title;
      const now = Date.now();
      const timeLeft = (item: DemoQueueItem) =>
        Math.max(0, item.duration * (1 - queueProgress(item, now)));

      return paged(
        request,
        db.queue.filter(
          (item) =>
            (!seriesIds.length || seriesIds.includes(item.release.seriesId)) &&
            (!protocol || item.release.protocol === protocol) &&
            matchesMedia(item.release.quality) &&
            matchesStatus(QUEUE_STATUSES[item.state])
        ),
        (item) => queueResource(db, item),
        {
          added: (item) => item.added,
          downloadClient: (item) => item.downloadClient,
          work: (item) => {
            const work = firstWork(item);

            return (work?.volumeNumber ?? 0) * 1e6 + (work?.number ?? 0);
          },
          'work.releaseDateUtc': workDate,
          'work.title': workTitle,
          'works.releaseDateUtc': workDate,
          'works.title': workTitle,
          estimatedCompletionTime: timeLeft,
          indexer: (item) => item.release.indexer,
          language: () => 'English',
          languages: () => 'English',
          progress: (item) => queueProgress(item, now),
          protocol: (item) => PROTOCOLS.indexOf(item.release.protocol),
          quality: (item) => qualityWeight(item.release.quality),
          'series.sortTitle': (item) =>
            seriesSortTitle(db, item.release.seriesId) ?? item.release.title,
          size: (item) => item.release.size,
          status: (item) => QUEUE_STATUSES[item.state],
          timeleft: timeLeft,
          title: (item) => item.release.title,
        },
        'timeleft',
        'ascending'
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/queue\/details$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const workIds = numberList(request.query, 'workIds');

      return db.queue
        .filter(
          (item) =>
            (!seriesId || item.release.seriesId === seriesId) &&
            (!workIds.length ||
              item.release.workIds.some((id) => workIds.includes(id)))
        )
        .map((item) => queueResource(db, item, false, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/queue\/status$/,
    handler: (db) => queueStatus(db),
  },
  {
    method: 'DELETE',
    pattern: /^\/queue\/(bulk|\d+)$/,
    handler: (db, request, [target]) => {
      const ids =
        target === 'bulk' ? idsFrom(objectBody(request)) : [Number(target)];
      const options = removalOptions(request);

      ids.forEach((id) => removeQueueItem(db, id, options));

      return {};
    },
  },
  {
    method: 'POST',
    pattern: /^\/queue\/grab\/(bulk|\d+)$/,
    handler: () => ({}),
  },
  {
    method: 'GET',
    pattern: /^\/history$/,
    handler: (db, request) => {
      const matchesEvent = eventTypeFilter(request);
      const seriesIds = numberList(request.query, 'seriesIds');
      const matchesMedia = mediaFilter(request);

      return paged(
        request,
        db.history.filter(
          (h) =>
            matchesEvent(h) &&
            matchesMedia(h.quality) &&
            (!seriesIds.length || seriesIds.includes(h.seriesId))
        ),
        (h) => historyResource(db, h, true, true),
        {
          date: (item) => item.date,
          'series.sortTitle': (item) => seriesSortTitle(db, item.seriesId),
          quality: (item) => qualityWeight(item.quality),
        },
        'date'
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/history\/since$/,
    handler: (db, request) => {
      const date = Date.parse(request.query.get('date') ?? '');
      const matchesEvent = eventTypeFilter(request);

      return db.history
        .filter(
          (h) =>
            matchesEvent(h) &&
            (Number.isNaN(date) || Date.parse(h.date) >= date)
        )
        .map((h) => historyResource(db, h, true, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/history\/(series|volume)$/,
    handler: (db, request, [target]) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const volumeWorkId = request.query.get('volumeWorkId');
      const volumeNumber = request.query.get('volumeNumber');
      const matchesEvent = eventTypeFilter(request);
      const members = new Set(
        target === 'volume' && (volumeWorkId !== null || volumeNumber !== null)
          ? volumeWorks(
              db,
              seriesId,
              volumeNumber === null ? undefined : Number(volumeNumber),
              volumeWorkId === null ? undefined : Number(volumeWorkId)
            )
              .filter(
                (work) =>
                  volumeWorkId !== null ||
                  (work.kind === 'magazine' && work.inEdition)
              )
              .map((work) => work.id)
          : []
      );

      return db.history
        .filter(
          (h) =>
            h.seriesId === seriesId &&
            matchesEvent(h) &&
            (target === 'series' || members.has(h.workId))
        )
        .map((h) => historyResource(db, h, false, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/history\/work$/,
    handler: (db, request) => {
      const workId = Number(request.query.get('workId') ?? 0);
      const matchesEvent = eventTypeFilter(request);

      return db.history
        .filter((h) => h.workId === workId && matchesEvent(h))
        .map((h) => historyResource(db, h, false, false));
    },
  },
  {
    method: 'POST',
    pattern: /^\/history\/failed\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const history = db.history.find((h) => h.id === Number(id));

      if (!history) {
        return undefined;
      }

      db.history.unshift({
        ...history,
        id: nextId(db),
        date: new Date().toISOString(),
        eventType: 'downloadFailed',
        data: { message: 'Manually marked as failed' },
      });

      return {};
    },
  },
  {
    method: 'GET',
    pattern: /^\/blocklist$/,
    handler: (db, request) =>
      paged(
        request,
        db.blocklist,
        (item) => blocklistResource(db, item),
        {
          date: (item) => item.date,
          indexer: (item) => item.indexer,
          quality: (item) => qualityWeight(item.quality),
          'series.sortTitle': (item) => seriesSortTitle(db, item.seriesId),
          sourceTitle: (item) => item.sourceTitle,
        },
        'date'
      ),
  },
  {
    method: 'DELETE',
    pattern: /^\/blocklist\/(bulk|\d+)$/,
    handler: (db, request, [target]) => {
      const ids =
        target === 'bulk' ? idsFrom(objectBody(request)) : [Number(target)];

      db.blocklist = db.blocklist.filter((item) => !ids.includes(item.id));

      return {};
    },
  },
];
