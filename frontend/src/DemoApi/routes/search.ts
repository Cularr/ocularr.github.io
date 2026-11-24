import { DemoWork } from '../DemoTypes';
import { qualityWeight } from '../qualities/model';
import { releaseResource } from '../resources/activity';
import { commandResource } from '../resources/system';
import { workResource } from '../resources/work';
import { ResponseError } from '../responseError';
import { executeCommand } from '../simulation/commands';
import { enqueue } from '../simulation/queue';
import {
  findRelease,
  releasesForVolume,
  releasesForWork,
} from '../simulation/releases';
import {
  cutoffUnmetWorks,
  enumFilter,
  filterIds,
  findSeries,
  matchesSeriesTags,
  missingWorks,
} from '../state/queries';
import { DemoDb } from '../state/store';
import {
  notAvailable,
  numberList,
  objectBody,
  paged,
  Route,
  seriesSortTitle,
} from './request';

const SERIES_TYPES = {
  0: 'unknown',
  1: 'manga',
  2: 'manhwa',
  3: 'manhua',
  4: 'comic',
  5: 'doujinshi',
  6: 'oneshot',
  7: 'magazine',
  99: 'novel',
};

const ORDERINGS = ['hierarchical', 'chronological', 'sequential'];
const WORK_KINDS = [
  'unknown',
  'chapter',
  'volume',
  'magazine',
  'partialchapter',
];

export function wantedWorks(
  db: DemoDb,
  kind: 'missing' | 'cutoff',
  query: URLSearchParams,
  { id, includeQueued }: { id?: string; includeQueued: boolean }
) {
  const monitored = query.get('monitored') !== 'false';
  const seriesIds = numberList(query, 'seriesIds');
  const profileIds = numberList(query, 'qualityProfileIds');
  const tags = numberList(query, 'seriesTags');
  const matchesType = enumFilter(query, 'seriesType', SERIES_TYPES);
  const matchesOrdering = enumFilter(query, 'ordering', ORDERINGS);
  const matchesKind = enumFilter(query, 'kind', WORK_KINDS);

  const filter = (work: DemoWork) => {
    if (id) {
      return work.id === Number(id);
    }

    const series = findSeries(db, work.seriesId);

    return (
      !!series &&
      (!seriesIds.length || seriesIds.includes(series.id)) &&
      (!profileIds.length || profileIds.includes(series.qualityProfileId)) &&
      matchesType(series.seriesType ?? 'manga') &&
      matchesOrdering(String(series.metadata.ordering ?? '')) &&
      matchesKind(work.kind) &&
      matchesSeriesTags(series, tags)
    );
  };

  const options = { monitored, includeQueued, filter };

  return kind === 'cutoff'
    ? cutoffUnmetWorks(db, {
        ...options,
        qualityIds: id ? [] : filterIds(query, 'quality'),
      })
    : missingWorks(db, {
        ...options,
        includeSpecials: !!id || query.get('includeSpecials') !== 'false',
      });
}

function wantedRoute(kind: 'missing' | 'cutoff'): Route {
  const cutoff = kind === 'cutoff';

  return {
    method: 'GET',
    pattern: new RegExp(`^/wanted/${kind}(?:/(\\d+))?$`),
    handler: (db, request, [id]) => {
      const records = wantedWorks(db, kind, request.query, {
        id,
        includeQueued: true,
      });
      const map = (work: DemoWork) => workResource(db, work, true, cutoff);

      if (id) {
        return records[0] ? map(records[0]) : undefined;
      }

      return paged(
        request,
        records,
        map,
        {
          'works.releaseDateUtc': (work) => work.releaseDateUtc,
          'works.lastSearchTime': (work) =>
            'lastSearchTime' in work && typeof work.lastSearchTime === 'string'
              ? Date.parse(work.lastSearchTime)
              : 0,
          'series.sortTitle': (work) => seriesSortTitle(db, work.seriesId),
          ...(cutoff && {
            quality: (work: DemoWork) =>
              qualityWeight(
                db.workFiles.find((file) => file.id === work.workFileId)
                  ?.quality ?? ''
              ),
          }),
        },
        'works.releaseDateUtc',
        'ascending'
      );
    },
  };
}

export const searchRoutes: Route[] = [
  wantedRoute('missing'),
  wantedRoute('cutoff'),
  {
    method: 'GET',
    pattern: /^\/release$/,
    handler: (db, request) => {
      const workId = Number(request.query.get('workId') ?? 0);
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const volumeNumber = request.query.get('volumeNumber');
      const volumeWorkId = request.query.get('volumeWorkId');
      const work = db.works.find(
        (e) => e.id === workId && (!seriesId || e.seriesId === seriesId)
      );
      const workReleases = work ? releasesForWork(db, work) : [];
      const releases = workId
        ? workReleases
        : releasesForVolume(
            db,
            seriesId,
            volumeNumber === null ? undefined : Number(volumeNumber),
            volumeWorkId === null ? undefined : Number(volumeWorkId)
          );

      return releases.map((release) => releaseResource(db, release));
    },
  },
  {
    method: 'POST',
    pattern: /^\/release$/,
    handler: (db, request) => {
      const body = objectBody(request);

      if (body.override) {
        notAvailable('Overriding a release match is not available in the demo');
      }

      const release = findRelease(db, String(body.guid ?? ''));

      if (!release) {
        throw new ResponseError(404, {
          message:
            "Couldn't find requested release in cache, try searching again",
          description: '',
        });
      }

      enqueue(db, { ...release, rejections: [] });

      return body;
    },
  },
  {
    method: 'POST',
    pattern: /^\/release\/push(?:\/\d+)?$/,
    handler: () =>
      notAvailable('Pushing releases is not available in the demo'),
  },
  {
    method: 'GET',
    pattern: /^\/command$/,
    handler: (db) => db.commands.map(commandResource),
  },
  {
    method: 'GET',
    pattern: /^\/command\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const command = db.commands.find((c) => c.id === Number(id));

      return command ? commandResource(command) : undefined;
    },
  },
  {
    method: 'POST',
    pattern: /^\/command$/,
    status: 201,
    handler: (db, request) => executeCommand(db, objectBody(request)),
  },
  {
    method: 'DELETE',
    pattern: /^\/command\/(\d+)$/,
    handler: (db, _request, [id]) => {
      db.commands = db.commands.filter((c) => c.id !== Number(id));

      return {};
    },
  },
];
