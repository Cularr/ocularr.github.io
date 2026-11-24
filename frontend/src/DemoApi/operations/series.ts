import { DemoSeries, DemoWork, JsonObject } from '../DemoTypes';
import { queueStatus } from '../resources/queue';
import { seriesResource } from '../resources/series';
import { workResource } from '../resources/work';
import { ResponseError } from '../responseError';
import { idsFrom } from '../routes/request';
import { searchWorks } from '../simulation/queue';
import { addSeries, readMonitorType } from '../state/catalog';
import {
  applyLayout,
  collectionsOf,
  coveredIds,
  orderingFor,
} from '../state/editions';
import { folderName, seriesPath } from '../state/paths';
import { findSeries, missingWorks } from '../state/queries';
import { DemoDb, nextId } from '../state/store';
import { broadcast } from '../transport/signalR';
import { applyTags } from './tags';

export function setVolumeMonitored(
  db: DemoDb,
  works: DemoWork[],
  workId: unknown,
  monitored: boolean
) {
  const volume = works.find(
    (work) => work.kind === 'volume' && work.id === workId
  );

  if (!volume) {
    return false;
  }

  const members = coveredIds(works, [volume.id]);

  for (const work of works) {
    if (members.has(work.id) && work.monitored !== monitored) {
      work.monitored = monitored;
      broadcast('work', 'updated', workResource(db, work));
    }
  }

  return true;
}

const ORDERINGS = ['hierarchical', 'sequential', 'chronological'];

function applyOrdering(series: DemoSeries, body: JsonObject) {
  if (typeof body.ordering === 'string' && ORDERINGS.includes(body.ordering)) {
    series.metadata.ordering = body.ordering;
  }
}

export function updateSeries(db: DemoDb, series: DemoSeries, body: JsonObject) {
  const collection = collectionsOf(series.metadata).find(
    (c) => c.id === body.selectedCollectionId
  );

  applyOrdering(series, body);

  if (collection && collection.id !== series.metadata.selectedCollectionId) {
    series.metadata.selectedCollectionId = collection.id;
    series.metadata.ordering = orderingFor(collection.kind);
    applyLayout(
      series,
      db.works.filter((e) => e.seriesId === series.id)
    );
  }

  if (typeof body.monitored === 'boolean') {
    series.monitored = body.monitored;
  }

  if (typeof body.qualityProfileId === 'number') {
    series.qualityProfileId = body.qualityProfileId;
  }

  if (typeof body.seriesType === 'string') {
    series.seriesType = body.seriesType;
  }

  if (typeof body.volumeFolder === 'boolean') {
    series.volumeFolder = body.volumeFolder;
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
    series.tags = applyTags(series.tags, idsFrom(body, 'tags'), body.applyTags);
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
  db.works = db.works.filter((e) => e.seriesId !== series.id);
  db.workFiles = db.workFiles.filter((f) => f.seriesId !== series.id);
  db.queue = db.queue.filter((item) => item.release.seriesId !== series.id);
  db.history = db.history.filter((h) => h.seriesId !== series.id);
  db.blocklist = db.blocklist.filter((b) => b.seriesId !== series.id);

  if (addExclusion) {
    db.collections.importlistexclusion.push({
      id: nextId(db),
      foreignSeriesId: series.foreignSeriesId,
      title: series.title,
    });
  }

  broadcast('series', 'deleted', { id: series.id });
  broadcast('queue', 'sync');
  broadcast('queue/status', 'updated', queueStatus(db));
}

export function deleteWorkFile(db: DemoDb, id: number) {
  const file = db.workFiles.find((f) => f.id === id);

  if (!file) {
    return;
  }

  db.workFiles = db.workFiles.filter((f) => f.id !== id);
  broadcast('workfile', 'deleted', { id });

  db.works
    .filter((e) => e.workFileId === id)
    .forEach((work) => {
      work.workFileId = 0;
      broadcast('work', 'updated', workResource(db, work));
    });

  const series = findSeries(db, file.seriesId);

  if (series) {
    broadcast('series', 'updated', seriesResource(db, series));
  }
}

const ADD_SEARCH_LIMIT = 6;

export function addSeriesFromBody(db: DemoDb, body: JsonObject) {
  const addOptions = (body.addOptions ?? {}) as JsonObject;
  const series = addSeries(db, String(body.foreignSeriesId), {
    qualityProfileId: Number(body.qualityProfileId) || undefined,
    monitored: body.monitored !== false,
    monitor: readMonitorType(addOptions.monitor ?? 'all') ?? 'unknown',
    seriesType:
      typeof body.seriesType === 'string' ? body.seriesType : undefined,
    volumeFolder:
      typeof body.volumeFolder === 'boolean' ? body.volumeFolder : undefined,
    monitorNewItems:
      typeof body.monitorNewItems === 'string'
        ? body.monitorNewItems
        : undefined,
    rootFolderPath:
      typeof body.rootFolderPath === 'string' ? body.rootFolderPath : undefined,
    tags: idsFrom(body, 'tags'),
  });

  if (!series) {
    throw new ResponseError(400, [
      {
        propertyName: 'ForeignSeriesId',
        errorMessage: 'This series has already been added',
        severity: 'error',
        isWarning: false,
      },
    ]);
  }

  applyOrdering(series, body);

  const resource = seriesResource(db, series);

  broadcast('series', 'updated', resource);

  if (addOptions.searchForMissingChapters) {
    searchWorks(
      db,
      missingWorks(db, {
        filter: (e) => e.seriesId === series.id,
      }).slice(0, ADD_SEARCH_LIMIT)
    );
  }

  return resource;
}
