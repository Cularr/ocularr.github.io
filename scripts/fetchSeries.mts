import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import type {
  JsonObject,
  SeriesData,
} from '../frontend/src/DemoApi/DemoTypes.ts';
import { avifName, reuseArtwork, saveArtwork } from './series/artwork.mts';
import { SERIES, type SeriesConfig } from './series/seriesList.mts';

const sample = path.join(import.meta.dirname, 'series', 'sample');
const SOURCE_RELATIONSHIP_TYPE = 1;

type Artwork = Pick<SeriesData, 'hasPoster' | 'hasFanart' | 'hasBanner'>;
type SampleSeries = Pick<
  SeriesData,
  'title' | 'overview' | 'year' | 'status' | 'genres' | 'rating' | 'seriesType'
> & {
  metadata: JsonObject & {
    images: { coverType: string; url: string; remoteUrl: string }[];
    collections: {
      id: number;
      collectionId?: string;
      kind: SeriesData['works'][number]['kind'];
      language?: string;
      medium?: string;
      format?: string;
      editionId?: string;
      editionName?: string;
      synthetic: boolean;
      workIds: number[];
    }[];
    externalLinks: {
      name: string;
      externalId?: string;
      url: string;
      relationshipType: number;
    }[];
  };
  works: SeriesData['works'];
};

function toSeriesData(
  config: SeriesConfig,
  sample: SampleSeries,
  artwork: Artwork
): SeriesData {
  return {
    ...sample,
    metadata: {
      ...sample.metadata,
      images: sample.metadata.images.map((image) => ({
        ...image,
        url: image.url.replace(/[^/]+$/, avifName(image.url)),
      })),
      collections: sample.metadata.collections.map((collection) => ({
        ...collection,
        synthetic: !collection.collectionId,
      })),
      externalLinks: sample.metadata.externalLinks.filter(
        (link) =>
          link.relationshipType === SOURCE_RELATIONSHIP_TYPE && link.url.trim()
      ),
    },
    ...config,
    ...artwork,
  };
}

export default async function fetchSeries(
  demoDir: string,
  { artworkFrom }: { artworkFrom?: string } = {}
) {
  const seriesList: SeriesData[] = [];
  const coverRoot = path.join(demoDir, 'MediaCover');

  mkdirSync(coverRoot, { recursive: true });
  readdirSync(coverRoot)
    .filter(
      (folder) => !SERIES.some((entry) => entry.foreignSeriesId === folder)
    )
    .forEach((folder) =>
      rmSync(path.join(coverRoot, folder), { recursive: true, force: true })
    );

  for (const config of SERIES) {
    const guid = config.foreignSeriesId;
    const record: SampleSeries = JSON.parse(
      readFileSync(path.join(sample, 'records', `${guid}.json`), 'utf8')
    );
    const coverDir = path.join(coverRoot, guid);
    const images = record.metadata.images;
    const previous = artworkFrom
      ? reuseArtwork(
          path.join(artworkFrom, 'MediaCover', guid),
          coverDir,
          images
        )
      : null;
    const artwork =
      previous ??
      (await saveArtwork(
        images,
        path.join(sample, 'MediaCover', guid),
        coverDir
      ));
    seriesList.push(toSeriesData(config, record, artwork));
  }

  const sourceCredits = JSON.parse(
    readFileSync(path.join(sample, 'sources.json'), 'utf8')
  );
  cpSync(path.join(sample, 'SourceIcons'), path.join(demoDir, 'SourceIcons'), {
    recursive: true,
  });
  writeFileSync(
    path.join(demoDir, 'series.json'),
    JSON.stringify({ series: seriesList, sourceCredits })
  );
}
