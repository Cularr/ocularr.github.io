import { DemoHistory } from '../DemoTypes';
import { blocklistResource, historyResource } from '../resources/activity';
import { queueResource, queueStatus } from '../resources/queue';
import { ResponseError } from '../responseError';
import { removeQueueItem } from '../simulation/queue';
import { nextId } from '../state/store';
import {
  DemoRequest,
  idsFrom,
  numberList,
  objectBody,
  paged,
  Route,
} from './request';

const PROTOCOLS = ['unknown', 'usenet', 'torrent'];

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
  'episodeFileDeleted',
  'episodeFileRenamed',
  'downloadIgnored',
];

function eventTypeFilter(request: DemoRequest) {
  const types = numberList(request.query, 'eventType').map(
    (value) => HISTORY_EVENT_TYPES[value]
  );

  return (history: DemoHistory) =>
    !types.length || types.includes(history.eventType);
}

export const activityRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/queue$/,
    handler: (db, request) => {
      const seriesIds = numberList(request.query, 'seriesIds');
      const protocolParam = request.query.get('protocol');
      const protocol = /^\d+$/.test(protocolParam ?? '')
        ? PROTOCOLS[Number(protocolParam)]
        : protocolParam;

      return paged(
        request,
        db.queue.filter(
          (item) =>
            (!seriesIds.length || seriesIds.includes(item.release.seriesId)) &&
            (!protocol || item.release.protocol === protocol)
        ),
        (item) => queueResource(db, item)
      );
    },
  },
  {
    method: 'GET',
    pattern: /^\/queue\/details$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const episodeIds = numberList(request.query, 'episodeIds');

      return db.queue
        .filter(
          (item) =>
            (!seriesId || item.release.seriesId === seriesId) &&
            (!episodeIds.length ||
              item.release.episodeIds.some((id) => episodeIds.includes(id)))
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

      return paged(
        request,
        db.history.filter(
          (h) =>
            matchesEvent(h) &&
            (!seriesIds.length || seriesIds.includes(h.seriesId))
        ),
        (h) => historyResource(db, h, true, true)
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
    pattern: /^\/history\/(series|season)$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const seasonNumber = request.query.get('seasonNumber');
      const matchesEvent = eventTypeFilter(request);
      const seasons = new Map(
        db.episodes
          .filter((e) => e.seriesId === seriesId)
          .map((e) => [e.id, e.seasonNumber])
      );

      return db.history
        .filter(
          (h) =>
            h.seriesId === seriesId &&
            matchesEvent(h) &&
            (seasonNumber === null ||
              seasons.get(h.episodeId) === Number(seasonNumber))
        )
        .map((h) => historyResource(db, h, false, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/history\/episode$/,
    handler: (db, request) => {
      const episodeId = Number(request.query.get('episodeId') ?? 0);
      const matchesEvent = eventTypeFilter(request);

      return db.history
        .filter((h) => h.episodeId === episodeId && matchesEvent(h))
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
      paged(request, db.blocklist, (item) => blocklistResource(db, item)),
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
