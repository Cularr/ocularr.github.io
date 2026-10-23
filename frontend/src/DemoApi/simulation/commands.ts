import { DemoCommand, JsonObject } from '../DemoTypes';
import { commandResource } from '../resources/system';
import { cutoffUnmetEpisodes, missingEpisodes } from '../state/queries';
import { DemoDb, nextId } from '../state/store';
import { currentVersion } from '../state/version';
import { broadcast, broadcastVersion } from '../transport/signalR';
import { searchEpisodes } from './queue';

const SEARCH_COMMANDS = [
  'EpisodeSearch',
  'SeasonSearch',
  'SeriesSearch',
  'MissingEpisodeSearch',
  'CutoffUnmetEpisodeSearch',
];

function runCommandEffects(db: DemoDb, name: string, body: JsonObject) {
  const episodeIds = (body.episodeIds ?? []) as number[];
  const seriesId = body.seriesId as number | undefined;
  const seasonNumber = body.seasonNumber as number | undefined;

  switch (name) {
    case 'EpisodeSearch':
      searchEpisodes(
        db,
        db.episodes.filter((e) => episodeIds.includes(e.id))
      );
      break;
    case 'SeasonSearch':
      searchEpisodes(
        db,
        missingEpisodes(db, {
          filter: (e) =>
            e.seriesId === seriesId && e.seasonNumber === seasonNumber,
        })
      );
      break;
    case 'SeriesSearch':
      searchEpisodes(
        db,
        missingEpisodes(db, { filter: (e) => e.seriesId === seriesId })
      );
      break;
    case 'CutoffUnmetEpisodeSearch':
      searchEpisodes(
        db,
        cutoffUnmetEpisodes(db, {
          filter: (e) => !episodeIds.length || episodeIds.includes(e.id),
        })
      );
      break;
    case 'MissingEpisodeSearch':
      searchEpisodes(
        db,
        missingEpisodes(db, {
          filter: (e) => !episodeIds.length || episodeIds.includes(e.id),
        })
      );
      break;
    case 'ClearBlocklist':
      db.blocklist = [];
      break;
    case 'ApplicationUpdate':
    case 'ApplicationUpdateCheck':
      if (!db.updateInstalled && name === 'ApplicationUpdate') {
        db.updateInstalled = true;
        broadcastVersion(currentVersion(db));
      }

      break;
    default:
      break;
  }
}

export function executeCommand(db: DemoDb, body: JsonObject) {
  const now = new Date().toISOString();
  const name = String(body.name ?? 'Unknown');
  const command: DemoCommand = {
    id: nextId(db),
    name,
    body,
    status: 'started',
    queued: now,
    started: now,
    ended: '',
  };

  db.commands.push(command);

  window.setTimeout(
    () => {
      runCommandEffects(db, name, body);
      command.status = 'completed';
      command.ended = new Date().toISOString();
      broadcast('command', 'updated', commandResource(command));
    },
    SEARCH_COMMANDS.includes(name) ? 1400 : 900
  );

  return commandResource(command);
}
