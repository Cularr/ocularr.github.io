import { JsonObject, JsonValue } from '../DemoTypes';
import { fieldResource, storedValues } from './fields';
import { definitions } from './registry';

export function specificationSchema(kind: string): JsonObject[] {
  return (definitions[kind] ?? []).map((definition) => ({
    id: 0,
    name: '',
    implementation: definition.implementation,
    implementationName: definition.implementationName,
    infoLink: definition.infoLink,
    negate: false,
    required: false,
    fields: definition.fields.map((field) => fieldResource(field, field.value)),
    presets: [],
  }));
}

export function specificationResource(
  kind: string,
  specification: JsonObject
): JsonObject {
  const definition = (definitions[kind] ?? []).find(
    (d) => d.implementation === specification.implementation
  );

  if (!definition) {
    return specification;
  }

  const values = storedValues(specification);

  return {
    id: 0,
    ...specification,
    implementationName: definition.implementationName,
    infoLink: definition.infoLink,
    fields: definition.fields.map((field) =>
      fieldResource(
        field,
        values.has(field.name)
          ? (values.get(field.name) as JsonValue)
          : field.value
      )
    ),
  };
}

export function prepareSpecification(specification: JsonObject): JsonObject {
  return {
    id: specification.id,
    name: specification.name,
    implementation: specification.implementation,
    negate: !!specification.negate,
    required: !!specification.required,
    fields: ((specification.fields ?? []) as JsonObject[]).map((field) => ({
      name: String(field.name),
      value: (field.value ?? null) as JsonValue,
    })),
  };
}
