import { ProviderDefinition, ProvidersFile } from '../DemoTypes';
import { translate } from '../translations';

export const PROVIDER_KINDS = [
  'indexer',
  'downloadclient',
  'importlist',
  'connection',
  'metadata',
];

export let definitions: ProvidersFile = {};

export function setProviders(file: ProvidersFile) {
  definitions = file;
}

export function providerKind(kind: string) {
  return kind === 'notification' ? 'connection' : kind;
}

export function definitionFor(kind: string, implementation: unknown) {
  return (definitions[providerKind(kind)] ?? []).find(
    (definition) => definition.implementation === implementation
  );
}

export function implementationName(definition: ProviderDefinition) {
  const key = definition.implementationNameKey;
  const translated = key
    ? translate(key, definition.implementationNameTokens)
    : undefined;

  return translated && translated !== key
    ? translated
    : definition.implementationName;
}
