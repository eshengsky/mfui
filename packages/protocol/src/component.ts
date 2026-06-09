import { renderProjection } from './projection.js';
import type {
  ComponentManifest,
  Projection,
} from './types.js';

export type ComponentManifestProvider = {
  toManifest(): ComponentManifest;
};

export type ComponentManifestInput = ComponentManifest | ComponentManifestProvider;

export function isComponentManifestProvider(
  value: unknown,
): value is ComponentManifestProvider {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'toManifest' in value &&
      typeof (value as { toManifest?: unknown }).toManifest === 'function',
  );
}

export function getComponentManifest(
  component: ComponentManifestInput,
): ComponentManifest {
  return isComponentManifestProvider(component) ? component.toManifest() : component;
}

export function projectSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): Projection {
  return renderProjection(manifest.projection, spec);
}

export type ComponentRegistry = {
  register(component: ComponentManifestInput): ComponentRegistry;
  get(name: string): ComponentManifest | undefined;
  has(name: string): boolean;
  manifests(): ComponentManifest[];
};

export function createComponentRegistry(
  components: ComponentManifestInput[] = [],
): ComponentRegistry {
  const componentMap = new Map<string, ComponentManifest>();
  const registry: ComponentRegistry = {
    register(component) {
      const manifest = getComponentManifest(component);
      componentMap.set(manifest.name, manifest);
      return registry;
    },
    get(name) {
      return componentMap.get(name);
    },
    has(name) {
      return componentMap.has(name);
    },
    manifests() {
      return Array.from(componentMap.values());
    },
  };

  for (const component of components) {
    registry.register(component);
  }
  return registry;
}
