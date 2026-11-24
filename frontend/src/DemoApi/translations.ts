import { LOCALIZATION_PATH } from './assetPaths';
import { languageFiles } from './languages';

type Dictionary = Record<string, string>;

const files = new Map<string, Promise<Dictionary>>();

const merged = new Map<number, Promise<Dictionary>>();

let current: Dictionary = {};
let latest = Promise.resolve(current);

function loadFile(fetcher: typeof fetch, name: string) {
  let file = files.get(name);

  if (!file) {
    file = fetcher(`${LOCALIZATION_PATH}/${name}.json`)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<Dictionary>)
          : Promise.reject(new Error(response.statusText))
      )
      .catch((error: unknown) => {
        files.delete(name);

        throw error;
      });

    files.set(name, file);
  }

  return file;
}

export function loadTranslations(fetcher: typeof fetch, languageId: number) {
  let dictionary = merged.get(languageId);

  if (!dictionary) {
    let failed = false;

    dictionary = Promise.all(
      languageFiles(languageId).map((name) =>
        loadFile(fetcher, name).catch(() => {
          failed = true;

          return {};
        })
      )
    ).then((parts) => {
      if (failed) {
        merged.delete(languageId);
      }

      return Object.assign({}, ...parts) as Dictionary;
    });

    merged.set(languageId, dictionary);
  }

  const requested = dictionary;

  latest = requested;

  return requested.then(async (result) => {
    let pending = requested;

    while (pending !== latest) {
      pending = latest;
      result = await pending;
    }

    current = result;

    return result;
  });
}

export function translate(
  key: string | undefined,
  tokens: Record<string, string | number> = {}
) {
  if (!key) {
    return key;
  }

  const values: Record<string, string | number> = {
    appName: 'Ocularr',
    ...tokens,
  };

  return (current[key] ?? key).replace(
    /\{([a-z0-9]+?)\}/gi,
    (match, token: string) => String(values[token] ?? match)
  );
}
