import { JsonValue } from '../DemoTypes';
import { handleRequest } from '../routes/index';
import { DemoDb } from '../state/store';
import { loadTranslations } from '../translations';
import { negotiate, poll, receive } from './signalR';

const LATENCY = 60;

export const nativeFetch = window.fetch.bind(window);

export interface InterceptedResponse {
  status: number;
  contentType: string;
  body: string;
}

function parseBody(body: unknown): JsonValue | undefined {
  if (typeof body !== 'string' || !body) {
    return undefined;
  }

  try {
    return JSON.parse(body) as JsonValue;
  } catch {
    return undefined;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function json(status: number, body: unknown): InterceptedResponse {
  return {
    status,
    contentType: 'application/json',
    body:
      body === undefined
        ? ''
        : JSON.stringify(body, (_key, value: unknown) =>
            value === null ? undefined : value
          ),
  };
}

export function createResolver(
  dbReady: Promise<DemoDb>,
  urlBase: string,
  config: (db: DemoDb) => object,
  onChange: () => void
) {
  return async function resolve(
    method: string,
    url: URL,
    body: unknown,
    signal?: AbortSignal | null
  ): Promise<InterceptedResponse | 'passthrough' | 'blocked'> {
    const path = url.pathname.startsWith(urlBase)
      ? url.pathname.slice(urlBase.length)
      : url.pathname;

    if (url.origin !== window.location.origin) {
      return 'blocked';
    }

    if (path === '/initialize.json') {
      return json(200, config(await dbReady));
    }

    if (path.startsWith('/signalr/messages')) {
      if (path.endsWith('/negotiate')) {
        return json(200, negotiate());
      }

      if (method === 'GET') {
        const text = await poll(signal);

        return { status: 200, contentType: 'text/plain', body: text };
      }

      if (method === 'POST') {
        receive(typeof body === 'string' ? body : '');
      }

      return { status: 200, contentType: 'text/plain', body: '' };
    }

    const apiMatch = /^\/api\/v\d+(\/.*)$/.exec(path);

    if (!apiMatch) {
      return method === 'GET' || method === 'HEAD'
        ? 'passthrough'
        : json(405, { message: 'Not available in the demo', description: '' });
    }

    const apiPath = apiMatch[1].replace(/\/$/, '');
    const isLocalization =
      method === 'GET' && /^\/localization(\/\d+)?$/i.test(apiPath);
    const [db] = await Promise.all([
      dbReady,
      delay(isLocalization ? 0 : LATENCY),
    ]);
    const strings = await loadTranslations(
      nativeFetch,
      Number(db.settings.ui.uiLanguage ?? 1)
    );

    if (isLocalization) {
      return json(200, { id: 1, strings });
    }

    const response = (() => {
      try {
        return handleRequest(db, {
          method,
          path: apiPath,
          query: url.searchParams,
          body: parseBody(body),
        });
      } catch (error) {
        return {
          status: 500,
          body: {
            message: error instanceof Error ? error.message : 'Demo error',
            description: '',
          },
        };
      }
    })();

    if (method !== 'GET') {
      onChange();
    }

    return json(response.status, response.body);
  };
}

export type Resolver = ReturnType<typeof createResolver>;

export function installFetch(resolve: Resolver) {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(
      request ? request.url : String(input),
      window.location.href
    );
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const body = init?.body ?? (request ? await request.clone().text() : null);
    const result = await resolve(method, url, body, init?.signal);

    if (result === 'blocked') {
      throw new TypeError('Network access is disabled in the demo');
    }

    if (result === 'passthrough') {
      return nativeFetch(input, init);
    }

    return new Response(result.status === 204 ? null : result.body, {
      status: result.status,
      headers: { 'Content-Type': result.contentType },
    });
  };
}
