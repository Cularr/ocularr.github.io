import { updateEpisodeFile } from '../operations/episodeFiles';
import { deleteEpisodeFile } from '../operations/series';
import { episodeFileResource, episodeResource } from '../resources/episode';
import { broadcast } from '../transport/signalR';
import { arrayBody, idsFrom, numberList, objectBody, Route } from './request';

export const episodeRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/episode$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const seasonNumber = request.query.get('seasonNumber');
      const episodeIds = numberList(request.query, 'episodeIds');
      const episodeFileId = Number(request.query.get('episodeFileId') ?? 0);

      return db.episodes
        .filter(
          (e) =>
            (!seriesId || e.seriesId === seriesId) &&
            (seasonNumber === null ||
              e.seasonNumber === Number(seasonNumber)) &&
            (!episodeIds.length || episodeIds.includes(e.id)) &&
            (!episodeFileId || e.episodeFileId === episodeFileId)
        )
        .map((e) => episodeResource(db, e));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/episode\/monitor$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const ids = idsFrom(body, 'episodeIds');

      return db.episodes
        .filter((e) => ids.includes(e.id))
        .map((e) => {
          e.monitored = !!body.monitored;

          const resource = episodeResource(db, e);

          broadcast('episode', 'updated', resource);

          return resource;
        });
    },
  },
  {
    method: 'GET',
    pattern: /^\/episode\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const episode = db.episodes.find((e) => e.id === Number(id));

      return episode ? episodeResource(db, episode, true, true) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/episode\/(\d+)$/,
    handler: (db, request, [id]) => {
      const episode = db.episodes.find((e) => e.id === Number(id));
      const body = objectBody(request);

      if (!episode) {
        return undefined;
      }

      if (typeof body.monitored === 'boolean') {
        episode.monitored = body.monitored;
      }

      const resource = episodeResource(db, episode);

      broadcast('episode', 'updated', resource);

      return resource;
    },
  },
  {
    method: 'GET',
    pattern: /^\/episodefile$/,
    handler: (db, request) => {
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const ids = numberList(request.query, 'episodeFileIds');

      return db.episodeFiles
        .filter(
          (f) =>
            (!seriesId || f.seriesId === seriesId) &&
            (!ids.length || ids.includes(f.id))
        )
        .map((f) => episodeFileResource(db, f));
    },
  },
  {
    method: 'GET',
    pattern: /^\/episodefile\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const file = db.episodeFiles.find((f) => f.id === Number(id));

      return file ? episodeFileResource(db, file) : undefined;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/episodefile\/bulk$/,
    handler: (db, request) =>
      arrayBody(request).flatMap((body) => {
        const resource = updateEpisodeFile(db, Number(body.id), body);

        return resource ? [resource] : [];
      }),
  },
  {
    method: 'PUT',
    pattern: /^\/episodefile\/(\d+)$/,
    status: 202,
    handler: (db, request, [id]) =>
      updateEpisodeFile(db, Number(id), objectBody(request)),
  },
  {
    method: 'DELETE',
    pattern: /^\/episodefile\/bulk$/,
    handler: (db, request) => {
      idsFrom(objectBody(request), 'episodeFileIds').forEach((id) =>
        deleteEpisodeFile(db, id)
      );

      return {};
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/episodefile\/(\d+)$/,
    handler: (db, _request, [id]) => {
      deleteEpisodeFile(db, Number(id));

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

      return db.episodes
        .filter((e) => {
          const time = Date.parse(e.airDateUtc);

          return (
            (Number.isNaN(start) || time >= start) &&
            (Number.isNaN(end) || time <= end) &&
            (includeUnmonitored || e.monitored)
          );
        })
        .map((e) => episodeResource(db, e, true, true));
    },
  },
  {
    method: 'GET',
    pattern: /^\/calendar\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const episode = db.episodes.find((e) => e.id === Number(id));

      return episode ? episodeResource(db, episode, true, true) : undefined;
    },
  },
];
