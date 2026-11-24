import { HOUR } from '../constants';
import { DemoRelease, DemoWork, Protocol } from '../DemoTypes';
import { qualityWeight } from '../qualities/model';
import { allowedQualityNames } from '../qualities/profiles';
import { coveredIds } from '../state/editions';
import { isCutoffUnmet } from '../state/queries';
import {
  buildRelease,
  RELEASE_GROUPS,
  sceneName,
} from '../state/releaseFactory';
import { DemoDb } from '../state/store';

const RELEASE_CANDIDATES: {
  quality: string;
  protocol: Protocol;
}[] = [
  { quality: 'Digital UHQ', protocol: 'usenet' },
  { quality: 'Digital HQ', protocol: 'usenet' },
  { quality: 'Digital HQ', protocol: 'torrent' },
  { quality: 'WebRip HQ', protocol: 'torrent' },
  { quality: 'Scan HQ', protocol: 'usenet' },
  { quality: 'Digital MQ', protocol: 'torrent' },
  { quality: 'Digital MQ', protocol: 'usenet' },
  { quality: 'Scan MQ', protocol: 'usenet' },
];

const VOLUME_PACK_CANDIDATES = 6;

export const FULL_VOLUME_NOT_RELEASED =
  "Full volume release rejected. All chapters haven't released yet.";

function allowsUnreleasedPack(db: DemoDb, tags: number[], indexerId: number) {
  const profiles = db.collections.releaseprofile.filter((profile) => {
    const included = Array.isArray(profile.tags) ? profile.tags : [];
    const excluded = Array.isArray(profile.excludedTags)
      ? profile.excludedTags
      : [];
    const indexers = Array.isArray(profile.indexerIds)
      ? profile.indexerIds
      : [];

    return (
      profile.enabled === true &&
      (!included.length || tags.some((tag) => included.includes(tag))) &&
      !tags.some((tag) => excluded.includes(tag)) &&
      (!indexers.length || indexers.includes(indexerId))
    );
  });

  return (
    profiles.length > 0 &&
    profiles.every(
      (profile) => profile.allowVolumePackWithoutAllChaptersReleased === true
    )
  );
}

function allowedQualities(db: DemoDb, seriesId: number) {
  const series = db.series.find((s) => s.id === seriesId);

  return allowedQualityNames(
    db.collections.qualityprofile.find((p) => p.id === series?.qualityProfileId)
  );
}

export function releasesForWork(db: DemoDb, work: DemoWork): DemoRelease[] {
  const series = db.series.find((s) => s.id === work.seriesId);

  if (!series) {
    return [];
  }

  const allowed = allowedQualities(db, series.id);
  const blocked = new Set(db.blocklist.map((item) => item.sourceTitle));

  return RELEASE_CANDIDATES.map((candidate, index) => {
    const group = RELEASE_GROUPS[(work.id + index) % RELEASE_GROUPS.length];
    const release = buildRelease(
      db,
      series,
      [work],
      candidate.quality,
      candidate.protocol,
      group,
      index
    );

    release.guid = `${work.id}-${index}`;

    if (candidate.quality === 'Digital HQ' && candidate.protocol === 'usenet') {
      release.customFormatScore = 25;
    }

    if (!allowed.has(candidate.quality)) {
      release.rejections.push(`${candidate.quality} is not wanted in profile`);
    }

    if (blocked.has(release.title)) {
      release.rejections.push('Release is blocklisted');
    }

    return release;
  });
}

export function volumeWorks(
  db: DemoDb,
  seriesId: number,
  volumeNumber: number | undefined,
  volumeWorkId?: number
) {
  const works = db.works.filter((e) => e.seriesId === seriesId);

  if (volumeWorkId === undefined) {
    return works
      .filter((e) => e.volumeNumber === volumeNumber)
      .sort((a, b) => a.number - b.number);
  }

  const volume = works.find(
    (e) => e.id === volumeWorkId && e.kind === 'volume'
  );

  if (!volume) {
    return [];
  }

  const members = coveredIds(works, [volume.id]);
  return [volume, ...works.filter((e) => e !== volume && members.has(e.id))];
}

