import { URL_BASE } from './constants';

const script = document.currentScript;

function assetPath(attribute: string, fallback: string) {
  return script?.getAttribute(attribute) ?? `${URL_BASE}/${fallback}`;
}

export const SERIES_PATH = assetPath('data-series', 'series.json');

export const PROVIDERS_PATH = assetPath('data-providers', 'providers.json');

export const LOCALIZATION_PATH = assetPath('data-localization', 'localization');
