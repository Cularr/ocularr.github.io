import { JsonObject, JsonValue } from '../DemoTypes';
import { ResponseError } from '../responseError';
import { DemoDb } from '../state/store';

export interface DemoRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: JsonValue | undefined;
}

export interface DemoResponse {
  status: number;
  body?: JsonValue;
}

type Handler = (
  db: DemoDb,
  request: DemoRequest,
  params: (string | undefined)[]
) => JsonValue | undefined;

export interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
  status?: number;
}

export const NOT_FOUND: DemoResponse = {
  status: 404,
  body: { message: 'NotFound', description: '' },
};

export const NOT_AVAILABLE: DemoResponse = {
  status: 405,
  body: {
    message: 'This action is not available in the demo',
    description: '',
  },
};

export function notAvailable(message: string): never {
  throw new ResponseError(405, { message, description: '' });
}

type SortValue = string | number | undefined;

function pageParameter(request: DemoRequest, key: string, fallback: number) {
  const value = request.query.get(key);

  if (value === null) {
    return fallback;
  }

  const number = Number(value);

  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1) {
    throw new ResponseError(400, {
      message: `${key} must be a positive integer`,
      description: '',
    });
  }

  return number;
}

export function paged<T>(
  request: DemoRequest,
  items: T[],
  map: (item: T) => JsonObject,
  sortValues: Record<string, (item: T) => SortValue>,
  defaultSortKey: string,
  defaultDirection: 'ascending' | 'descending' = 'descending'
): JsonObject {
  const page = pageParameter(request, 'page', 1);
  const pageSize = pageParameter(request, 'pageSize', 10);
  const start = (page - 1) * pageSize;
  const requestedKey = request.query.get('sortKey')?.toLowerCase();
  const sortKey =
    Object.keys(sortValues).find((key) => key.toLowerCase() === requestedKey) ??
    defaultSortKey;
  const requestedDirection = request.query.get('sortDirection')?.toLowerCase();
  const sortDirection =
    requestedDirection === 'ascending' || requestedDirection === 'descending'
      ? requestedDirection
      : defaultDirection;
  const valueOf = sortValues[sortKey];
  const sorted = items.map((item) => ({ item, value: valueOf(item) }));

  sorted.sort(({ value: a }, { value: b }) => {
    const order =
      typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a ?? '').localeCompare(String(b ?? ''), undefined, {
            numeric: true,
            sensitivity: 'base',
          });

    return sortDirection === 'ascending' ? order : -order;
  });

  return {
    page,
    pageSize,
    sortKey,
    sortDirection,
    totalRecords: items.length,
    records: sorted.slice(start, start + pageSize).map(({ item }) => map(item)),
  };
}

export function numberList(query: URLSearchParams, key: string) {
  return query
    .getAll(key)
    .flatMap((value) => value.split(','))
    .flatMap(validId);
}

export function objectBody(request: DemoRequest): JsonObject {
  const { body } = request;

  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as JsonObject)
    : {};
}

export function arrayBody(request: DemoRequest): JsonObject[] {
  return Array.isArray(request.body) ? (request.body as JsonObject[]) : [];
}

function validId(value: JsonValue | undefined) {
  const id =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0
    ? [id]
    : [];
}

export function idsFrom(body: JsonObject, key = 'ids') {
  const values = body[key];

  return Array.isArray(values) ? values.flatMap(validId) : [];
}

export function seriesSortTitle(db: DemoDb, seriesId: number) {
  return db.series
    .find((series) => series.id === seriesId)
    ?.title.toLowerCase()
    .replace(/^the /, '');
}
