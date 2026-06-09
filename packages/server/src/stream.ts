import {
  encodeSseEvent,
  messageToPortableText,
  projectSpecWithManifest,
  type JsonObject,
  type MFUIManifest,
  type MessageEndEvent,
  type ProjectedColumnCell,
  type ProjectedComponentPart,
  type ProjectedLayoutPart,
  type ProjectedMessage,
  type ProjectedMessagePart,
  type SemanticStreamEvent,
  type TextPart,
} from '@mfui/protocol';

import { createMFUIServerError } from './error.js';
import { normalizeMFUIManifest } from './manifest.js';
import { validateSpecWithManifest } from './validate.js';

export type MFUIComponentInput = {
  id?: string;
  component: string;
  spec: unknown;
  metadata?: JsonObject;
};

export type MFUITextColumnInput = {
  id?: string;
  text: string;
  metadata?: JsonObject;
};

export type MFUIComponentColumnInput = MFUIComponentInput;

export type MFUIColumnInput =
  | MFUITextColumnInput
  | MFUIComponentColumnInput;

export type MFUILayoutInput = {
  id?: string;
  layout: string;
  columns: MFUIColumnInput[];
  metadata?: JsonObject;
};

export type MFUIStreamWriterOptions = {
  id?: string;
};

export type MFUIStreamWriterEndOptions = {
  usage?: MessageEndEvent['usage'];
};

export type MFUIStreamErrorInput = {
  code: string;
  message: string;
  recoverable?: boolean;
};

export type MFUIStreamWriter = {
  start(): void;
  text(text: string, options?: { partId?: string }): void;
  component(input: MFUIComponentInput): ProjectedComponentPart;
  layout(input: MFUILayoutInput): ProjectedLayoutPart;
  error(input: MFUIStreamErrorInput): void;
  end(options?: MFUIStreamWriterEndOptions): void;
  response(init?: ResponseInit): Response;
  snapshot(): ProjectedMessage | undefined;
};

