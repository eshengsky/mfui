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
  readStream,
  writeMFUIStream,
  type OpenAICompatibleStreamChunk,
} from '../src/index.js';

const mfui: MFUIManifest = {
  components: [
    {
      name: 'mfui.timeline',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                title: { type: 'string' },
              },
              required: ['time', 'title'],
            },
          },
        },
        required: ['title', 'items'],
      },
      projection: {
        text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}
{% endfor %}`,
      },
    },
  ],
};

describe('@mfui/openai-compatible', () => {
  it('writes Chat Completions text deltas with MFUI blocks into MFUI SSE', async () => {
    const writer = createMFUIStreamWriter(mfui, { id: 'msg_compatible' });
    const parser = createMFUIBlockParser(mfui, writer);
    const response = writer.response();
    const componentBlock = JSON.stringify({
      component: 'mfui.timeline',
      spec: {
        title: 'Launch plan',
        items: [{ time: 'Week 1', title: 'Canary' }],
      },
    });
    const stream = createAsyncIterable<OpenAICompatibleStreamChunk>([
      {
        choices: [
          {
            index: 0,
            delta: {
              content: 'Here is the plan:',
            },
          },
        ],
      },
      {
        choices: [
          {
            index: 0,
            delta: {
              content: `\n\n<mfui>${componentBlock.slice(0, 25)}`,
            },
          },
        ],
      },
      {
        choices: [
          {
            index: 0,
            delta: {
              content: `${componentBlock.slice(25)}</mfui>`,
            },
          },
        ],
      },
      {
        choices: [],
        usage: {
          prompt_tokens: 11,
          completion_tokens: 22,
        },
      },
    ]);

    await writeMFUIStream(stream, parser);

    const events = await collectEvents(response);
    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'text.delta',
      'component.snapshot',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        usage: {
          inputTokens: 11,
          outputTokens: 22,
        },
      }),
    );
  });

  it('reads Chat Completions SSE chunks', async () => {
    const stream = createSseStream([
      {
        choices: [
          {
            delta: {
              content: 'Hello',
            },
          },
        ],
      },
    ]);
    const chunks: OpenAICompatibleStreamChunk[] = [];
    const iterator = readStream(stream)[Symbol.asyncIterator]();

    await readAll(iterator, chunks);

    expect(chunks[0]?.choices?.[0]?.delta?.content).toBe('Hello');
  });

  it('creates an MFUI response directly from a Chat Completions stream', async () => {
    const handledMessage = createMessagePromise();
    const componentBlock = JSON.stringify({
      component: 'mfui.timeline',
      spec: {
        title: 'Launch plan',
        items: [{ time: 'Week 1', title: 'Canary' }],
      },
    });
    const upstream = createSseStream([
      {
        choices: [
          {
            delta: {
              content: `Plan:\n\n<mfui>${componentBlock}</mfui>`,
            },
          },
        ],
      },
    ]);

    const response = createMFUIResponse(upstream, mfui, {
      writer: { id: 'msg_response' },
      onMessage: handledMessage.resolve,
    });
    const events = await collectEvents(response);
    const message = await handledMessage.promise;

    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'component.snapshot',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        portableText: expect.stringContaining('### Launch plan'),
      }),
    );
    expect(message.portableText).toContain('### Launch plan');
    expect(message.parts.at(-1)).toEqual(
      expect.objectContaining({
        type: 'component',
        component: 'mfui.timeline',
      }),
    );
  });

  it('calls onError when response processing fails', async () => {
    const handledError = createErrorPromise();
    const upstream = createSseStream([
      {
        choices: [
          {
            delta: {
              content: '<mfui>{"component":"missing.timeline","spec":{}}</mfui>',
            },
          },
        ],
      },
    ]);

    const response = createMFUIResponse(upstream, mfui, {
      writer: { id: 'msg_response_error' },
      onError: handledError.resolve,
    });
    const events = await collectEvents(response);
    const error = await handledError.promise;

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
      }),
    );
    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : String(error)).toContain(
      'missing.timeline',
    );
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

function createErrorPromise(): {
  promise: Promise<unknown>;
  resolve(error: unknown): void;
} {
  let resolveError: (error: unknown) => void = () => {};
  const promise = new Promise<unknown>((resolve) => {
    resolveError = resolve;
  });

  return {
    promise,
    resolve(error) {
      resolveError(error);
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

function createSseStream(items: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sse = `${items
    .map((item) => `data: ${JSON.stringify(item)}\n\n`)
    .join('')}data: [DONE]\n\n`;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });
}

function readAll<T>(
  iterator: AsyncIterator<T>,
  values: T[],
): Promise<T[]> {
  return iterator.next().then((result) => {
    if (result.done) {
      return values;
    }

    values.push(result.value);
    return readAll(iterator, values);
  });
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
