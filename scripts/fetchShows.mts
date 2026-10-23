import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import type { ShowData } from '../frontend/src/DemoApi/DemoTypes.ts';
import { reuseArtwork, saveArtwork } from './shows/artwork.mts';
import { type ShowConfig, SHOWS } from './shows/showList.mts';
import { fetchJson, SKYHOOK, type SkyhookShow } from './shows/skyhook.mts';

type Artwork = Pick<ShowData, 'hasPoster' | 'hasFanart' | 'hasBanner'>;

const DEFAULT_AIR_HOUR = 21;

const DEFAULT_RUNTIME = 45;

function toShowData(
  config: ShowConfig,
  show: SkyhookShow,
  artwork: Artwork
): ShowData {
  const hours = show.timeOfDay?.hours ?? DEFAULT_AIR_HOUR;
  const minutes = show.timeOfDay?.minutes ?? 0;
  const pad = (value: number) => String(value).padStart(2, '0');

  return {
    tvdbId: config.tvdbId,
    title: show.title,
    overview: show.overview ?? '',
    year: Number((show.firstAired ?? '2020').slice(0, 4)),
    status: show.status.toLowerCase() === 'ended' ? 'ended' : 'continuing',
    runtime: show.runtime ?? DEFAULT_RUNTIME,
    airTime: `${pad(hours)}:${pad(minutes)}`,
    network: show.network ?? '',
    genres: show.genres ?? [],
    certification: show.contentRating ?? '',
    rating: Number(show.rating?.value ?? 0),
    imdbId: show.imdbId ?? '',
    tmdbId: show.tmdbId ?? 0,
    tvMazeId: show.tvMazeId ?? 0,
    hasPoster: artwork.hasPoster,
    hasFanart: artwork.hasFanart,
    hasBanner: artwork.hasBanner,
    qualityProfileId: config.qualityProfileId,
    library: config.library,
    airing: config.airing ?? null,
    episodes: [...show.episodes]
      .sort(
        (a, b) =>
          a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
      )
      .filter((episode) => episode.seasonNumber > 0 && episode.airDateUtc)
      .map((episode) => ({
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title ?? `Episode ${episode.episodeNumber}`,
        airDateUtc: episode.airDateUtc ?? '',
      })),
  };
}

export default async function fetchShows(
  demoDir: string,
  { artworkFrom }: { artworkFrom?: string } = {}
) {
  const shows: ShowData[] = [];
  const coverRoot = path.join(demoDir, 'MediaCover');

  mkdirSync(coverRoot, { recursive: true });

  readdirSync(coverRoot)
    .filter((folder) => !SHOWS.some((show) => String(show.tvdbId) === folder))
    .forEach((folder) =>
      rmSync(path.join(coverRoot, folder), { recursive: true, force: true })
    );

  for (const config of SHOWS) {
    const show = await fetchJson<SkyhookShow>(`${SKYHOOK}/${config.tvdbId}`);
    const coverDir = path.join(coverRoot, String(config.tvdbId));
    const previous = artworkFrom
      ? reuseArtwork(
          path.join(artworkFrom, 'MediaCover', String(config.tvdbId)),
          coverDir
        )
      : null;
    const artwork = previous ?? (await saveArtwork(show, coverDir));

    shows.push(toShowData(config, show, artwork));

    console.log(`Fetched ${show.title}`);
  }

  writeFileSync(
    path.join(demoDir, 'shows.json'),
    JSON.stringify({ generated: new Date().toISOString(), shows })
  );
}
