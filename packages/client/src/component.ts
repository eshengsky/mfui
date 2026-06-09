import {
  renderProjection,
  type ComponentManifest,
  type ComponentModelHints,
  type JsonObject,
  type JsonSchema,
  type Projection,
  type ProjectionTemplates,
  type ValidationResult,
} from '@mfui/protocol';
import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export type ComponentSchema<TSpec> = ZodTypeAny | JsonSchema;

export type DefineMFUIComponentInput<TSpec> = {
  name: string;
  schema: ComponentSchema<TSpec>;
  jsonSchema?: JsonSchema;
  projection: ProjectionTemplates;
  model?: ComponentModelHints;
  metadata?: JsonObject;
};

export type MFUIComponentDefinition<TSpec = unknown> = {
  name: string;
  manifest: ComponentManifest;
  project(spec: TSpec): Projection;
  validate(spec: unknown): ValidationResult;
  toManifest(): ComponentManifest;
};

export function defineMFUIComponent<TSpec>(
  input: DefineMFUIComponentInput<TSpec>,
): MFUIComponentDefinition<TSpec> {
  const schema = normalizeSchema(input);
  const manifest: ComponentManifest = {
    name: input.name,
    schema,
    projection: input.projection,
    ...(input.model ? { model: input.model } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  return {
    name: input.name,
    manifest,
    project(spec) {
      return renderProjection(input.projection, spec);
    },
    validate(spec) {
      if (isZodSchema(input.schema)) {
        const result = input.schema.safeParse(spec);
        if (!result.success) {
          return {
            ok: false,
            errors: result.error.issues.map((issue) => issue.message),
          };
        }
        return { ok: true };
      }

      return {
        ok: false,
        errors: [
          'Runtime validation for JSON Schema manifests belongs in @mfui/server. Use a Zod schema for local @mfui/client validation.',
        ],
      };
    },
    toManifest() {
      return manifest;
    },
  };
}

export function isMFUIComponentDefinition(
  value: unknown,
): value is MFUIComponentDefinition {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'manifest' in value &&
      'project' in value &&
      'toManifest' in value,
    );
}

function normalizeSchema<TSpec>(input: DefineMFUIComponentInput<TSpec>): JsonSchema {
  if (input.jsonSchema) {
    return input.jsonSchema;
  }

  if (isZodSchema(input.schema)) {
    return zodToJsonSchema(input.schema, {
      name: input.name,
      target: 'jsonSchema7',
      $refStrategy: 'none',
    }) as JsonSchema;
  }

  return input.schema;
}

function isZodSchema(value: unknown): value is ZodTypeAny {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'safeParse' in value &&
      typeof (value as { safeParse?: unknown }).safeParse === 'function',
  );
}
