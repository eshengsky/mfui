import type { MFUIManifest } from '@mfui/protocol';

import { createMFUIServerError } from './error.js';

export function normalizeMFUIManifest(mfui: MFUIManifest): MFUIManifest {
  const value = mfui as MFUIManifest | null | undefined;

  if (value == null) {
    return { components: [] };
  }

  if (!Array.isArray(value.components)) {
    throw createMFUIServerError(
      'invalid_component_manifest',
      'mfui.components must be an array.',
    );
  }

  if (
    value.layouts !== undefined &&
    !Array.isArray(value.layouts)
  ) {
    throw createMFUIServerError(
      'invalid_layout_manifest',
      'mfui.layouts must be an array.',
    );
  }

  return {
    components: value.components,
    ...(value.layouts ? { layouts: value.layouts } : {}),
  };
}
