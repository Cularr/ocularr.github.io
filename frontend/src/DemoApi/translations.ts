import { LOCALIZATION_PATH } from './assetPaths';
import { languageFiles } from './languages';

type Dictionary = Record<string, string>;

const files = new Map<string, Promise<Dictionary>>();

const merged = new Map<number, Promise<Dictionary>>();

let current: Dictionary = {};

function loadFile(fetcher: typeof fetch, name: string) {
  let file = files.get(name);

  if (!file) {
    file = fetcher(`${LOCALIZATION_PATH}/${name}.json`)
      .then((response) =>
        response.ok ? (response.json() as Promise<Dictionary>) : {}
      )
      .catch(() => ({}));

    files.set(name, file);
  }

  return file;
}

export function loadTranslations(fetcher: typeof fetch, languageId: number) {
  let dictionary = merged.get(languageId);

  if (!dictionary) {
    dictionary = Promise.all(
      languageFiles(languageId).map((name) => loadFile(fetcher, name))
    ).then((parts) => Object.assign({}, ...parts) as Dictionary);

    merged.set(languageId, dictionary);
  }

  return dictionary.then((result) => {
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
    appName: 'Sonarr',
    ...tokens,
  };

  return (current[key] ?? key).replace(
    /\{([a-z0-9]+?)\}/gi,
    (match, token: string) => String(values[token] ?? match)
  );
}
