import { Liquid } from 'liquidjs';

import type { Projection, ProjectionTemplates } from './types.js';

const allowedTags = new Set([
  'for',
  'endfor',
  'if',
  'endif',
  'unless',
  'endunless',
  'else',
  'elsif',
]);

const allowedFilters = new Set([
  'default',
  'join',
  'truncate',
  'escapeMarkdown',
  'strip',
  'size',
]);

let engine: Liquid | undefined;

export type TemplateRenderOptions = {
  validateSubset?: boolean;
};

export function renderProjection(
  templates: ProjectionTemplates,
  data: unknown,
  options: TemplateRenderOptions = {},
): Projection {
  return {
    text: renderSemanticTemplate(templates.text, data, options),
  };
}

export function renderSemanticTemplate(
  template: string,
  data: unknown,
  options: TemplateRenderOptions = {},
): string {
  if (options.validateSubset ?? true) {
    validateSemanticTemplate(template);
  }

  return getTemplateEngine().parseAndRenderSync(template, data as object);
}

export function validateSemanticTemplate(template: string): void {
  for (const tag of findLiquidTags(template)) {
    if (!allowedTags.has(tag)) {
      throw new Error(`Unsupported MFUI template tag: ${tag}`);
    }
  }

  for (const filter of findLiquidFilters(template)) {
    if (!allowedFilters.has(filter)) {
      throw new Error(`Unsupported MFUI template filter: ${filter}`);
    }
  }
}

function getTemplateEngine(): Liquid {
  engine ??= createTemplateEngine();
  return engine;
}

function createTemplateEngine(): Liquid {
  const liquid = new Liquid({
    strictFilters: true,
    strictVariables: false,
    greedy: false,
    trimTagRight: false,
    trimTagLeft: false,
    trimOutputRight: false,
    trimOutputLeft: false,
  });

  liquid.registerFilter('escapeMarkdown', (value: unknown) =>
    escapeMarkdown(String(value ?? '')),
  );

  return liquid;
}

function findLiquidTags(template: string): string[] {
  return Array.from(template.matchAll(/{%\s*([a-zA-Z_][\w-]*)/g), (match) =>
    String(match[1]),
  );
}

function findLiquidFilters(template: string): string[] {
  const filters: string[] = [];
  const outputBlocks = template.matchAll(/{{([\s\S]*?)}}/g);

  for (const block of outputBlocks) {
    const expression = String(block[1] ?? '');
    const parts = expression.split('|').slice(1);

    for (const part of parts) {
      const filter = part.trim().match(/^([a-zA-Z_][\w-]*)/)?.[1];
      if (filter) {
        filters.push(filter);
      }
    }
  }

  return filters;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}
