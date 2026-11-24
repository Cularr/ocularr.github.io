import { DemoSeries, JsonObject, SeriesData } from '../DemoTypes';

type Collection = JsonObject & { id: number; kind: string; workIds: number[] };
type LayoutWork = SeriesData['works'][number];

export function collectionsOf(metadata: JsonObject) {
  return metadata.collections as Collection[];
}

export function orderingFor(kind: string) {
  if (kind === 'chapter') return 'sequential';
  if (kind === 'magazine') return 'chronological';
  return 'hierarchical';
}

export function defaultEdition(seriesData: SeriesData) {
  let ordering: 'hierarchical' | 'sequential' | 'chronological' =
    'hierarchical';

  if (
    ['manhwa', 'manhua', 'comic', 'doujinshi', 'oneShot'].includes(
      seriesData.seriesType
    )
  ) {
    ordering = 'sequential';
  } else if (seriesData.seriesType === 'magazine') {
    ordering = 'chronological';
  }

  const kind = {
    sequential: 'chapter',
    chronological: 'magazine',
    hierarchical: 'volume',
  }[ordering];
  const collections = collectionsOf(seriesData.metadata);
  const matching = collections.filter((c) => c.kind === kind);
  const candidates = [...(matching.length ? matching : collections)].sort(
    (a, b) => b.workIds.length - a.workIds.length || a.id - b.id
  );
  // The seeded quality profiles have no scored language formats.
  const selected = candidates.find((c) => c.language === 'en') ?? candidates[0];
  return { ordering, selectedCollectionId: selected?.id };
}

export function coveredIds(works: LayoutWork[], roots: number[]) {
  const children = new Map<number, number[]>();

  for (const work of works) {
    for (const parent of work.parentWorkIds) {
      const list = children.get(parent) ?? [];
      list.push(work.id);
      children.set(parent, list);
    }
  }

  const covered = new Set<number>();
  const pending = [...roots];

  while (pending.length) {
    const id = pending.pop()!;

    if (!covered.has(id)) {
      covered.add(id);
      pending.push(...(children.get(id) ?? []));
    }
  }

  return covered;
}

export function applyLayout(series: DemoSeries, works: LayoutWork[]) {
  const selected = collectionsOf(series.metadata).find(
    (c) => c.id === series.metadata.selectedCollectionId
  );
  const members = selected?.workIds ?? [];
  const positions = new Map(members.map((id, index) => [id, index + 1]));
  const covered = coveredIds(works, members);
  const byId = new Map(works.map((e) => [e.id, e]));
  const ranks = new Map<string, number>();
  const ordered = [...works].sort(
    (a, b) =>
      a.number - b.number ||
      String(a.numberLabel ?? '').localeCompare(String(b.numberLabel ?? '')) ||
      a.id - b.id
  );

  for (const work of ordered) {
    const { kind } = work;
    const rank = (ranks.get(kind) ?? 0) + 1;
    ranks.set(kind, rank);
    work.inEdition = !members.length || covered.has(work.id);
    work.absoluteNumber = positions.get(work.id) ?? rank;
    let volumeNumber: number | null = null;

    if (kind === 'magazine') {
      const year = Number(work.releaseDateUtc.slice(0, 4) || NaN);
      volumeNumber = Number.isFinite(year) ? year : null;
    } else {
      const parents = work.parentWorkIds.flatMap((id) => byId.get(id) ?? []);

      if (kind === 'partialChapter') {
        const seen = new Set([work.id]);

        for (const parent of parents) {
          if (!seen.has(parent.id)) {
            seen.add(parent.id);
            parents.push(
              ...parent.parentWorkIds.flatMap((id) => byId.get(id) ?? [])
            );
          }
        }
      }

      const volumes =
        kind === 'volume' ? [work] : parents.filter((p) => p.kind === 'volume');
      const preferred = volumes.filter((v) => positions.has(v.id));
      const numbers = (preferred.length ? preferred : volumes)
        .map((v) => Number(v.numberLabel ?? v.number))
        .filter(Number.isFinite);
      if (numbers.length) volumeNumber = Math.trunc(Math.min(...numbers));
    }

    work.volumeNumber = volumeNumber;
  }
}
