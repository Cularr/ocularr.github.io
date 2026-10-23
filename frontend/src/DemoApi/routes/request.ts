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
  params: string[]
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

export function paged<T>(
  request: DemoRequest,
  items: T[],
  map: (item: T) => JsonObject
): JsonObject {
  const page = Math.max(1, Number(request.query.get('page') ?? 1));
  const pageSize = Math.max(1, Number(request.query.get('pageSize') ?? 20));
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    sortKey: request.query.get('sortKey') ?? '',
    sortDirection: request.query.get('sortDirection') ?? 'descending',
    totalRecords: items.length,
    records: items.slice(start, start + pageSize).map(map),
  };
}

export function numberList(query: URLSearchParams, key: string) {
  return query
    .getAll(key)
    .flatMap((value) => value.split(','))
    .filter(Boolean)
    .map(Number);
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

export function idsFrom(body: JsonObject, key = 'ids') {
  return ((body[key] ?? []) as number[]).map(Number);
}
