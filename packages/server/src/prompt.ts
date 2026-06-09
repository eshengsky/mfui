import type { MFUIManifest } from '@mfui/protocol';

import { normalizeMFUIManifest } from './manifest.js';

export function buildComponentCatalogText(
  mfui: MFUIManifest,
): string {
  const components = normalizeMFUIManifest(mfui).components;

  if (components.length === 0) {
    return '';
  }

  return components
    .map((component) => {
      const lines = [
        `Component: ${component.name}`,
      ];

      if (component.model?.description) {
        lines.push(`Description: ${component.model.description}`);
      }

      if (component.model?.whenToUse) {
        lines.push(`When to use: ${component.model.whenToUse}`);
      }

      lines.push(`JSON Schema: ${JSON.stringify(component.schema)}`);

      if (component.model?.examples?.length) {
        lines.push(`Examples: ${JSON.stringify(component.model.examples)}`);
      }

      return lines.join('\n');
    })
    .join('\n\n');
}

export function buildLayoutCatalogText(
  mfui: MFUIManifest,
): string {
  const layouts = normalizeMFUIManifest(mfui).layouts ?? [];

  if (layouts.length === 0) {
    return '';
  }

  return layouts
    .map((layout) => {
      const lines = [
        `Layout: ${layout.name}`,
      ];

      if (layout.model?.description) {
        lines.push(`Description: ${layout.model.description}`);
      }

      if (layout.model?.whenToUse) {
        lines.push(`When to use: ${layout.model.whenToUse}`);
      }

      if (layout.name === 'mfui.columns') {
        lines.push(
          'Shape: {"layout":"mfui.columns","columns":[{"text":"portable text"},{"component":"component.name","spec":{}}]}',
        );
        lines.push(
          'Rules: columns must contain 2 or 3 cells. Each cell must be either {"text":"..."} or {"component":"component.name","spec":{}}. Component cells must use listed components and match their JSON Schema. Do not nest layouts.',
        );
      }

      if (layout.model?.examples?.length) {
        lines.push(`Examples: ${JSON.stringify(layout.model.examples)}`);
      }

      return lines.join('\n');
    })
    .join('\n\n');
}

export function createMFUIPrompt(mfui: MFUIManifest): string {
  const componentCatalogText = buildComponentCatalogText(mfui);
  const layoutCatalogText = buildLayoutCatalogText(mfui);
  const catalogText = [
    componentCatalogText,
    layoutCatalogText,
  ].filter(Boolean).join('\n\n');

  if (!catalogText) {
    return '';
  }

  return [
    catalogText,
    createBlockInstruction(),
  ].join('\n\n');
}

function createBlockInstruction(): string {
  return [
    'Write normal assistant prose as text.',
    'When a listed component is the better way to answer, insert an MFUI block.',
    'When a listed layout is the better way to arrange listed components or portable text, insert an MFUI layout block.',
    'An MFUI block must use exactly this shape:',
    '<mfui>',
    '{"component":"component.name","spec":{}}',
    'or',
    '{"layout":"layout.name","columns":[]}',
    '</mfui>',
    'Component specs must match the JSON Schema for that component.',
    'Do not wrap MFUI blocks in code fences.',
    'Do not explain MFUI blocks to the user.',
  ].join('\n');
}
