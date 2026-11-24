import { renderItem } from '../collections/items';
import { GLOBAL_DELAY_PROFILE_ORDER } from '../constants';
import { JsonObject } from '../DemoTypes';
import { tagDetails } from '../operations/tags';
import { specificationSchema } from '../providers/specifications';
import { defaultQualityProfile } from '../qualities/profiles';
import { namingExamples, updateSettings } from '../settings';
import { DemoDb } from '../state/store';
import { arrayBody, objectBody, paged, Route } from './request';

function settingsResource(db: DemoDb, name: string) {
  return name === 'update' ? updateSettings(db.settings) : db.settings[name];
}

function saveSettings(db: DemoDb, name: string, body: JsonObject) {
  if (name === 'update') {
    const general = db.settings.general;

    db.settings.general = {
      ...general,
      branch: body.branch ?? general.branch,
      updateAutomatically:
        body.updateAutomatically ?? general.updateAutomatically,
      updateMechanism: body.updateMechanism ?? general.updateMechanism,
      updateScriptPath: body.updateScriptPath ?? general.updateScriptPath,
    };

    return updateSettings(db.settings);
  }

  if (!db.settings[name]) {
    return undefined;
  }

  const {
    password: _password,
    passwordConfirmation: _confirmation,
    ...rest
  } = body;

  db.settings[name] = { ...db.settings[name], ...rest, id: 1 };

  return db.settings[name];
}

export const settingsRoutes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/sourcecredit$/,
    handler: (db) => db.collections.sourcecredit,
  },
  {
    method: 'GET',
    pattern: /^\/settings\/naming\/examples$/,
    handler: (db, request) => namingExamples(db.settings.naming, request.query),
  },
  {
    method: 'GET',
    pattern: /^\/settings\/([a-z]+)(?:\/\d+)?$/,
    handler: (db, _request, [name = '']) => settingsResource(db, name),
  },
  {
    method: 'PUT',
    pattern: /^\/settings\/([a-z]+)(?:\/\d+)?$/,
    status: 202,
    handler: (db, request, [name = '']) =>
      saveSettings(db, name, objectBody(request)),
  },
  {
    method: 'PUT',
    pattern: /^\/qualitydefinition$/,
    status: 202,
    handler: (db, request) =>
      arrayBody(request).map((body) => {
        const definitions = db.collections.qualitydefinition;
        const index = definitions.findIndex((d) => d.id === body.id);

        if (index < 0) {
          return body;
        }

        definitions[index] = { ...definitions[index], ...body };

        return definitions[index];
      }),
  },
  {
    method: 'GET',
    pattern: /^\/qualityprofile\/schema$/,
    handler: (db) =>
      renderItem(
        db.collections,
        'qualityprofile',
        defaultQualityProfile(0, '', 'Unknown', [])
      ),
  },
  {
    method: 'GET',
    pattern: /^\/(customformat|autotagging)\/schema$/,
    handler: (_db, _request, [name = '']) => specificationSchema(name),
  },
  {
    method: 'PUT',
    pattern: /^\/delayprofile\/reorder\/(\d+)$/,
    handler: (db, request, [id]) => {
      const profiles = [...db.collections.delayprofile].sort(
        (a, b) => Number(a.order) - Number(b.order)
      );
      const moving = profiles.find((p) => p.id === Number(id));
      const after = Number(request.query.get('after') ?? 0);

      if (!moving || moving.order === GLOBAL_DELAY_PROFILE_ORDER) {
        return db.collections.delayprofile;
      }

      const others = profiles.filter(
        (p) => p !== moving && p.order !== GLOBAL_DELAY_PROFILE_ORDER
      );
      const index = after ? others.findIndex((p) => p.id === after) + 1 : 0;

      others.splice(index, 0, moving);
      others.forEach((profile, order) => {
        profile.order = order + 1;
      });

      return db.collections.delayprofile;
    },
  },
  {
    method: 'GET',
    pattern: /^\/tag\/detail$/,
    handler: (db) => db.collections.tag.map((tag) => tagDetails(db, tag)),
  },
  {
    method: 'GET',
    pattern: /^\/tag\/detail\/(\d+)$/,
    handler: (db, _request, [id]) => {
      const tag = db.collections.tag.find((t) => t.id === Number(id));

      return tag ? tagDetails(db, tag) : undefined;
    },
  },
  {
    method: 'GET',
    pattern: /^\/importlistexclusion(?:\/paged)?$/,
    handler: (db, request) =>
      paged(
        request,
        db.collections.importlistexclusion,
        (item) => item,
        {
          id: (item) => Number(item.id),
          title: (item) => String(item.title ?? ''),
          foreignSeriesId: (item) => String(item.foreignSeriesId ?? ''),
        },
        'id'
      ),
  },
];
