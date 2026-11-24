import { JsonObject } from '../DemoTypes';
import { workFileResource } from '../resources/work';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';

export function updateWorkFile(db: DemoDb, id: number, body: JsonObject) {
  const file = db.workFiles.find((f) => f.id === id);

  if (!file) {
    return undefined;
  }

  const quality = (body.quality as { quality?: { name?: string } } | undefined)
    ?.quality?.name;

  if (quality) {
    file.quality = quality;
  }

  if (typeof body.releaseGroup === 'string') {
    file.releaseGroup = body.releaseGroup;
  }

  const resource = workFileResource(db, file);

  broadcast('workfile', 'updated', resource);

  return resource;
}