export function createMFUIStreamWriter(
  mfui: MFUIManifest,
  options: MFUIStreamWriterOptions = {},
): MFUIStreamWriter {
  const normalizedMFUI = normalizeMFUIManifest(mfui);
  const encoder = new TextEncoder();
  const id = options.id ?? createId('msg');
  const parts: ProjectedMessagePart[] = [];
  const pending: Uint8Array[] = [];

  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let started = false;
  let closed = false;
  let closeWhenReady = false;
  let currentTextPartId: string | undefined;
  const stream = createStream();

  function createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(nextController) {
        controller = nextController;
        flushPending();

        if (closeWhenReady) {
          closeStream();
        }
      },
    });
  }

  function start(): void {
    if (started || closed) {
      return;
    }

    started = true;
    emit({
      type: 'message.start',
      id,
    });
  }

  function text(content: string, textOptions: { partId?: string } = {}): void {
    if (!content) {
      return;
    }

    ensureOpen();
    start();

    const partId = textOptions.partId ?? currentTextPartId ?? createId('txt');
    const existing = parts.find(
      (part) => part.type === 'text' && part.id === partId,
    );

    if (existing?.type === 'text') {
      existing.content += content;
    } else {
      parts.push({
        id: partId,
        type: 'text',
        content,
      });
    }

    currentTextPartId = partId;
    emit({
      type: 'text.delta',
      partId,
      text: content,
    });
  }

  function component(input: MFUIComponentInput): ProjectedComponentPart {
    ensureOpen();
    start();
    currentTextPartId = undefined;

    const part = projectComponentInput(input);

    parts.push(part);
    emit({
      type: 'component.snapshot',
      partId: part.id,
      component: part.component,
      spec: part.spec,
      projection: part.projection,
      ...(part.metadata ? { metadata: part.metadata } : {}),
    });

    return part;
  }

  function layout(input: MFUILayoutInput): ProjectedLayoutPart {
    ensureOpen();
    start();
    currentTextPartId = undefined;

    if (input.layout !== 'mfui.columns') {
      const error = createMFUIServerError(
        'unknown_layout',
        `No layout manifest was provided for ${input.layout}.`,
      );
      fail('unknown_layout', error.message);
      throw error;
    }

    const manifest = normalizedMFUI.layouts?.find(
      (layoutManifest) => layoutManifest.name === input.layout,
    );

    if (!manifest) {
      const error = createMFUIServerError(
        'unknown_layout',
        `No layout manifest was provided for ${input.layout}.`,
      );
      fail('unknown_layout', error.message);
      throw error;
    }

    const columns = projectColumns(input.columns);
    const part: ProjectedLayoutPart = {
      id: input.id ?? createId('lay'),
      type: 'layout',
      layout: 'mfui.columns',
      columns,
      projection: {
        text: messageToPortableText(columns),
      },
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    parts.push(part);
    emit({
      type: 'layout.snapshot',
      partId: part.id,
      layout: part.layout,
      columns: part.columns,
      projection: part.projection,
      ...(part.metadata ? { metadata: part.metadata } : {}),
    });

    return part;
  }

  function projectComponentInput(
    input: MFUIComponentInput,
  ): ProjectedComponentPart {
    const manifest = normalizedMFUI.components.find(
      (componentManifest) => componentManifest.name === input.component,
    );

    if (!manifest) {
      const error = createMFUIServerError(
        'unknown_component',
        `No component manifest was provided for ${input.component}.`,
      );
      fail('unknown_component', error.message);
      throw error;
    }

    const result = validateSpecWithManifest(manifest, input.spec);
    if (!result.ok) {
      const error = createMFUIServerError(
        'invalid_component_spec',
        `Invalid spec for ${input.component}: ${result.errors.join('; ')}`,
      );
      fail('invalid_component_spec', error.message);
      throw error;
    }

    return {
      id: input.id ?? createId('cmp'),
      type: 'component',
      component: input.component,
      spec: input.spec,
      projection: projectSpecWithManifest(manifest, input.spec),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
  }

  function projectColumns(
    columns: MFUIColumnInput[],
  ): ProjectedColumnCell[] {
    if (columns.length < 2 || columns.length > 3) {
      const error = createMFUIServerError(
        'invalid_layout_spec',
        'mfui.columns must include 2 or 3 columns.',
      );
      fail('invalid_layout_spec', error.message);
      throw error;
    }

    return columns.map(projectColumn);
  }

  function projectColumn(input: MFUIColumnInput): ProjectedColumnCell {
    const hasText =
      'text' in input &&
      typeof (input as { text?: unknown }).text === 'string';
    const hasComponent =
      'component' in input &&
      typeof (input as { component?: unknown }).component === 'string';

    if (hasText === hasComponent) {
      const error = createMFUIServerError(
        'invalid_layout_spec',
        'Each mfui.columns cell must contain exactly one of text or component.',
      );
      fail('invalid_layout_spec', error.message);
      throw error;
    }

    if (hasText) {
      return createTextColumn(input as MFUITextColumnInput);
    }

    return projectComponentInput(input as MFUIComponentInput);
  }

  function createTextColumn(input: MFUITextColumnInput): TextPart {
    if (!input.text.trim()) {
      const error = createMFUIServerError(
        'invalid_layout_spec',
        'mfui.columns text cells must not be empty.',
      );
      fail('invalid_layout_spec', error.message);
      throw error;
    }

    return {
      id: input.id ?? createId('txt'),
      type: 'text',
      content: input.text,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
  }

  function error(input: MFUIStreamErrorInput): void {
    fail(input.code, input.message, input.recoverable);
  }

  function end(endOptions: MFUIStreamWriterEndOptions = {}): void {
    if (closed) {
      return;
    }

    start();
    emit({
      type: 'message.end',
      id,
      portableText: messageToPortableText(parts),
      ...(endOptions.usage ? { usage: endOptions.usage } : {}),
    });
    closeStream();
  }

  function response(init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Connection', 'keep-alive');

    return new Response(stream, {
      ...init,
      headers,
    });
  }

  function snapshot(): ProjectedMessage | undefined {
    if (!started) {
      return undefined;
    }

    return {
      id,
      parts: [...parts],
      portableText: messageToPortableText(parts),
    };
  }

  function fail(
    code: string,
    message: string,
    recoverable?: boolean,
  ): void {
    if (closed) {
      return;
    }

    emit({
      type: 'error',
      code,
      message,
      ...(recoverable !== undefined ? { recoverable } : {}),
    });
    closeStream();
  }

  function emit(event: SemanticStreamEvent): void {
    const chunk = encoder.encode(encodeSseEvent(event));

    if (controller) {
      controller.enqueue(chunk);
      return;
    }

    pending.push(chunk);
  }

  function flushPending(): void {
    if (!controller) {
      return;
    }

    while (pending.length) {
      const chunk = pending.shift();
      if (chunk) {
        controller.enqueue(chunk);
      }
    }
  }

  function closeStream(): void {
    if (closed) {
      return;
    }

    closed = true;

    if (!controller) {
      closeWhenReady = true;
      return;
    }

    controller.close();
  }

  function ensureOpen(): void {
    if (closed) {
      throw createMFUIServerError(
        'stream_closed',
        'Cannot write to a closed MFUI stream.',
      );
    }
  }

  return {
    start,
    text,
    component,
    layout,
    error,
    end,
    response,
    snapshot,
  };
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
