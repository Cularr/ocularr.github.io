import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

type Image = { coverType: string; url: string };

export function avifName(url: string) {
  return `${path.parse(path.basename(url)).name}.avif`;
}

function artworkFlags(images: Image[]) {
  return {
    hasPoster: images.some((image) => image.coverType === 'poster'),
    hasBanner: images.some((image) => image.coverType === 'banner'),
    hasFanart: images.some((image) => image.coverType === 'fanart'),
  };
}

export async function saveArtwork(
  images: Image[],
  sourceDir: string,
  coverDir: string
) {
  mkdirSync(coverDir, { recursive: true });

  for (const image of images) {
    await sharp(readFileSync(path.join(sourceDir, path.basename(image.url))))
      .avif({ quality: 55, effort: 6 })
      .toFile(path.join(coverDir, avifName(image.url)));
  }

  return artworkFlags(images);
}

export function reuseArtwork(source: string, target: string, images: Image[]) {
  if (
    !images.length ||
    !images.every((image) => existsSync(path.join(source, avifName(image.url))))
  ) {
    return null;
  }

  mkdirSync(target, { recursive: true });
  images.forEach((image) =>
    copyFileSync(
      path.join(source, avifName(image.url)),
      path.join(target, avifName(image.url))
    )
  );

  return artworkFlags(images);
}
