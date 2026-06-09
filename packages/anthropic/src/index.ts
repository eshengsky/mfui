import {
  createMFUIBlockParser,
  createMFUIStreamWriter,
  type MFUIBlockParserOptions,
  type MFUIBlockParser,
  type MFUIErrorHandler,
  type MFUIManifest,
  type MFUIMessageHandler,
  type MFUIStreamWriterEndOptions,
  type MFUIStreamWriterOptions,
  type ProjectedMessage,
} from '@mfui/server';

export type AnthropicStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null;

export type AnthropicMFUIStreamOptions = {
  close?: boolean;
};

export type AnthropicMFUIResponseOptions = AnthropicMFUIStreamOptions & {
  parser?: MFUIBlockParserOptions;
  writer?: MFUIStreamWriterOptions;
  responseInit?: ResponseInit;
  onMessage?: MFUIMessageHandler;
  onError?: MFUIErrorHandler;
};

export type AnthropicStreamEvent = Record<string, unknown> & {
  type?: string;
};

type JsonSseEvent = {
  event?: string;
  data: unknown;
  rawData: string;
};

export function readStream(
  source: AnthropicStreamSource,
): AsyncIterable<AnthropicStreamEvent> {
  return mapJsonSseEvents(readJsonSseStream(source), readAnthropicEvent);
}

export function writeMFUIStream(
  stream: AsyncIterable<AnthropicStreamEvent>,
  parser: MFUIBlockParser,
  options: AnthropicMFUIStreamOptions = {},
): Promise<void> {
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  function handleEvent(event: AnthropicStreamEvent): void {
    if (event.type === 'message_start') {
      const usage = readObject(readObject(event.message)?.usage);
      if (typeof usage?.input_tokens === 'number') {
        inputTokens = usage.input_tokens;
      }
      return;
    }

    if (event.type === 'content_block_delta') {
      const delta = readObject(event.delta);
      if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
        parser.write(delta.text);
      }
      return;
    }

    if (event.type === 'message_delta') {
      const usage = readObject(event.usage);
      if (typeof usage?.output_tokens === 'number') {
        outputTokens = usage.output_tokens;
      }
    }
  }

  return readAsyncIterable(stream, handleEvent)
    .then(() => {
      if (options.close === false) {
        parser.flush();
        return;
      }

      const usage = createUsage(inputTokens, outputTokens);
      parser.close(usage ? { usage } : {});
    });
}

export function pipeMFUIStream(
  source: AnthropicStreamSource,
  parser: MFUIBlockParser,
  options: AnthropicMFUIStreamOptions = {},
): Promise<void> {
  return writeMFUIStream(readStream(source), parser, options);
}

export function createMFUIResponse(
  source: AnthropicStreamSource,
  mfui: MFUIManifest,
  options: AnthropicMFUIResponseOptions = {},
): Response {
  const writer = createMFUIStreamWriter(mfui, options.writer);
  const parser = createMFUIBlockParser(mfui, writer, options.parser);
  const streamOptions =
    options.close === undefined ? {} : { close: options.close };

  void pipeMFUIStream(source, parser, streamOptions)
    .then(() =>
      options.close === false
        ? undefined
        : notifyMFUIMessage(writer.snapshot(), options.onMessage).catch(
            (error: unknown) =>
              notifyMFUIError(error, options.onError).catch(() => undefined),
          ),
    )
    .catch((error: unknown) => {
      writer.error({
        code: 'provider_stream_error',
        message: error instanceof Error ? error.message : String(error),
      });
      return notifyMFUIError(error, options.onError).catch(() => undefined);
    });

  return writer.response(options.responseInit);
}

function notifyMFUIMessage(
  message: ProjectedMessage | undefined,
  onMessage?: MFUIMessageHandler,
): Promise<void> {
  if (!message || !onMessage) {
    return Promise.resolve();
  }

  return Promise.resolve(onMessage(message));
}

function notifyMFUIError(
  error: unknown,
  onError?: MFUIErrorHandler,
): Promise<void> {
  if (!onError) {
    return Promise.resolve();
  }

  return Promise.resolve(onError(error));
}

function readAnthropicEvent(
  event: JsonSseEvent,
): AnthropicStreamEvent | undefined {
  if (!isRecord(event.data)) {
    return undefined;
  }

  return {
    ...event.data,
    type: event.event ?? event.data.type,
  } as AnthropicStreamEvent;
}

