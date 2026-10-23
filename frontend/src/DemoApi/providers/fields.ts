import { JsonObject, JsonValue, ProviderField } from '../DemoTypes';
import { translate } from '../translations';

export const PRIVATE_VALUE = '********';

export function isPrivate(field: ProviderField) {
  return field.privacy === 'apiKey' || field.privacy === 'password';
}

export function fieldResource(
  field: ProviderField,
  value: JsonValue
): JsonObject {
  return {
    order: field.order,
    name: field.name,
    label: translate(field.label, field.labelTokens) ?? '',
    unit: field.unit,
    helpText: translate(field.helpText, field.helpTextTokens),
    helpTextWarning: translate(
      field.helpTextWarning,
      field.helpTextWarningTokens
    ),
    helpLink: field.helpLink,
    value:
      isPrivate(field) && value !== '' && value !== null
        ? PRIVATE_VALUE
        : value,
    type: field.type,
    advanced: field.advanced,
    selectOptions: field.selectOptions?.map((option) => ({
      ...option,
      name: translate(option.name) ?? option.name,
    })),
    selectOptionsProviderAction: field.selectOptionsProviderAction,
    section: field.section,
    hidden: field.hidden,
    privacy: field.privacy,
    placeholder: field.placeholder,
    isFloat: field.isFloat,
  };
}

export function storedValues(item: JsonObject) {
  const values = new Map<string, JsonValue>();

  ((item.fields ?? []) as JsonObject[]).forEach((field) => {
    values.set(String(field.name), (field.value ?? null) as JsonValue);
  });

  return values;
}
