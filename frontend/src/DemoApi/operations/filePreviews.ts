import { DemoSeries, DemoWork, DemoWorkFile, JsonObject } from '../DemoTypes';
import { storedValues } from '../providers/fields';
import { relativeFilePath, workFileResource } from '../resources/work';
import { idsFrom } from '../routes/request';
import { renderFormat } from '../settings';
import { coveredIds } from '../state/editions';
import { seriesPath } from '../state/paths';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';

const TITLE_YEAR = /\(\d{4}\)$/;
const TITLE_PREFIX = /^(The|An|A) (.*?)((?: *\([^)]+\))*)$/i;
const MEDIA_EXTENSION =
  /\.(?:cbf|pdf|zip|rar|7z|tar|ace|cbz|cbr|cb7|cbt|cba|epub|mobi|azw|azw3)$/i;
const SERIES_STATUS = {
  continuing: 'Ongoing',
  ended: 'Completed',
  upcoming: 'Upcoming',
};

function cleanTitle(title: string) {
  return title
    .replace(/&/g, 'and')
    .replace(/\//g, ' ')
    .replace(
      /(?<=\s)[,<>\\;:'"|`\u2019~!?@$%^*_=-](?=\s)|['`\u2019:?,](?=(?:s|m|t|ve|ll|d|re)\s|\s|$)|[()[\]{}]/gi,
      ''
    )
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function seriesTitleTokens({ title, year }: DemoSeries) {
  const withoutYear = title.replace(TITLE_YEAR, '').trimEnd();
  const titleThe = (value: string) => value.replace(TITLE_PREFIX, '$2, $1$3');

  const cleanTitleThe = (value: string) => {
    const match = TITLE_PREFIX.exec(value);

    return match
      ? `${cleanTitle(match[2]).trim()}, ${match[1]}${cleanTitle(match[3])}`
      : cleanTitle(value);
  };

  const withYear = (value: string) =>
    year && !TITLE_YEAR.test(value) ? `${value} (${year})` : value;
  const titleYear = title.match(TITLE_YEAR)?.[0].slice(1, -1) ?? year;

  return {
    'series title': title,
    'series titleyear': withYear(title),
    'series cleantitle': cleanTitle(title),
    'series cleantitleyear': cleanTitle(withYear(title)),
    'series titlewithoutyear': withoutYear,
    'series cleantitlewithoutyear': cleanTitle(withoutYear),
    'series titlethe': titleThe(title),
    'series cleantitlethe': cleanTitleThe(title),
    'series titletheyear': withYear(titleThe(title)),
    'series cleantitletheyear': year
      ? `${cleanTitleThe(withoutYear)} ${titleYear}`
      : cleanTitleThe(title),
    'series titlethewithoutyear': titleThe(withoutYear),
    'series cleantitlethewithoutyear': cleanTitleThe(withoutYear),
    'series titlefirstcharacter':
      cleanTitle(titleThe(title).slice(0, 2))
        .match(/[\p{L}\p{N}]/u)?.[0]
        .toUpperCase() ?? '_',
    'series year': String(year),
  };
}

function renamePath(
  db: DemoDb,
  series: DemoSeries,
  file: DemoWorkFile,
  works: DemoWork[],
  existingPath: string
) {
  const naming = db.settings.naming;
  const ordered = works
    .flatMap((work) => {
      if (work.kind !== 'volume') {
        return [work];
      }

      const children = db.works.filter(
        (child) =>
          child.seriesId === series.id && child.parentWorkIds.includes(work.id)
      );

      return children.length
        ? children.map((child) => ({
            ...child,
            volumeNumber: work.volumeNumber,
          }))
        : [work];
    })
    .sort(
      (a, b) =>
        (a.volumeNumber ?? 0) - (b.volumeNumber ?? 0) || a.number - b.number
    );
  const first = ordered[0];
  const volume = works[0].volumeNumber ?? 0;
  const volumeTitle =
    db.works.find(
      (work) =>
        work.seriesId === series.id &&
        work.kind === 'volume' &&
        work.inEdition &&
        (work.numberLabel?.trim() ? Number(work.numberLabel) : work.number) ===
          volume &&
        work.title.trim()
    )?.title ?? '';
  const currentName =
    existingPath.split(/[/\\]/).pop() ||
    relativeFilePath(db, { ...file, relativePath: undefined }, series)
      .split('/')
      .pop()!;
  const extension = currentName.match(MEDIA_EXTENSION)?.[0] ?? '';
  const originalName = extension
    ? currentName.slice(0, -extension.length)
    : currentName;
  const titles = ordered
    .map((w) => w.title)
    .filter(Boolean)
    .join(' + ');
  const clean = (text: string) =>
    text
      .replace(/[<>:"/\\|?*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const date = first.releaseDateUtc.slice(0, 10);
  const seriesType = series.seriesType ?? 'manga';
  const ordering = series.metadata.ordering;
  const absoluteNumbers = ordered.map((work) => work.absoluteNumber);
  const sequentialFormat = String(naming.sequentialChapterFormat ?? '');
  const chapterFormat =
    ordering === 'sequential' &&
    /\{absolute(?::0+)?\}/i.test(sequentialFormat) &&
    absoluteNumbers.some((number) => number == null)
      ? 'hierarchicalChapterFormat'
      : `${ordering}ChapterFormat`;
  const releaseType = file.releaseType ?? 'singleChapter';
  const values = {
    ...seriesTitleTokens(series),
    'series type': seriesType.charAt(0).toUpperCase() + seriesType.slice(1),
    'series status': SERIES_STATUS[series.status],
    'volume title': volumeTitle,
    'volume cleantitle': cleanTitle(volumeTitle),
    'chapter title': titles,
    'chapter cleantitle': clean(titles),
    'chapter pagecount':
      first.pageCount && first.pageCount > 0 ? String(first.pageCount) : '',
    'chapter year': /^\d{4}(?:-|$)/.test(date) ? date.slice(0, 4) : '',
    'quality full': file.quality,
    'quality title': file.quality,
    'release group': file.releaseGroup,
    'release type': releaseType.charAt(0).toUpperCase() + releaseType.slice(1),
    'original title': originalName,
    'original filename': originalName,
    'release-date': date,
    'release date': date.replace(/-/g, ' '),
    'comicinfo container': 'CBZ',
    'comicinfo imageformat': 'JPEG',
  };
  const format = (key: string, absolute = false) =>
    clean(
      renderFormat(
        String(naming[key] ?? ''),
        volume,
        ordered.map((work) =>
          work.numberLabel?.trim() ? work.numberLabel : work.number
        ),
        date,
        values,
        absolute && ordering === 'sequential'
          ? {
              numbers: absoluteNumbers,
              style: Number(naming.multiChapterStyle),
            }
          : undefined,
        Number(naming.multiChapterStyle ?? 5)
      )
    );
  const name = format(chapterFormat, true);
  const folder =
    series.volumeFolder === false
      ? ''
      : format(volume === 0 ? 'specialsFolderFormat' : 'volumeFolderFormat');
  return [folder, `${name}${extension || '.cbz'}`].filter(Boolean).join('/');
}

function previewRow(
  db: DemoDb,
  action: string,
  series: DemoSeries,
  file: DemoWorkFile,
  works: DemoWork[]
): JsonObject | undefined {
  const chapterNumbers = works.map((work) => work.number);
  const base = {
    id: file.id,
    seriesId: series.id,
    workFileId: file.id,
    volumeNumber: works[0].volumeNumber,
    chapterNumbers,
  };
  const existingPath = relativeFilePath(db, file, series);

  if (action === 'rename') {
    const newPath = renamePath(db, series, file, works, existingPath);

    return newPath === existingPath
      ? undefined
      : { ...base, workNumbers: chapterNumbers, existingPath, newPath };
  }

  const tags = {
    Series: series.title,
    Title: works
      .map((work) => work.title)
      .filter(Boolean)
      .join(' + '),
    Number: chapterNumbers.join(', '),
  };
  const changes = Object.entries(tags)
    .filter(([key, value]) => value && value !== file.comicTags?.[key])
    .map(([field, newValue]) => ({
      field,
      newValue,
      oldValue: file.comicTags?.[field],
    }));

  return changes.length
    ? { ...base, path: `${seriesPath(series)}/${existingPath}`, changes }
    : undefined;
}

export function filePreviews(
  db: DemoDb,
  action: string,
  seriesIds: number[],
  query = new URLSearchParams()
) {
  const rows: JsonObject[] = [];

  if (action === 'rename' && !db.settings.naming.renameChapters) {
    return rows;
  }

  if (action === 'retag') {
    const writer = db.collections.metadata.find(
      (p) => p.implementation === 'ComicTagsMetadata' && p.enable
    );

    if (!writer) {
      return rows;
    }

    const settings = storedValues(writer);

    if (!settings.get('writeComicInfo') && !settings.get('writeMetronInfo')) {
      return rows;
    }
  }

  for (const series of db.series.filter((s) => seriesIds.includes(s.id))) {
    const works = db.works.filter((w) => w.seriesId === series.id);
    const volume = query.get('volumeWorkId');
    const members =
      volume === null ? null : coveredIds(works, [Number(volume)]);
    const byFile = new Map<number, DemoWork[]>();

    for (const work of works) {
      if (work.workFileId) {
        const linked = byFile.get(work.workFileId) ?? [];
        linked.push(work);
        byFile.set(work.workFileId, linked);
      }
    }

    for (const file of db.workFiles.filter((f) => f.seriesId === series.id)) {
      const linked = byFile.get(file.id);

      if (
        linked?.length &&
        (!query.has('workFileId') ||
          file.id === Number(query.get('workFileId'))) &&
        (!members || linked.some((w) => members.has(w.id))) &&
        (!query.has('volumeNumber') ||
          linked.some(
            (w) => w.volumeNumber === Number(query.get('volumeNumber'))
          ))
      ) {
        const row = previewRow(db, action, series, file, linked);

        if (row) {
          rows.push(row);
        }
      }
    }
  }

  return rows;
}

export function applyFileChanges(db: DemoDb, name: string, body: JsonObject) {
  const bulk = name.endsWith('Series');
  const seriesIds = bulk ? idsFrom(body, 'seriesIds') : [Number(body.seriesId)];
  const selected = new Set(idsFrom(body, 'files'));
  const files = new Map(db.workFiles.map((file) => [file.id, file]));
  const action = name.startsWith('Rename') ? 'rename' : 'retag';

  for (const row of filePreviews(db, action, seriesIds)) {
    const file = files.get(Number(row.workFileId));

    if (file && (bulk || selected.has(file.id))) {
      if (action === 'rename') {
        file.relativePath = String(row.newPath);
      } else {
        file.comicTags ??= {};

        for (const change of row.changes as JsonObject[]) {
          file.comicTags[String(change.field)] = String(change.newValue);
        }
      }

      broadcast('workfile', 'updated', workFileResource(db, file));
    }
  }
}
