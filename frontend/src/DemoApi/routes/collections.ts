import {
  collectionName,
  prepareItem,
  renderItem,
  validateItem,
} from '../collections/items';
import { GLOBAL_DELAY_PROFILE_ORDER } from '../constants';
import { JsonObject } from '../DemoTypes';
import { applyTags, removeTag } from '../operations/tags';
import { providerAction } from '../providers/actions';
import { providerSchema } from '../providers/providers';
import { PROVIDER_KINDS } from '../providers/registry';
import { DemoDb } from '../state/store';
import { broadcast } from '../transport/signalR';
import {
  DemoRequest,
  DemoResponse,
  idsFrom,
  notAvailable,
  objectBody,
} from './request';

const BULK_PROTECTED_KEYS = [
  'id',
  'name',
  'fields',
  'implementation',
  'configContract',
  'ids',
  'tags',
  'applyTags',
];

interface CollectionContext {
  db: DemoDb;
  name: string;
  items: JsonObject[];
  sub: string;
  id: number | null;
  body: JsonObject;
  render: (item: JsonObject) => JsonObject;
}

function ok(body: JsonObject | JsonObject[], status = 200): DemoResponse {
  return { status, body };
}

function conflict(message: string): DemoResponse {
  return { status: 409, body: { message, description: '' } };
}

function handleGet({ name, items, sub, id, render }: CollectionContext) {
  if (!sub) {
    return ok(items.map(render));
  }

  if (sub === 'schema' && PROVIDER_KINDS.includes(name)) {
    return ok(providerSchema(name));
  }

  const item = items.find((i) => i.id === id);

  return item ? ok(render(item)) : null;
}

function handlePost({ name, items, sub, body, render }: CollectionContext) {
  if (sub === 'testall') {
    return ok(
      items.map((item) => ({
        id: item.id,
        isValid: true,
        validationFailures: [],
      }))
    );
  }

  if (sub.startsWith('action/')) {
    const result = providerAction(sub.slice('action/'.length));

    return result
      ? ok(result)
      : notAvailable(
          'Signing in to external services is not available in the demo'
        );
  }

  const failures = validateItem(name, body);

  if (failures.length) {
    return { status: 400, body: failures };
  }

  if (sub === 'test') {
    return ok({});
  }

  if (sub) {
    return null;
  }

  const item: JsonObject = {
    ...prepareItem(name, body),
    id: Math.max(0, ...items.map((i) => Number(i.id))) + 1,
  };

  if (name === 'delayprofile') {
    item.order =
      items.filter((i) => i.order !== GLOBAL_DELAY_PROFILE_ORDER).length + 1;
  }

  items.push(item);

  if (name === 'tag') {
    broadcast('tag', 'sync');
  }

  return ok(render(item), 201);
}

function handleBulkPut({ items, body, render }: CollectionContext) {
  const ids = idsFrom(body);
  const { tags, applyTags: mode } = body;

  return ok(
    items
      .filter((item) => ids.includes(Number(item.id)))
      .map((item) => {
        Object.entries(body)
          .filter(
            ([key, value]) =>
              !BULK_PROTECTED_KEYS.includes(key) &&
              key in item &&
              value !== undefined &&
              value !== null
          )
          .forEach(([key, value]) => {
            item[key] = value;
          });

        if (Array.isArray(tags)) {
          item.tags = applyTags(
            (item.tags ?? []) as number[],
            (tags as number[]).map(Number),
            mode
          );
        }

        return render(item);
      }),
    202
  );
}

function handlePut(context: CollectionContext) {
  const { name, items, sub, id, body, render } = context;

  if (sub === 'bulk') {
    return handleBulkPut(context);
  }

  const targetId = id ?? Number(body.id);
  const index = items.findIndex((item) => item.id === targetId);

  if (index < 0 || (sub && id === null)) {
    return null;
  }

  const failures = validateItem(name, body);

  if (failures.length) {
    return { status: 400, body: failures };
  }

  items[index] = { ...prepareItem(name, body, items[index]), id: targetId };

  if (name === 'tag') {
    broadcast('tag', 'sync');
  }

  return ok(render(items[index]), 202);
}

function deleteBlocker(db: DemoDb, name: string, item: JsonObject) {
  if (
    name === 'qualityprofile' &&
    db.series.some((series) => series.qualityProfileId === item.id)
  ) {
    return conflict(`Profile [${String(item.name)}] is in use`);
  }

  if (name === 'delayprofile' && item.order === GLOBAL_DELAY_PROFILE_ORDER) {
    return notAvailable('The global delay profile cannot be deleted');
  }

  return null;
}

function handleDelete({ db, name, items, sub, id, body }: CollectionContext) {
  if (sub !== 'bulk' && id === null) {
    return null;
  }

  const ids = id === null ? idsFrom(body) : [id];
  const targets = items.filter((item) => ids.includes(Number(item.id)));
  const blocked = targets
    .map((item) => deleteBlocker(db, name, item))
    .find((response) => response !== null);

  if (blocked) {
    return blocked;
  }

  db.collections[name] = items.filter((item) => !targets.includes(item));

  if (name === 'tag') {
    ids.forEach((tagId) => removeTag(db, tagId));
    broadcast('tag', 'sync');
  }

  return ok({});
}

const HANDLERS: Record<
  string,
  (context: CollectionContext) => DemoResponse | null
> = {
  GET: handleGet,
  POST: handlePost,
  PUT: handlePut,
  DELETE: handleDelete,
};

export function collectionRoute(
  db: DemoDb,
  request: DemoRequest
): DemoResponse | null {
  const match =
    /^\/([a-z]+)(?:\/(schema|bulk|test|testall|action\/[a-z0-9]+|\d+))?$/.exec(
      request.path
    );
  const name = match ? collectionName(match[1]) : null;
  const handler = HANDLERS[request.method];

  if (!match || !name || !handler) {
    return null;
  }

  const sub = match[2] ?? '';

  return handler({
    db,
    name,
    items: db.collections[name],
    sub,
    id: /^\d+$/.test(sub) ? Number(sub) : null,
    body: objectBody(request),
    render: (item) => renderItem(db.collections, name, item),
  });
}
