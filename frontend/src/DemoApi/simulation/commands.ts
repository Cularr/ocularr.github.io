import { DemoCommand, JsonObject } from '../DemoTypes';
import { applyFileChanges } from '../operations/filePreviews';
import { commandResource } from '../resources/system';
import { idsFrom } from '../routes/request';
import { wantedWorks } from '../routes/search';
import { cutoffUnmetWorks, missingWorks } from '../state/queries';
import { DemoDb, nextId } from '../state/store';
import { currentVersion } from '../state/version';
import { broadcast, broadcastVersion } from '../transport/signalR';
import { searchWorks } from './queue';
import { volumeWorks } from './releases';

const SEARCH_COMMANDS = [
  'ChapterSearch',
  'VolumeSearch',
  'SeriesSearch',
  'MissingChapterSearch',
  'CutoffUnmetChapterSearch',
];

const WANTED_FILTERS = [
  'seriesIds',
  'qualityProfileIds',
  'seriesType',
  'ordering',
  'kind',
  'seriesTags',
  'quality',
];

function wantedQuery(body: JsonObject) {
  const query = new URLSearchParams();

  if (typeof body.monitored === 'boolean') {
    query.set('monitored', String(body.monitored));
  }

  WANTED_FILTERS.forEach((key) => {
    const value = body[key];

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
    }
  });

  return query;
}

function runCommandEffects(db: DemoDb, name: string, body: JsonObject) {
  const workIds = idsFrom(body, 'workIds');
  const seriesId = body.seriesId as number | undefined;
  const volumeNumber = body.volumeNumber as number | undefined;

  switch (name) {
    case 'ChapterSearch':
      searchWorks(
        db,
        db.works.filter((e) => workIds.includes(e.id))
      );
      break;

    case 'VolumeSearch': {
      const members = new Set(
        volumeWorks(
          db,
          Number(seriesId),
          volumeNumber,
          body.volumeWorkId as number | undefined
        )
      );
      searchWorks(
        db,
        missingWorks(db, {
          filter: (e) => members.has(e),
        })
      );
      break;
    }

    case 'SeriesSearch':
      searchWorks(
        db,
        missingWorks(db, { filter: (e) => e.seriesId === seriesId })
      );
      break;
    case 'CutoffUnmetChapterSearch':
      searchWorks(
        db,
        workIds.length
          ? cutoffUnmetWorks(db, { filter: (e) => workIds.includes(e.id) })
          : wantedWorks(db, 'cutoff', wantedQuery(body), {
              includeQueued: false,
            })
      );
      break;
    case 'MissingChapterSearch':
      searchWorks(
        db,
        workIds.length
          ? missingWorks(db, { filter: (e) => workIds.includes(e.id) })
          : wantedWorks(db, 'missing', wantedQuery(body), {
              includeQueued: false,
            })
      );
      break;
    case 'RenameFiles':
    case 'RenameSeries':
    case 'RetagWorkFiles':
    case 'RetagSeries':
      applyFileChanges(db, name, body);
      break;
    case 'ClearBlocklist':
      db.blocklist = [];
      break;
    case 'ApplicationUpdate':
      if (!db.updateInstalled) {
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
