import {
  getComponentManifest,
  projectSpecWithManifest,
  type ComponentManifestInput,
} from './component.js';
import type {
  ComponentManifest,
  ComponentPart,
  ColumnCell,
  LayoutPart,
  MessageIR,
  ProjectedColumnCell,
  ProjectedComponentPart,
  ProjectedLayoutPart,
  ProjectedMessage,
  ProjectedMessagePart,
  TextPart,
} from './types.js';

export type ProjectMessageOptions = {
  components: ComponentManifestInput[];
};

export function projectMessage<TSpec = unknown>(
  message: MessageIR<TSpec>,
  options: ProjectMessageOptions,
): ProjectedMessage<TSpec> {
  const components = createManifestMap(options.components);
  const parts = message.parts.map((part) =>
    projectMessagePart(part, components),
  );

  return {
    ...message,
    parts,
    portableText: messageToPortableText(parts),
  };
}

export function messageToPortableText(
  partsOrMessage: ProjectedMessagePart[] | ProjectedMessage,
): string {
  const parts = Array.isArray(partsOrMessage) ? partsOrMessage : partsOrMessage.parts;
  return joinText(
    parts.map((part) =>
      part.type === 'text' ? part.content : part.projection.text,
    ),
  );
}

function projectMessagePart<TSpec>(
  part: MessageIR<TSpec>['parts'][number],
  manifests: Map<string, ComponentManifest>,
): ProjectedMessagePart<TSpec> {
  if (part.type === 'text') {
    return part;
  }

  if (part.type === 'layout') {
    return projectLayoutPart(part, manifests);
  }

  return projectComponentPart(part, manifests);
}

function projectComponentPart<TSpec>(
  part: ComponentPart<TSpec>,
  manifests: Map<string, ComponentManifest>,
): ProjectedComponentPart<TSpec> {
  const manifest = manifests.get(part.component);

  if (!manifest) {
    throw new Error(
      `No component manifest registered for ${part.component}`,
    );
  }

  return {
    ...part,
    projection: part.projection ?? projectSpecWithManifest(manifest, part.spec),
  };
}

function projectLayoutPart<TSpec>(
  part: LayoutPart<TSpec>,
  manifests: Map<string, ComponentManifest>,
): ProjectedLayoutPart<TSpec> {
  const columns = part.columns.map((column) =>
    projectColumnCell(column, manifests),
  );

  return {
    ...part,
    columns,
    projection: part.projection ?? {
      text: messageToPortableText(columns),
    },
  };
}

function projectColumnCell<TSpec>(
  cell: ColumnCell<TSpec>,
  manifests: Map<string, ComponentManifest>,
): ProjectedColumnCell<TSpec> {
  return cell.type === 'text' ? cell : projectComponentPart(cell, manifests);
}

function createManifestMap(
  components: ComponentManifestInput[],
): Map<string, ComponentManifest> {
  return new Map(
    components.map((component) => {
      const manifest = getComponentManifest(component);
      return [manifest.name, manifest];
    }),
  );
}

function joinText(chunks: string[]): string {
  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .join('\n\n');
}

export function createTextPart(
  content: string,
  options: { id?: string } = {},
): TextPart {
  return {
    id: options.id ?? createId('txt'),
    type: 'text',
    content,
  };
}

export function createComponentPart<TSpec>(
  component: string,
  spec: TSpec,
  options: { id?: string } = {},
): ComponentPart<TSpec> {
  return {
    id: options.id ?? createId('cmp'),
    type: 'component',
    component,
    spec,
  };
}

export function createColumnsLayoutPart<TSpec>(
  columns: Array<ColumnCell<TSpec>>,
  options: { id?: string } = {},
): LayoutPart<TSpec> {
  return {
    id: options.id ?? createId('lay'),
    type: 'layout',
    layout: 'mfui.columns',
    columns,
  };
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
