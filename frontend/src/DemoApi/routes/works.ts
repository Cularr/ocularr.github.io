import { filePreviews } from '../operations/filePreviews';
import { deleteWorkFile } from '../operations/series';
import { updateWorkFile } from '../operations/workFiles';
import { workFileResource, workResource } from '../resources/work';
import { coveredIds } from '../state/editions';
import {
  filterValues,
  findSeries,
  isMonitored,
  matchesSeriesTags,
} from '../state/queries';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import { arrayBody, idsFrom, numberList, objectBody, Route } from './request';

const BOUND_KINDS = new Set(['volume', 'chapter', 'magazine']);

function setMonitored(
  db: DemoDb,
  ids: number[],
  monitored: boolean,
  includeBoundWorks: boolean,
  seriesId?: number
) {
  const targets = db.works.filter(
    (e) =>
      ids.includes(e.id) && (seriesId === undefined || e.seriesId === seriesId)
  );

  new Set(targets.map((e) => e.seriesId)).forEach((targetSeriesId) => {
    const seriesWorks = db.works.filter((e) => e.seriesId === targetSeriesId);
    const selected = targets.filter((e) => e.seriesId === targetSeriesId);
    const affected = new Set(selected.map((e) => e.id));

    if (includeBoundWorks) {
      const roots = selected
        .filter((e) => BOUND_KINDS.has(e.kind))
        .map((e) => e.id);

      coveredIds(seriesWorks, roots).forEach((id) => affected.add(id));
    }

    seriesWorks
      .filter((e) => affected.has(e.id))
      .forEach((e) => {
        e.monitored = monitored;
        broadcast('work', 'updated', workResource(db, e));
      });
  });

  return targets;
}

export const workRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/(rename|retag)(\/bulk)?$/,
    handler: (db, request, [action = '', bulk]) =>
      filePreviews(
        db,
        action,
        bulk
          ? numberList(request.query, 'seriesIds')
          : [Number(request.query.get('seriesId'))],
        request.query
      ),
  },
  {
    method: 'GET',
    pattern: /^\/work$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const volumeNumber = request.query.get('volumeNumber');
      const workIds = numberList(request.query, 'workIds');
      const workFileId = Number(request.query.get('workFileId') ?? 0);

      return db.works
        .filter(
          (e) =>
            (!seriesId || e.seriesId === seriesId) &&
            (volumeNumber === null ||
              e.volumeNumber === Number(volumeNumber)) &&
            (!workIds.length || workIds.includes(e.id)) &&
            (!workFileId || e.workFileId === workFileId)
        )
        .map((e) => workResource(db, e));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/work\/monitor$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const ids = idsFrom(body, 'workIds');

      const seriesId =
        typeof body.seriesId === 'number' ? body.seriesId : undefined;
      const targets = setMonitored(
        db,
        ids,
        !!body.monitored,
        body.includeBoundWorks !== false,
        seriesId
      );

      return targets.map((e) => workResource(db, e));
    },
  },
  {
    method: 'GET',
    pattern: /^\/work\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const work = db.works.find((e) => e.id === Number(id));

      return work ? workResource(db, work, true, true) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/work\/(\d+)$/,
    handler: (db, request, [id]) => {
      const body = objectBody(request);
      const seriesId =
        typeof body.seriesId === 'number' && body.seriesId > 0
          ? body.seriesId
          : undefined;
      const work = db.works.find(
        (e) =>
          e.id === Number(id) &&
          (seriesId === undefined || e.seriesId === seriesId)
      );

      if (!work) {
        return undefined;
      }

      if (typeof body.monitored === 'boolean') {
        setMonitored(db, [work.id], body.monitored, true, work.seriesId);
      }

      return workResource(db, work);
    },
  },
  {
    method: 'GET',
    pattern: /^\/workfile$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const ids = numberList(request.query, 'workFileIds');

      return db.workFiles
        .filter(
          (f) =>
            (!seriesId || f.seriesId === seriesId) &&
            (!ids.length || ids.includes(f.id))
        )
        .map((f) => workFileResource(db, f));
    },
  },
  {
    method: 'GET',
    pattern: /^\/workfile\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const file = db.workFiles.find((f) => f.id === Number(id));

      return file ? workFileResource(db, file) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/workfile\/bulk$/,
    handler: (db, request) =>
      arrayBody(request).flatMap((body) => {
        const resource = updateWorkFile(db, Number(body.id), body);

        return resource ? [resource] : [];
      }),
  },
  {
    method: 'PUT',
    pattern: /^\/workfile\/(\d+)$/,
    status: 202,
    handler: (db, request, [id]) =>
      updateWorkFile(db, Number(id), objectBody(request)),
  },
  {
    method: 'DELETE',
    pattern: /^\/workfile\/bulk$/,
    handler: (db, request) => {
      idsFrom(objectBody(request), 'workFileIds').forEach((id) =>
        deleteWorkFile(db, id)
      );

      return {};
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/workfile\/(\d+)$/,
    handler: (db, _request, [id]) => {
      deleteWorkFile(db, Number(id));

      return {};
    },
  },
  {
    method: 'GET',
    pattern: /^\/calendar$/,
    handler: (db, request) => {
      const start = Date.parse(request.query.get('start') ?? '');
      const end = Date.parse(request.query.get('end') ?? '');
      const includeUnmonitored =
        request.query.get('includeUnmonitored') === 'true';
      const includeSpecials = request.query.get('includeSpecials') !== 'false';
      const tags = filterValues(request.query, 'tags').map((tag) =>
        /^\d+$/.test(tag)
          ? Number(tag)
          : Number(db.collections.tag.find((item) => item.label === tag)?.id)
      );

      return db.works
        .filter((e) => {
          const time = Date.parse(e.releaseDateUtc);

          return (
            e.inEdition &&
            (includeSpecials || e.countType !== 'extra') &&
            !Number.isNaN(time) &&
            (Number.isNaN(start) || time >= start) &&
            (Number.isNaN(end) || time <= end) &&
            (includeUnmonitored || isMonitored(db, e)) &&
            matchesSeriesTags(findSeries(db, e.seriesId), tags)
          );
        })
        .map((e) => workResource(db, e, true, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/calendar\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const work = db.works.find((e) => e.id === Number(id));

      return work ? workResource(db, work, true, true) : undefined;
    },
  },
];