export function releasesForVolume(
  db: DemoDb,
  seriesId: number,
  volumeNumber: number | undefined,
  volumeWorkId?: number
): DemoRelease[] {
  const series = db.series.find((s) => s.id === seriesId);
  const now = Date.now();
  const works = volumeWorks(db, seriesId, volumeNumber, volumeWorkId);

  if (!series || !works.length) {
    return [];
  }

  const allowed = allowedQualities(db, series.id);
  const blocked = new Set(db.blocklist.map((item) => item.sourceTitle));
  const volumes = works.filter((work) => work.kind === 'volume');
  const seriesWorks = db.works.filter((work) => work.seriesId === seriesId);
  const units = volumes.length
    ? volumes.flatMap((volume) => {
        const children = seriesWorks.filter((work) =>
          work.parentWorkIds.includes(volume.id)
        );
        return children.length ? children : [volume];
      })
    : works;
  const hasUnreleasedUnits = units.some(
    (work) => Date.parse(work.releaseDateUtc) > now + 24 * HOUR
  );
  const volumeLabel = `v${String(
    volumeNumber ?? works[0].volumeNumber ?? 0
  ).padStart(2, '0')}`;
  const packs = RELEASE_CANDIDATES.slice(0, VOLUME_PACK_CANDIDATES).map(
    (candidate, index) => {
      const group = RELEASE_GROUPS[(seriesId + index) % RELEASE_GROUPS.length];
      const release = buildRelease(
        db,
        series,
        works,
        candidate.quality,
        candidate.protocol,
        group,
        index
      );
      release.guid =
        volumeWorkId === undefined
          ? `volume-${seriesId}-number-${volumeNumber}-${index}`
          : `volume-${seriesId}-work-${volumeWorkId}-${index}`;
      release.title = `${sceneName(series, works[0]).replace(
        /\.v\d+\.c[\d.]+$/,
        ''
      )}.${volumeLabel}.${candidate.quality.replace(/ /g, '.')}-${group}`;
      release.size = release.size * works.length;
      release.fullVolume = true;
      release.releaseType = 'volumePack';

      if (!allowed.has(candidate.quality)) {
        release.rejections.push(
          `${candidate.quality} is not wanted in profile`
        );
      }

      if (
        hasUnreleasedUnits &&
        !allowsUnreleasedPack(db, series.tags, release.indexerId)
      ) {
        release.rejections.push(FULL_VOLUME_NOT_RELEASED);
      }

      if (blocked.has(release.title)) {
        release.rejections.push('Release is blocklisted');
      }

      return release;
    }
  );

  return [
    ...packs,
    ...works
      .filter((e) => Date.parse(e.releaseDateUtc) < now)
      .slice(0, 3)
      .flatMap((e) => releasesForWork(db, e).slice(0, 3)),
  ];
}

export function findRelease(db: DemoDb, guid: string) {
  const volumeMatch = /^volume-(\d+)-(number|work)-(-?\d+)-\d+$/.exec(guid);

  if (volumeMatch) {
    return releasesForVolume(
      db,
      Number(volumeMatch[1]),
      volumeMatch[2] === 'number' ? Number(volumeMatch[3]) : undefined,
      volumeMatch[2] === 'work' ? Number(volumeMatch[3]) : undefined
    ).find((r) => r.guid === guid);
  }

  const work = db.works.find((e) => e.id === Number(guid.split('-')[0]));

  return work
    ? releasesForWork(db, work).find((r) => r.guid === guid)
    : undefined;
}

export function bestRelease(db: DemoDb, work: DemoWork) {
  const file = db.workFiles.find((f) => f.id === work.workFileId);

  if (file && !isCutoffUnmet(db, file)) {
    return undefined;
  }

  return releasesForWork(db, work)
    .filter(
      (release) =>
        release.rejections.length === 0 &&
        (!file || qualityWeight(release.quality) > qualityWeight(file.quality))
    )
    .sort(
      (a, b) =>
        qualityWeight(b.quality) - qualityWeight(a.quality) ||
        b.customFormatScore - a.customFormatScore
    )[0];
}
