import { DemoSeries, JsonObject } from '../DemoTypes';
import { episodeResource } from '../resources/episode';
import { queueStatus } from '../resources/queue';
import { seriesResource } from '../resources/series';
import { ResponseError } from '../responseError';
import { searchEpisodes } from '../simulation/queue';
import { addSeries } from '../state/catalog';
import { folderName, seriesPath } from '../state/paths';
import { findSeries, missingEpisodes } from '../state/queries';
import { DemoDb, nextId } from '../state/store';
import { broadcast } from '../transport/signalR';
import { applyTags } from './tags';

export function setSeasonMonitored(
  db: DemoDb,
  series: DemoSeries,
  seasonNumber: number,
  monitored: boolean
) {
  const wasMonitored = series.seasonMonitored[seasonNumber] ?? true;

  series.seasonMonitored[seasonNumber] = monitored;

  if (wasMonitored !== monitored) {
    db.episodes
      .filter(
        (e) => e.seriesId === series.id && e.seasonNumber === seasonNumber
      )
      .forEach((e) => {
        e.monitored = monitored;
        broadcast('episode', 'updated', episodeResource(db, e));
      });
  }
}

export function updateSeries(db: DemoDb, series: DemoSeries, body: JsonObject) {
  if (typeof body.monitored === 'boolean') {
    series.monitored = body.monitored;
  }

  if (typeof body.qualityProfileId === 'number') {
    series.qualityProfileId = body.qualityProfileId;
  }

  if (typeof body.seriesType === 'string') {
    series.seriesType = body.seriesType;
  }

  if (typeof body.seasonFolder === 'boolean') {
    series.seasonFolder = body.seasonFolder;
  }

  if (typeof body.monitorNewItems === 'string') {
    series.monitorNewItems = body.monitorNewItems;
  }

  if (typeof body.path === 'string' && body.path) {
    series.path = body.path;
  }

  if (typeof body.rootFolderPath === 'string' && body.rootFolderPath) {
    series.path = `${body.rootFolderPath.replace(/\/$/, '')}/${folderName(
      seriesPath(series)
    )}`;
  }

  if (Array.isArray(body.tags)) {
    series.tags = applyTags(
      series.tags,
      (body.tags as number[]).map(Number),
      body.applyTags
    );
  }

  if (Array.isArray(body.seasons)) {
    (body.seasons as { seasonNumber: number; monitored?: boolean }[]).forEach(
      (season) => {
        setSeasonMonitored(
          db,
          series,
          season.seasonNumber,
          season.monitored ?? true
        );
      }
    );
  }

  const resource = seriesResource(db, series);

  broadcast('series', 'updated', resource);

  return resource;
}

export function deleteSeries(
  db: DemoDb,
  series: DemoSeries,
  addExclusion: boolean
) {
  db.series = db.series.filter((s) => s.id !== series.id);
  db.episodes = db.episodes.filter((e) => e.seriesId !== series.id);
  db.episodeFiles = db.episodeFiles.filter((f) => f.seriesId !== series.id);
  db.queue = db.queue.filter((item) => item.release.seriesId !== series.id);
  db.history = db.history.filter((h) => h.seriesId !== series.id);
  db.blocklist = db.blocklist.filter((b) => b.seriesId !== series.id);

  if (addExclusion) {
    db.collections.importlistexclusion.push({
      id: nextId(db),
      tvdbId: series.tvdbId,
      title: series.title,
    });
  }

  broadcast('series', 'deleted', { id: series.id });
  broadcast('queue', 'sync');
  broadcast('queue/status', 'updated', queueStatus(db));
}

export function deleteEpisodeFile(db: DemoDb, id: number) {
  const file = db.episodeFiles.find((f) => f.id === id);

  if (!file) {
    return;
  }

  db.episodeFiles = db.episodeFiles.filter((f) => f.id !== id);
  broadcast('episodefile', 'deleted', { id });

  db.episodes
    .filter((e) => e.episodeFileId === id)
    .forEach((episode) => {
      episode.episodeFileId = 0;
      broadcast('episode', 'updated', episodeResource(db, episode));
    });

  const series = findSeries(db, file.seriesId);

  if (series) {
    broadcast('series', 'updated', seriesResource(db, series));
  }
}

const ADD_SEARCH_LIMIT = 6;

export function addSeriesFromBody(db: DemoDb, body: JsonObject) {
  const addOptions = (body.addOptions ?? {}) as JsonObject;
  const series = addSeries(db, Number(body.tvdbId), {
    qualityProfileId: Number(body.qualityProfileId) || undefined,
    monitored: body.monitored !== false,
    monitor: String(addOptions.monitor ?? 'all'),
    seriesType:
      typeof body.seriesType === 'string' ? body.seriesType : undefined,
    seasonFolder:
      typeof body.seasonFolder === 'boolean' ? body.seasonFolder : undefined,
    monitorNewItems:
      typeof body.monitorNewItems === 'string'
        ? body.monitorNewItems
        : undefined,
    rootFolderPath:
      typeof body.rootFolderPath === 'string' ? body.rootFolderPath : undefined,
    tags: Array.isArray(body.tags) ? (body.tags as number[]) : [],
  });

  if (!series) {
    throw new ResponseError(400, [
      {
        propertyName: 'TvdbId',
        errorMessage: 'This series has already been added',
        severity: 'error',
        isWarning: false,
      },
    ]);
  }

  const resource = seriesResource(db, series);

  broadcast('series', 'updated', resource);

  if (addOptions.searchForMissingEpisodes) {
    searchEpisodes(
      db,
      missingEpisodes(db, {
        filter: (e) => e.seriesId === series.id,
      }).slice(0, ADD_SEARCH_LIMIT)
    );
  }

  return resource;
}
