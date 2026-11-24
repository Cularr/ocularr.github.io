import { ENGLISH } from '../constants';
import { JsonObject } from '../DemoTypes';
import {
  addSeriesFromBody,
  deleteSeries,
  setVolumeMonitored,
  updateSeries,
} from '../operations/series';
import { lookupResource, seriesResource } from '../resources/series';
import {
  applyMonitor,
  catalogSeries,
  readMonitorType,
  toDemoSeries,
} from '../state/catalog';
import { folderName, seriesPath } from '../state/paths';
import { findSeries } from '../state/queries';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import { arrayBody, idsFrom, objectBody, Route } from './request';

function lookup(db: DemoDb, term: string) {
  const normalized = term.trim().toLowerCase();

  return catalogSeries()
    .filter(
      (seriesData) =>
        seriesData.foreignSeriesId === normalized ||
        seriesData.title.toLowerCase().includes(normalized) ||
        (seriesData.metadata.externalLinks as JsonObject[]).some(
          (link) =>
            link.name === 'Grand Comics Database' &&
            normalized === `gcd:${link.externalId}`
        )
    )
    .map((seriesData) => {
      const existing = db.series.find(
        (s) => s.foreignSeriesId === seriesData.foreignSeriesId
      );

      if (existing) {
        return seriesResource(db, existing);
      }

      return {
        ...lookupResource(toDemoSeries(seriesData, 0)),
        isExcluded: db.collections.importlistexclusion.some(
          (exclusion) =>
            exclusion.foreignSeriesId === seriesData.foreignSeriesId
        ),
      };
    });
}

export const seriesRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/series$/,
    handler: (db, request) => {
      const foreignSeriesId = request.query.get('foreignSeriesId');

      return db.series
        .filter(
          (s) => !foreignSeriesId || s.foreignSeriesId === foreignSeriesId
        )
        .map((s) => seriesResource(db, s));
    },
  },
  {
    method: 'POST',
    pattern: /^\/series$/,
    status: 201,
    handler: (db, request) => addSeriesFromBody(db, objectBody(request)),
  },
  {
    method: 'POST',
    pattern: /^\/series\/import$/,
    handler: (db, request) =>
      arrayBody(request).map((body) => addSeriesFromBody(db, body)),
  },
  {
    method: 'GET',
    pattern: /^\/series\/lookup$/,
    handler: (db, request) => lookup(db, request.query.get('term') ?? ''),
  },
  {
    method: 'PUT',
    pattern: /^\/series\/editor$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const ids = idsFrom(body, 'seriesIds');

      return db.series
        .filter((s) => ids.includes(s.id))
        .map((s) => updateSeries(db, s, body));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/series\/editor$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const ids = idsFrom(body, 'seriesIds');

      db.series
        .filter((s) => ids.includes(s.id))
        .forEach((s) => deleteSeries(db, s, !!body.addImportListExclusion));

      return {};
    },
  },
  {
    method: 'GET',
    pattern: /^\/series\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const series = findSeries(db, Number(id));

      return series ? seriesResource(db, series) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/series(?:\/(\d+))?$/,
    status: 202,
    handler: (db, request, [id]) => {
      const series = findSeries(db, id ?? Number(objectBody(request).id));

      return series ? updateSeries(db, series, objectBody(request)) : undefined;
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/series\/(\d+)$/,
    handler: (db, request, [id]) => {
      const series = findSeries(db, Number(id));

      if (!series) {
        return undefined;
      }

      deleteSeries(
        db,
        series,
        request.query.get('addImportListExclusion') === 'true'
      );

      return {};
    },
  },
  {
    method: 'PUT',
    pattern: /^\/series\/(\d+)\/volume$/,
    handler: (db, request, [id]) => {
      const series = findSeries(db, Number(id));
      const body = objectBody(request);

      if (!series) {
        return undefined;
      }

      const works = db.works.filter((e) => e.seriesId === series.id);

      if (
        !setVolumeMonitored(db, works, body.workId, body.monitored !== false)
      ) {
        return undefined;
      }

      broadcast('series', 'updated', seriesResource(db, series));

      return body;
    },
  },
  {
    method: 'GET',
    pattern: /^\/series\/(\d+)\/folder$/,
    handler: (db, _request, [id]) => {
      const series = findSeries(db, Number(id));

      return series
        ? {
            folder: folderName(seriesPath(series)),
            language: ENGLISH,
          }
        : undefined;
    },
  },
  {
    method: 'POST',
    pattern: /^\/volumepass$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const monitor = readMonitorType(
        ((body.monitoringOptions ?? {}) as JsonObject).monitor ?? ''
      );

      ((body.series ?? []) as JsonObject[]).forEach((item) => {
        const series = findSeries(db, Number(item.id));

        if (!series) {
          return;
        }

        if (typeof item.monitored === 'boolean') {
          series.monitored = item.monitored;
        }

        if (Array.isArray(item.volumes)) {
          const works = db.works.filter((work) => work.seriesId === series.id);

          for (const volume of item.volumes) {
            if (
              volume &&
              typeof volume === 'object' &&
              !Array.isArray(volume)
            ) {
              setVolumeMonitored(
                db,
                works,
                volume.workId,
                volume.monitored === true
              );
            }
          }
        }

        if (monitor === 'none') {
          series.monitored = false;
        }

        if (monitor) {
          applyMonitor(db, series, monitor);
        }

        broadcast('series', 'updated', seriesResource(db, series));
      });

      return {};
    },
  },
];
