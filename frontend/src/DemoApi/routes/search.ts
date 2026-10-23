import { DemoEpisode } from '../DemoTypes';
import { releaseResource } from '../resources/activity';
import { episodeResource } from '../resources/episode';
import { commandResource } from '../resources/system';
import { executeCommand } from '../simulation/commands';
import { enqueue } from '../simulation/queue';
import {
  findRelease,
  releasesForEpisode,
  releasesForSeason,
} from '../simulation/releases';
import { cutoffUnmetEpisodes, missingEpisodes } from '../state/queries';
import { notAvailable, objectBody, paged, Route } from './request';

export const searchRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/wanted\/missing(?:\/(\d+))?$/,
    handler: (db, request, [id]) => {
      const records = missingEpisodes(db, {
        monitored: request.query.get('monitored') !== 'false',
        includeQueued: true,
        filter: (e) => !id || e.id === Number(id),
      });
      const map = (e: DemoEpisode) => episodeResource(db, e, true);

      return id ? records.map(map)[0] : paged(request, records, map);
    },
  },
  {
    method: 'GET',
    pattern: /^\/wanted\/cutoff(?:\/(\d+))?$/,
    handler: (db, request, [id]) => {
      const records = cutoffUnmetEpisodes(db, {
        includeQueued: true,
        filter: (e) => !id || e.id === Number(id),
      });
      const map = (e: DemoEpisode) => episodeResource(db, e, true, true);

      return id ? records.map(map)[0] : paged(request, records, map);
    },
  },
  {
    method: 'GET',
    pattern: /^\/release$/,
    handler: (db, request) => {
      const episodeId = Number(request.query.get('episodeId') ?? 0);
      const seriesId = Number(request.query.get('seriesId') ?? 0);
      const seasonNumber = Number(request.query.get('seasonNumber') ?? -1);
      const episode = db.episodes.find((e) => e.id === episodeId);
      const episodeReleases = episode ? releasesForEpisode(db, episode) : [];
      const releases = episodeId
        ? episodeReleases
        : releasesForSeason(db, seriesId, seasonNumber);

      return releases.map((release) => releaseResource(db, release));
    },
  },
  {
    method: 'POST',
    pattern: /^\/release$/,
    handler: (db, request) => {
      const body = objectBody(request);
      const release = findRelease(db, String(body.guid ?? ''));

      if (release) {
        enqueue(db, { ...release, rejections: [] });
      }

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
