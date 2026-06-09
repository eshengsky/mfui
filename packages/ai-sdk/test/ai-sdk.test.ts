import { describe, expect, it } from 'vitest';
import {
  readSemanticStream,
  type MFUIManifest,
  type ProjectedMessage,
  type SemanticStreamEvent,
} from '@mfui/protocol';
import {
  createMFUIBlockParser,
  createMFUIStreamWriter,
} from '@mfui/server';

import {
  createMFUIResponse,
  createMFUIOnChunk,
  consumeMFUIStream,
  writeMFUIChunk,
} from '../src/index.js';

const mfui: MFUIManifest = {
  components: [
    {
      name: 'mfui.timeline',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          items: { type: 'array' },
        },
        required: ['title', 'items'],
      },
      projection: {
        text: '### {{ title }}',
      },
    },
  ],
};

describe('@mfui/ai-sdk', () => {
  it('writes AI SDK text chunks into MFUI SSE', async () => {
    const writer = createMFUIStreamWriter(mfui, { id: 'msg_ai_sdk' });
    const parser = createMFUIBlockParser(mfui, writer);
    const response = writer.response();
    const onChunk = createMFUIOnChunk(parser);

    onChunk({ chunk: { type: 'text-delta', text: 'Hello' } });
    writeMFUIChunk({ type: 'text', text: ' world' }, parser);
    parser.close({
      usage: {
        inputTokens: 1,
        outputTokens: 2,
      },
    });

    const events = await collectEvents(response);
    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'text.delta',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: 'Hello world',
        usage: {
          inputTokens: 1,
          outputTokens: 2,
        },
      }),
    );
  });

  it('ends the MFUI stream after consuming an AI SDK result', async () => {
    const writer = createMFUIStreamWriter(mfui, { id: 'msg_ai_sdk_consume' });
    const parser = createMFUIBlockParser(mfui, writer);
    const response = writer.response();

    parser.write('Done');
    await consumeMFUIStream(
      {
        consumeStream() {
          return Promise.resolve();
        },
        totalUsage: Promise.resolve({
          inputTokens: 3,
          outputTokens: 4,
        }),
      },
      parser,
    );

    const events = await collectEvents(response);
    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        usage: {
          inputTokens: 3,
          outputTokens: 4,
        },
      }),
    );
  });

  it('creates an MFUI response from an AI SDK text stream', async () => {
    const handledMessage = createMessagePromise();
    const response = createMFUIResponse(
      {
        consumeStream() {
          return Promise.resolve();
        },
        textStream: createAsyncIterable(['Hello', ' world']),
        totalUsage: Promise.resolve({
          inputTokens: 5,
          outputTokens: 6,
        }),
      },
      mfui,
      {
        writer: { id: 'msg_ai_sdk_response' },
        onMessage: handledMessage.resolve,
      },
    );

    const events = await collectEvents(response);
    const message = await handledMessage.promise;
    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'text.delta',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: 'Hello world',
        usage: {
          inputTokens: 5,
          outputTokens: 6,
        },
      }),
    );
    expect(message.portableText).toBe('Hello world');
  });
});

function createMessagePromise(): {
  promise: Promise<ProjectedMessage>;
  resolve(message: ProjectedMessage): void;
} {
  let resolveMessage: (message: ProjectedMessage) => void = () => {};
  const promise = new Promise<ProjectedMessage>((resolve) => {
    resolveMessage = resolve;
  });

  return {
    promise,
    resolve(message) {
      resolveMessage(message);
    },
  };
}

function createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;

      return {
        next() {
          const value = items[index];
          index += 1;

          return Promise.resolve(
            value === undefined
              ? { done: true, value: undefined }
              : { done: false, value },
          );
        },
      };
    },
  };
}

function collectEvents(response: Response): Promise<SemanticStreamEvent[]> {
  const events: SemanticStreamEvent[] = [];
  const iterator = readSemanticStream(response.body)[Symbol.asyncIterator]();

  function readNext(): Promise<SemanticStreamEvent[]> {
    return iterator.next().then((result) => {
      if (result.done) {
        return events;
      }

      events.push(result.value);
      return readNext();
    });
  }

  return readNext();
}
