import { Ajv, type ErrorObject } from 'ajv/dist/ajv.js';
import {
  type ComponentManifest,
  type MFUIManifest,
  type ProjectionTemplates,
  type ValidationResult,
} from '@mfui/protocol';

import { createMFUIServerError } from './error.js';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

export function validateMFUIManifest(
  mfui: MFUIManifest,
): ValidationResult {
  const manifestErrors = validateMFUIManifestShape(mfui);
  if (manifestErrors.length) {
    return { ok: false, errors: manifestErrors };
  }

  const components = mfui.components;
  const errors = components.flatMap((component, index) =>
    validateComponentManifest(component, index),
  );
  const layouts = mfui.layouts ?? [];

  errors.push(
    ...layouts.flatMap((layout, index) =>
      validateLayoutManifest(layout, index),
    ),
  );

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function assertValidMFUIManifest(mfui: MFUIManifest): void {
  const result = validateMFUIManifest(mfui);
  if (!result.ok) {
    throw createMFUIServerError(
      'invalid_component_manifest',
      result.errors.join('; '),
    );
  }
}

export function validateSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): ValidationResult {
  return compileSchema(manifest)(spec);
}

function validateMFUIManifestShape(mfui: MFUIManifest): string[] {
  if (!mfui || typeof mfui !== 'object') {
    return ['mfui must be an object'];
  }

  if (!Array.isArray(mfui.components)) {
    return ['mfui.components must be an array'];
  }

  if (mfui.layouts !== undefined && !Array.isArray(mfui.layouts)) {
    return ['mfui.layouts must be an array'];
  }

  return [];
}

function validateComponentManifest(
  component: ComponentManifest,
  index: number,
): string[] {
  const prefix = `mfui.components[${index}]`;
  const errors: string[] = [];

  if (!component || typeof component !== 'object') {
    return [`${prefix} must be an object`];
  }

  if (!component.name || typeof component.name !== 'string') {
    errors.push(`${prefix}.name must be a string`);
  }

  if (!component.schema || typeof component.schema !== 'object') {
    errors.push(`${prefix}.schema must be an object`);
  }

  errors.push(...validateProjectionTemplates(component.projection, prefix));

  return errors;
}

function validateLayoutManifest(
  layout: unknown,
  index: number,
): string[] {
  const prefix = `mfui.layouts[${index}]`;

  if (!layout || typeof layout !== 'object') {
    return [`${prefix} must be an object`];
  }

  if (
    !('name' in layout) ||
    typeof (layout as { name?: unknown }).name !== 'string'
  ) {
    return [`${prefix}.name must be a string`];
  }

  return [];
}

function validateProjectionTemplates(
  projection: ProjectionTemplates,
  prefix: string,
): string[] {
  const errors: string[] = [];

  if (!projection || typeof projection !== 'object') {
    return [`${prefix}.projection must be an object`];
  }

  if (typeof projection.text !== 'string') {
    errors.push(`${prefix}.projection.text must be a string`);
  }

  return errors;
}

function compileSchema(
  manifest: ComponentManifest,
): (value: unknown) => ValidationResult {
  const validate = ajv.compile(manifest.schema);

  return (value) => {
    if (validate(value)) {
      return { ok: true };
    }

    return {
      ok: false,
      errors: formatAjvErrors(validate.errors),
    };
  };
}

function formatAjvErrors(
  errors: ErrorObject[] | null | undefined,
): string[] {
  if (!errors?.length) {
    return ['Invalid component spec'];
  }

  return errors.map((error) => {
    const path = error.instancePath || '/';
    return `${path} ${error.message ?? 'is invalid'}`;
  });
}
