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
  type AnthropicStreamEvent,
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

describe('@mfui/anthropic', () => {
  it('writes Anthropic text deltas with MFUI blocks into MFUI SSE', async () => {
    const writer = createMFUIStreamWriter(mfui, { id: 'msg_anthropic' });
    const parser = createMFUIBlockParser(mfui, writer);
    const response = writer.response();
    const componentBlock = JSON.stringify({
      component: 'mfui.timeline',
      spec: {
        title: 'Launch plan',
        items: [{ time: 'Week 1', title: 'Canary' }],
      },
    });
    const stream = createAsyncIterable<AnthropicStreamEvent>([
      {
        type: 'message_start',
        message: {
          usage: {
            input_tokens: 8,
          },
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: `Here is the plan:\n\n<mfui>${componentBlock.slice(0, 20)}`,
        },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: `${componentBlock.slice(20)}</mfui>`,
        },
      },
      {
        type: 'message_delta',
        usage: {
          output_tokens: 18,
        },
      },
      {
        type: 'message_stop',
      },
    ]);

    await writeMFUIStream(stream, parser);

    const events = await collectEvents(response);
    expect(events.map((event) => event.type)).toEqual([
      'message.start',
      'text.delta',
      'component.snapshot',
      'message.end',
    ]);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'message.end',
        usage: {
          inputTokens: 8,
          outputTokens: 18,
        },
      }),
    );
  });

  it('reads Anthropic SSE events', async () => {
    const stream = createSseStream([
      {
        event: 'content_block_delta',
        data: {
          delta: {
            type: 'text_delta',
            text: 'Hello',
          },
        },
      },
    ]);
    const events: AnthropicStreamEvent[] = [];
    const iterator = readStream(stream)[Symbol.asyncIterator]();

    await readAll(iterator, events);

    expect(events[0]).toEqual(
      expect.objectContaining({
        type: 'content_block_delta',
      }),
    );
  });

  it('calls onMessage with final portable text from a response stream', async () => {
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
        event: 'content_block_delta',
        data: {
          delta: {
            type: 'text_delta',
            text: `Plan:\n\n<mfui>${componentBlock}</mfui>`,
          },
        },
      },
      {
        event: 'message_stop',
        data: {},
      },
    ]);

    const response = createMFUIResponse(upstream, mfui, {
      writer: { id: 'msg_anthropic_response' },
      onMessage: handledMessage.resolve,
    });

    await collectEvents(response);
    const message = await handledMessage.promise;

    expect(message.portableText).toContain('### Launch plan');
    expect(message.parts.at(-1)).toEqual(
      expect.objectContaining({
        type: 'component',
        component: 'mfui.timeline',
      }),
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

function createSseStream(
  items: Array<{ event: string; data: Record<string, unknown> }>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sse = items
    .map((item) => `event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`)
    .join('');

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
