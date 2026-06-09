import type {
  MFUIBlockParserOptions,
  MFUIBlockParser,
  MFUIErrorHandler,
  MFUIManifest,
  MFUIMessageHandler,
  ProjectedMessage,
  MFUIStreamWriterEndOptions,
  MFUIStreamWriterOptions,
} from '@mfui/server';
import {
  createMFUIBlockParser,
  createMFUIStreamWriter,
} from '@mfui/server';

export type AISDKMFUIChunk =
  | { type: 'text'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'text-delta'; textDelta: string }
  | { type: 'finish'; totalUsage?: AISDKUsage }
  | { type: 'error'; error: unknown }
  | Record<string, unknown>;

export type AISDKUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type AISDKConsumeStreamResult = {
  consumeStream(options?: {
    onError?: (error: unknown) => void;
  }): Promise<void>;
  totalUsage?: PromiseLike<AISDKUsage> | AISDKUsage;
  usage?: PromiseLike<AISDKUsage> | AISDKUsage;
};

export type AISDKMFUIResponseResult = AISDKConsumeStreamResult & {
  textStream?: AsyncIterable<string>;
  fullStream?: AsyncIterable<AISDKMFUIChunk>;
};

export type AISDKMFUIResponseOptions = {
  close?: boolean;
  parser?: MFUIBlockParserOptions;
  writer?: MFUIStreamWriterOptions;
  responseInit?: ResponseInit;
  onMessage?: MFUIMessageHandler;
  onError?: MFUIErrorHandler;
};

export function createMFUIOnChunk(
  parser: MFUIBlockParser,
): (event: { chunk: AISDKMFUIChunk }) => void {
  return (event) => {
    writeMFUIChunk(event.chunk, parser);
  };
}

export function writeMFUIChunk(
  chunk: AISDKMFUIChunk,
  parser: MFUIBlockParser,
): void {
  const text = readChunkText(chunk);

  if (text) {
    parser.write(text);
  }
}

export function consumeMFUIStream(
  result: AISDKConsumeStreamResult,
  parser: MFUIBlockParser,
  options: { close?: boolean } = {},
): Promise<void> {
  return result
    .consumeStream()
    .then(() => resolveAISDKUsage(result))
    .then((usage) => {
      if (options.close === false) {
        parser.flush();
        return;
      }

      parser.close(usage ? { usage } : {});
    });
}

export function createMFUIResponse(
  result: AISDKMFUIResponseResult,
  mfui: MFUIManifest,
  options: AISDKMFUIResponseOptions = {},
): Response {
  const writer = createMFUIStreamWriter(mfui, options.writer);
  const parser = createMFUIBlockParser(mfui, writer, options.parser);
  const streamOptions =
    options.close === undefined ? {} : { close: options.close };

  void consumeMFUIResult(result, parser, streamOptions)
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

function readChunkText(chunk: AISDKMFUIChunk): string | undefined {
  if (chunk.type === 'text' && typeof chunk.text === 'string') {
    return chunk.text;
  }

  if (chunk.type !== 'text-delta') {
    return undefined;
  }

  const value = chunk as Record<string, unknown>;

  if (typeof value.text === 'string') {
    return value.text;
  }

  return typeof value.textDelta === 'string' ? value.textDelta : undefined;
}

function resolveAISDKUsage(
  result: AISDKConsumeStreamResult,
): Promise<MFUIStreamWriterEndOptions['usage'] | undefined> {
  const usage = result.totalUsage ?? result.usage;

  if (!usage) {
    return Promise.resolve(undefined);
  }

  return Promise.resolve(usage).then((resolvedUsage) =>
    isAISDKUsage(resolvedUsage) ? resolvedUsage : undefined,
  );
}

function consumeMFUIResult(
  result: AISDKMFUIResponseResult,
  parser: MFUIBlockParser,
  options: { close?: boolean },
): Promise<void> {
  if (result.textStream) {
    return readAsyncIterable(result.textStream, (text) => {
      parser.write(text);
    }).then(() => closeParserWithUsage(result, parser, options));
  }

  if (result.fullStream) {
    return readAsyncIterable(result.fullStream, (chunk) => {
      writeMFUIChunk(chunk, parser);
    }).then(() => closeParserWithUsage(result, parser, options));
  }

  return consumeMFUIStream(result, parser, options);
}

function closeParserWithUsage(
  result: AISDKConsumeStreamResult,
  parser: MFUIBlockParser,
  options: { close?: boolean },
): Promise<void> {
  return resolveAISDKUsage(result).then((usage) => {
    if (options.close === false) {
      parser.flush();
      return;
    }

    parser.close(usage ? { usage } : {});
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

function isAISDKUsage(value: unknown): value is AISDKUsage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const usage = value as Record<string, unknown>;
  return (
    (usage.inputTokens === undefined ||
      typeof usage.inputTokens === 'number') &&
    (usage.outputTokens === undefined ||
      typeof usage.outputTokens === 'number')
  );
}
