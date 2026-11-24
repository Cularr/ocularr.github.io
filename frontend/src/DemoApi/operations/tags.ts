import { JsonObject } from '../DemoTypes';
import { seriesResource } from '../resources/series';
import { idsFrom } from '../routes/request';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';

export function applyTags(current: number[], tags: number[], mode: unknown) {
  if (mode === 'add') {
    return Array.from(new Set([...current, ...tags]));
  }

  if (mode === 'remove') {
    return current.filter((tag) => !tags.includes(tag));
  }

  return tags;
}

export function tagDetails(db: DemoDb, tag: JsonObject) {
  const withTag = (items: JsonObject[], key = 'tags') =>
    items
      .filter((item) => idsFrom(item, key).includes(Number(tag.id)))
      .map((item) => Number(item.id));

  return {
    id: tag.id,
    label: tag.label,
    rootFolderIds: withTag(db.collections.rootfolder, 'defaultTags'),
    delayProfileIds: withTag(db.collections.delayprofile),
    importListIds: withTag(db.collections.importlist),
    notificationIds: withTag(db.collections.connection),
    restrictionIds: withTag(db.collections.releaseprofile),
    excludedReleaseProfileIds: withTag(
      db.collections.releaseprofile,
      'excludedTags'
    ),
    indexerIds: withTag(db.collections.indexer),
    downloadClientIds: withTag(db.collections.downloadclient),
    autoTagIds: withTag(db.collections.autotagging),
    seriesIds: db.series
      .filter((s) => s.tags.includes(Number(tag.id)))
      .map((s) => s.id),
  };
}

export function removeTag(db: DemoDb, id: number) {
  db.series
    .filter((series) => series.tags.includes(id))
    .forEach((series) => {
      series.tags = series.tags.filter((tag) => tag !== id);
      broadcast('series', 'updated', seriesResource(db, series));
    });

  Object.values(db.collections).forEach((items) => {
    items.forEach((item) => {
      ['tags', 'excludedTags', 'defaultTags'].forEach((key) => {
        if (Array.isArray(item[key])) {
          item[key] = idsFrom(item, key).filter((tag) => tag !== id);
        }
      });
    });
  });
}
