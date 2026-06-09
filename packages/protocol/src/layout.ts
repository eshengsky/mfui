import type { LayoutManifest } from './types.js';

export type LayoutManifestProvider = {
  toManifest(): LayoutManifest;
};

export type LayoutManifestInput = LayoutManifest | LayoutManifestProvider;

export function isLayoutManifestProvider(
  value: unknown,
): value is LayoutManifestProvider {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'toManifest' in value &&
      typeof (value as { toManifest?: unknown }).toManifest === 'function',
  );
}

export function getLayoutManifest(
  layout: LayoutManifestInput,
): LayoutManifest {
  return isLayoutManifestProvider(layout) ? layout.toManifest() : layout;
}
