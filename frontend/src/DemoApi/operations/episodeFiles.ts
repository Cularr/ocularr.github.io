import { JsonObject } from '../DemoTypes';
import { episodeFileResource } from '../resources/episode';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';

export function updateEpisodeFile(db: DemoDb, id: number, body: JsonObject) {
  const file = db.episodeFiles.find((f) => f.id === id);

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

  const resource = episodeFileResource(db, file);

  broadcast('episodefile', 'updated', resource);

  return resource;
}
