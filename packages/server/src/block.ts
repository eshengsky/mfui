import type { MFUIManifest } from '@mfui/protocol';

import { createMFUIServerError } from './error.js';
import type {
  MFUIColumnInput,
  MFUILayoutInput,
  MFUIComponentInput,
  MFUIStreamWriter,
  MFUIStreamWriterEndOptions,
} from './stream.js';

export const MFUI_BLOCK_TAG = 'mfui';

export type MFUIBlockParserOptions = {
  maxBlockLength?: number;
};

export type MFUIBlockParser = {
  write(text: string): void;
  flush(): void;
  close(options?: MFUIStreamWriterEndOptions): void;
};

export function createMFUIBlockParser(
  _mfui: MFUIManifest,
  writer: MFUIStreamWriter,
  options: MFUIBlockParserOptions = {},
): MFUIBlockParser {
  const maxBlockLength = options.maxBlockLength ?? 64 * 1024;
  const openTag = `<${MFUI_BLOCK_TAG}>`;
  const closeTag = `</${MFUI_BLOCK_TAG}>`;
  let buffer = '';
  let insideBlock = false;

  function write(text: string): void {
    if (!text) {
      return;
    }

    buffer += text;
    processBuffer();
  }

  function flush(): void {
    if (insideBlock) {
      fail('Unclosed <mfui> block.');
      return;
    }

    if (buffer) {
      writer.text(buffer);
      buffer = '';
    }
  }

  function close(closeOptions: MFUIStreamWriterEndOptions = {}): void {
    flush();
    writer.end(closeOptions);
  }

  function processBuffer(): void {
    let keepProcessing = true;

    while (keepProcessing) {
      keepProcessing = insideBlock
        ? processComponentBlock()
        : processText();
    }
  }

  function processText(): boolean {
    const openIndex = buffer.indexOf(openTag);

    if (openIndex !== -1) {
      const text = buffer.slice(0, openIndex);
      if (text) {
        writer.text(text);
      }

      buffer = buffer.slice(openIndex + openTag.length);
      insideBlock = true;
      return true;
    }

    const suffixLength = findOpenTagPrefixSuffixLength(buffer, openTag);
    const flushLength = buffer.length - suffixLength;

    if (flushLength > 0) {
      writer.text(buffer.slice(0, flushLength));
      buffer = buffer.slice(flushLength);
    }

    return false;
  }

  function processComponentBlock(): boolean {
    const closeIndex = buffer.indexOf(closeTag);

    if (closeIndex === -1) {
      if (buffer.length > maxBlockLength) {
        fail(`MFUI block exceeded ${maxBlockLength} characters.`);
      }

      return false;
    }

    const payload = buffer.slice(0, closeIndex).trim();
    try {
      const input = parseMFUIBlockPayload(payload);
      if (isMFUILayoutInput(input)) {
        writer.layout(input);
      } else {
        writer.component(input);
      }
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
    buffer = buffer.slice(closeIndex + closeTag.length);
    insideBlock = false;

    return true;
  }

  function fail(message: string): never {
    writer.error({
      code: 'invalid_mfui_block',
      message,
    });

    throw createMFUIServerError('invalid_model_output', message);
  }

  return {
    write,
    flush,
    close,
  };
}

export type MFUIBlockInput = MFUIComponentInput | MFUILayoutInput;

export function parseMFUIBlockPayload(payload: string): MFUIBlockInput {
  let value: unknown;

  try {
    value = JSON.parse(payload);
  } catch {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI block payload must be valid JSON.',
    );
  }

  if (!value || typeof value !== 'object') {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI block payload must be an object.',
    );
  }

  const input = value as Record<string, unknown>;
  const hasComponent = typeof input.component === 'string';
  const hasLayout = typeof input.layout === 'string';

  if (hasComponent === hasLayout) {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI block payload must include exactly one of component or layout.',
    );
  }

  if (hasComponent) {
    if (!('spec' in input)) {
      throw createMFUIServerError(
        'invalid_model_output',
        'MFUI component block payload must include spec.',
      );
    }

    return {
      component: String(input.component),
      spec: input.spec,
    };
  }

  if (!Array.isArray(input.columns)) {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI layout block payload must include columns.',
    );
  }

  return {
    layout: String(input.layout),
    columns: input.columns.map(parseColumnInput),
  };
}

function parseColumnInput(value: unknown): MFUIColumnInput {
  if (!value || typeof value !== 'object') {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI layout columns must contain objects.',
    );
  }

  const input = value as Record<string, unknown>;
  const hasText = typeof input.text === 'string';
  const hasComponent = typeof input.component === 'string';

  if (hasText === hasComponent) {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI layout columns must contain exactly one of text or component.',
    );
  }

  if (hasText) {
    return {
      text: String(input.text),
    };
  }

  if (!('spec' in input)) {
    throw createMFUIServerError(
      'invalid_model_output',
      'MFUI layout component cells must include spec.',
    );
  }

  return {
    component: String(input.component),
    spec: input.spec,
  };
}

function isMFUILayoutInput(input: MFUIBlockInput): input is MFUILayoutInput {
  return 'layout' in input;
}

function findOpenTagPrefixSuffixLength(value: string, openTag: string): number {
  const maxLength = Math.min(value.length, openTag.length - 1);

  for (let length = maxLength; length > 0; length -= 1) {
    if (openTag.startsWith(value.slice(-length))) {
      return length;
    }
  }

  return 0;
}
