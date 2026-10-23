import { ENGLISH } from '../constants';
import { JsonObject } from '../DemoTypes';
import {
  addSeriesFromBody,
  deleteSeries,
  setSeasonMonitored,
  updateSeries,
} from '../operations/series';
import { lookupResource, seriesResource } from '../resources/series';
import { applyMonitor, catalogShows, toDemoSeries } from '../state/catalog';
import { folderName, seriesPath } from '../state/paths';
import { findSeries } from '../state/queries';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import { arrayBody, idsFrom, objectBody, Route } from './request';

function lookup(db: DemoDb, term: string) {
  const normalized = term.trim().toLowerCase();
  const tvdbMatch = /^tvdb:\s*(\d+)$/.exec(normalized);

  return catalogShows()
    .filter((show) =>
      tvdbMatch
        ? show.tvdbId === Number(tvdbMatch[1])
        : !normalized || show.title.toLowerCase().includes(normalized)
    )
    .map((show) => {
      const existing = db.series.find((s) => s.tvdbId === show.tvdbId);

      if (existing) {
        return seriesResource(db, existing);
      }

      return {
        ...lookupResource(
          toDemoSeries(show, 0),
          Array.from(new Set(show.episodes.map((e) => e.seasonNumber))).sort(
            (a, b) => a - b
          )
        ),
        isExcluded: db.collections.importlistexclusion.some(
          (exclusion) => exclusion.tvdbId === show.tvdbId
        ),
      };
    });
}

export const seriesRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/series$/,
    handler: (db, request) => {
      const tvdbId = Number(request.query.get('tvdbId') ?? 0);

      return db.series
        .filter((s) => !tvdbId || s.tvdbId === tvdbId)
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
      const series = findSeries(db, id);

      return series ? seriesResource(db, series) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/series\/(\d+)$/,
    status: 202,
    handler: (db, request, [id]) => {
      const series = findSeries(db, id);

      return series ? updateSeries(db, series, objectBody(request)) : undefined;
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/series\/(\d+)$/,
    handler: (db, request, [id]) => {
      const series = findSeries(db, id);

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
    pattern: /^\/series\/(\d+)\/season$/,
    handler: (db, request, [id]) => {
      const series = findSeries(db, id);
      const body = objectBody(request);

      if (!series) {
        return undefined;
      }

      setSeasonMonitored(
        db,
        series,
        Number(body.seasonNumber),
        body.monitored !== false
      );
      broadcast('series', 'updated', seriesResource(db, series));

      return body;
    },
  },
  {
    method: 'GET',
    pattern: /^\/series\/(\d+)\/folder$/,
    handler: (db, _request, [id]) => {
      const series = findSeries(db, id);

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
    pattern: /^\/seasonpass$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const monitor = String(
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

        if (monitor && monitor !== 'skip') {
          applyMonitor(db, series, monitor);
          broadcast('series', 'updated', seriesResource(db, series));
        } else {
          updateSeries(db, series, {
            seasons: Array.isArray(item.seasons) ? item.seasons : [],
          });
        }
      });

      return {};
    },
  },
];
