import {
  getComponentManifest,
  getLayoutManifest,
  type ComponentManifestInput,
  type LayoutManifestInput,
  type MFUIManifest,
} from '@mfui/protocol';

export type { MFUIManifest };

export type CreateMFUIManifestInput = {
  components: readonly ComponentManifestInput[];
  layouts?: readonly LayoutManifestInput[];
};

export function createMFUIManifest(
  input: CreateMFUIManifestInput,
): MFUIManifest {
  return {
    components: input.components.map((component) =>
      getComponentManifest(component),
    ),
    ...(input.layouts
      ? {
          layouts: input.layouts.map((layout) => getLayoutManifest(layout)),
        }
      : {}),
  };
}
