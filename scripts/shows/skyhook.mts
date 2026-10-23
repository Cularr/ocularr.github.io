export interface SkyhookImage {
  coverType: string;
  url: string;
}

export interface SkyhookEpisode {
  seasonNumber: number;
  episodeNumber: number;
  title?: string;
  airDateUtc?: string;
}

export interface SkyhookShow {
  tvdbId: number;
  title: string;
  overview?: string;
  firstAired?: string;
  status: string;
  runtime?: number;
  timeOfDay?: { hours: number; minutes: number };
  network?: string;
  genres?: string[];
  contentRating?: string;
  rating?: { value: string };
  imdbId?: string;
  tmdbId?: number;
  tvMazeId?: number;
  images: SkyhookImage[];
  episodes: SkyhookEpisode[];
}

export const SKYHOOK = 'https://skyhook.sonarr.tv/v1/tvdb/shows/en';

const ATTEMPTS = 3;

const RETRY_DELAY = 2000;

const REQUEST_TIMEOUT = 30000;

const IMAGE_HOSTS = ['artworks.thetvdb.com', 'thetvdb.com', 'image.tmdb.org'];

class ClientError extends Error {}

async function attempt(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (response.status >= 400 && response.status < 500) {
    throw new ClientError(`${url} returned ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response;
}

async function request(
  url: string,
  attemptsLeft = ATTEMPTS
): Promise<Response> {
  try {
    return await attempt(url);
  } catch (error) {
    if (error instanceof ClientError || attemptsLeft <= 1) {
      throw error;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, (ATTEMPTS - attemptsLeft + 1) * RETRY_DELAY)
    );

    return request(url, attemptsLeft - 1);
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  return (await (await request(url)).json()) as T;
}

export async function fetchImage(url: string) {
  const { hostname, protocol } = new URL(url);

  if (
    protocol !== 'https:' ||
    !IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    )
  ) {
    throw new Error(`Refusing to download artwork from ${url}`);
  }

  return Buffer.from(await (await request(url)).arrayBuffer());
}
