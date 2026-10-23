import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fetchImage, type SkyhookShow } from './skyhook.mts';

const POSTER_WIDTHS = [250, 500, 750, 1000, 1500];

const BANNER_SIZES = [70, 140, 210];

async function writeJpeg(
  source: Buffer,
  file: string,
  size: { width?: number; height?: number },
  quality: number
) {
  await sharp(source)
    .resize({ ...size, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(file);
}

export async function saveArtwork(show: SkyhookShow, coverDir: string) {
  const poster = show.images.find((image) => image.coverType === 'Poster');
  const fanart = show.images.find((image) => image.coverType === 'Fanart');
  const banner = show.images.find((image) => image.coverType === 'Banner');

  mkdirSync(coverDir, { recursive: true });

  if (poster) {
    const source = await fetchImage(poster.url);

    for (const width of POSTER_WIDTHS) {
      await writeJpeg(
        source,
        path.join(coverDir, `poster-${width}.jpg`),
        { width },
        80
      );
    }
  }

  if (fanart) {
    const source = await fetchImage(fanart.url);

    await writeJpeg(
      source,
      path.join(coverDir, 'fanart.jpg'),
      { width: 1600 },
      70
    );
  }

  if (banner) {
    const source = await fetchImage(banner.url);

    for (const size of BANNER_SIZES) {
      await writeJpeg(
        source,
        path.join(coverDir, `banner-${size}.jpg`),
        { height: size },
        80
      );
    }
  }

  return { hasPoster: !!poster, hasFanart: !!fanart, hasBanner: !!banner };
}

export function reuseArtwork(source: string, target: string) {
  const files = existsSync(source) ? readdirSync(source) : [];

  if (!files.some((file) => file.startsWith('poster-'))) {
    return null;
  }

  cpSync(source, target, { recursive: true });

  return {
    hasPoster: true,
    hasFanart: files.includes('fanart.jpg'),
    hasBanner: files.some((file) => file.startsWith('banner-')),
  };
}