function createUsage(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
): MFUIStreamWriterEndOptions['usage'] | undefined {
  const usage = {
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
  };

  return Object.keys(usage).length ? usage : undefined;
}

function readJsonSseStream(
  source: AnthropicStreamSource,
): AsyncIterable<JsonSseEvent> {
  return {
    [Symbol.asyncIterator]() {
      return createJsonSseIterator(source);
    },
  };
}

function createJsonSseIterator(
  source: AnthropicStreamSource,
): AsyncIterator<JsonSseEvent> {
  const response = isResponse(source) ? source : undefined;
  const body = isResponse(source) ? source.body : source;
  const decoder = new TextDecoder();
  const events: JsonSseEvent[] = [];
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let buffer = '';
  let done = false;
  let checkedResponse = false;
  let eventName: string | undefined;
  let dataLines: string[] = [];

  async function assertReadableResponse(): Promise<void> {
    if (checkedResponse || !response) {
      return;
    }

    checkedResponse = true;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Provider stream failed with ${response.status}.`);
    }
  }

  async function readMore(): Promise<void> {
    await assertReadableResponse();

    if (done || !body) {
      done = true;
      return;
    }

    reader ??= body.getReader();

    const result = await reader.read();
    if (result.done) {
      done = true;
      buffer += decoder.decode();
      if (buffer) {
        const event = readLine(buffer);
        if (event) {
          events.push(event);
        }
        buffer = '';
      }
      const event = dispatchEvent();
      if (event) {
        events.push(event);
      }
      return;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const event = readLine(line);
      if (event) {
        events.push(event);
      }
    }
  }

  function dispatchEvent(): JsonSseEvent | undefined {
    if (!eventName && dataLines.length === 0) {
      return undefined;
    }

    const rawData = dataLines.join('\n');
    const event = {
      ...(eventName ? { event: eventName } : {}),
      rawData,
      data: parseJsonData(rawData),
    };

    eventName = undefined;
    dataLines = [];

    return event;
  }

  function readLine(rawLine: string): JsonSseEvent | undefined {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (line === '') {
      return dispatchEvent();
    }

    if (line.startsWith(':')) {
      return undefined;
    }

    const colonIndex = line.indexOf(':');
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    const rawValue = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

    if (field === 'event') {
      eventName = value;
    } else if (field === 'data') {
      dataLines.push(value);
    }

    return undefined;
  }

  return {
    async next() {
      while (!done && events.length === 0) {
        await readMore();
      }

      const event = events.shift();
      if (event) {
        return { done: false, value: event };
      }

      return { done: true, value: undefined };
    },
  };
}

function parseJsonData(rawData: string): unknown {
  if (!rawData || rawData === '[DONE]') {
    return rawData;
  }

  return JSON.parse(rawData);
}

function readObject(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isResponse(source: AnthropicStreamSource): source is Response {
  return Boolean(
    source &&
      typeof source === 'object' &&
      'body' in source &&
      'ok' in source &&
      'status' in source,
  );
}

function mapJsonSseEvents<T>(
  source: AsyncIterable<JsonSseEvent>,
  map: (event: JsonSseEvent) => T | undefined,
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      const iterator = source[Symbol.asyncIterator]();

      return {
        async next() {
          return readNextMapped(iterator, map);
        },
      };
    },
  };
}

function readNextMapped<T>(
  iterator: AsyncIterator<JsonSseEvent>,
  map: (event: JsonSseEvent) => T | undefined,
): Promise<IteratorResult<T>> {
  return iterator.next().then((result) => {
    if (result.done) {
      return { done: true, value: undefined };
    }

    const value = map(result.value);
    if (value === undefined) {
      return readNextMapped(iterator, map);
    }

    return { done: false, value };
  });
}

function readAsyncIterable<T>(
  iterable: AsyncIterable<T>,
  onValue: (value: T) => void,
): Promise<void> {
  const iterator = iterable[Symbol.asyncIterator]();

  function readNext(): Promise<void> {
    return iterator.next().then((result) => {
      if (result.done) {
        return;
      }

      onValue(result.value);
      return readNext();
    });
  }

  return readNext();
}
