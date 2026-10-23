import { ResponseError } from '../responseError';
import { DemoDb } from '../state/store';
import { activityRoutes } from './activity';
import { collectionRoute } from './collections';
import { episodeRoutes } from './episodes';
import {
  DemoRequest,
  DemoResponse,
  NOT_AVAILABLE,
  NOT_FOUND,
  Route,
} from './request';
import { searchRoutes } from './search';
import { seriesRoutes } from './series';
import { settingsRoutes } from './settings';
import { systemRoutes } from './system';

const routes: Route[] = [
  ...seriesRoutes,
  ...episodeRoutes,
  ...activityRoutes,
  ...searchRoutes,
  ...settingsRoutes,
  ...systemRoutes,
];

export function handleRequest(
  db: DemoDb,
  originalRequest: DemoRequest
): DemoResponse {
  const request = {
    ...originalRequest,
    path: originalRequest.path.toLowerCase(),
  };

  try {
    for (const route of routes) {
      const match =
        route.method === request.method
          ? route.pattern.exec(request.path)
          : null;

      if (match) {
        const body = route.handler(db, request, match.slice(1));

        return body === undefined
          ? NOT_FOUND
          : { status: route.status ?? 200, body };
      }
    }

    return (
      collectionRoute(db, request) ??
      (request.method === 'GET' ? NOT_FOUND : NOT_AVAILABLE)
    );
  } catch (error) {
    if (error instanceof ResponseError) {
      return { status: error.status, body: error.body };
    }

    throw error;
  }
}
