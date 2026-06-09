import type {
  ComponentSnapshotEvent,
  LayoutSnapshotEvent,
  MessageEndEvent,
  MessageStartEvent,
  ProjectedMessage,
  ProjectedMessagePart,
  SemanticStreamEvent,
  TextDeltaEvent,
} from './types.js';

export function messageToEvents(message: ProjectedMessage): SemanticStreamEvent[] {
  const events: SemanticStreamEvent[] = [
    {
      type: 'message.start',
      id: message.id,
    },
  ];

  for (const part of message.parts) {
    if (part.type === 'text') {
      events.push({
        type: 'text.delta',
        partId: part.id,
        text: part.content,
      });
      continue;
    }

    if (part.type === 'component') {
      events.push({
        type: 'component.snapshot',
        partId: part.id,
        component: part.component,
        spec: part.spec,
        projection: part.projection,
        ...(part.metadata ? { metadata: part.metadata } : {}),
      });
      continue;
    }

    events.push({
      type: 'layout.snapshot',
      partId: part.id,
      layout: part.layout,
      columns: part.columns,
      projection: part.projection,
      ...(part.metadata ? { metadata: part.metadata } : {}),
    });
  }

  events.push({
    type: 'message.end',
    id: message.id,
    portableText: message.portableText,
  });

  return events;
}

export function encodeSse(events: Iterable<SemanticStreamEvent>): string {
  return Array.from(events, encodeSseEvent).join('');
}

export function encodeSseEvent(event: SemanticStreamEvent): string {
  const { type, ...payload } = event;
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function readSemanticStream(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<SemanticStreamEvent> {
  if (!body) {
    return emptyAsyncIterable();
  }

  return {
    [Symbol.asyncIterator]() {
      return createSemanticStreamIterator(body);
    },
  };
}

function createSemanticStreamIterator(
  body: ReadableStream<Uint8Array>,
): AsyncIterator<SemanticStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const events: SemanticStreamEvent[] = [];
  let buffer = '';
  let done = false;
  let eventType: string | undefined;
  let dataLines: string[] = [];

  async function readMore(): Promise<void> {
    if (done) {
      return;
    }

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

  function dispatchEvent(): SemanticStreamEvent | undefined {
    if (!eventType && dataLines.length === 0) {
      return undefined;
    }

    const data = dataLines.join('\n');
    const payload = data ? (JSON.parse(data) as Record<string, unknown>) : {};
    const event = {
      ...payload,
      type: eventType ?? payload.type,
    } as SemanticStreamEvent;

    eventType = undefined;
    dataLines = [];

    return event;
  }

  function readLine(rawLine: string): SemanticStreamEvent | undefined {
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
      eventType = value;
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

function emptyAsyncIterable<T>(): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          return { done: true, value: undefined };
        },
      };
    },
  };
}

export type MessageAccumulatorState = {
  messages: ProjectedMessage[];
  currentMessage?: ProjectedMessage;
};

export type MessageAccumulator = {
  readonly messages: ProjectedMessage[];
  apply(event: SemanticStreamEvent): MessageAccumulatorState;
  snapshot(): MessageAccumulatorState;
  getPortableText(messageId: string): string | undefined;
  findMessage(messageId: string): ProjectedMessage | undefined;
};

export function createMessageAccumulator(): MessageAccumulator {
  const messages: ProjectedMessage[] = [];
  let current: MutableProjectedMessage | undefined;

  function requireCurrent(): MutableProjectedMessage {
    if (!current) {
      throw new Error('Received stream event before message.start');
    }
    return current;
  }

  function applyTextDelta(event: TextDeltaEvent): void {
    const message = requireCurrent();
    const existing = message.parts.find(
      (part) => part.type === 'text' && part.id === event.partId,
    );

    if (existing?.type === 'text') {
      existing.content += event.text;
      return;
    }

    message.parts.push({
      id: event.partId,
      type: 'text',
      content: event.text,
    });
  }

  function applyComponentSnapshot(event: ComponentSnapshotEvent): void {
    const message = requireCurrent();
    message.parts.push({
      id: event.partId,
      type: 'component',
      component: event.component,
      spec: event.spec,
      projection: event.projection,
      ...(event.metadata ? { metadata: event.metadata } : {}),
    });
  }

  function applyLayoutSnapshot(event: LayoutSnapshotEvent): void {
    const message = requireCurrent();
    message.parts.push({
      id: event.partId,
      type: 'layout',
      layout: event.layout,
      columns: event.columns,
      projection: event.projection,
      ...(event.metadata ? { metadata: event.metadata } : {}),
    });
  }

  function finishMessage(event: MessageEndEvent): void {
    const message = requireCurrent();
    message.portableText = event.portableText;
    messages.push(finalizeMutable(message));
    current = undefined;
  }

  const accumulator: MessageAccumulator = {
    get messages() {
      return messages;
    },
    apply(event) {
      switch (event.type) {
        case 'message.start':
          current = createEmptyMessage(event);
          break;
        case 'text.delta':
          applyTextDelta(event);
          break;
        case 'component.snapshot':
          applyComponentSnapshot(event);
          break;
        case 'layout.snapshot':
          applyLayoutSnapshot(event);
          break;
        case 'message.end':
          finishMessage(event);
          break;
        case 'error':
          throw new Error(`${event.code}: ${event.message}`);
      }

      return accumulator.snapshot();
    },
    snapshot() {
      return {
        messages,
        ...(current ? { currentMessage: finalizeMutable(current) } : {}),
      };
    },
    getPortableText(messageId) {
      return accumulator.findMessage(messageId)?.portableText;
    },
    findMessage(messageId) {
      if (current?.id === messageId) {
        return finalizeMutable(current);
      }
      return messages.find((message) => message.id === messageId);
    },
  };

  return accumulator;
}

type MutableProjectedMessage = {
  id: string;
  parts: ProjectedMessagePart[];
  portableText: string;
};

function createEmptyMessage(event: MessageStartEvent): MutableProjectedMessage {
  return {
    id: event.id,
    parts: [],
    portableText: '',
  };
}

function finalizeMutable(message: MutableProjectedMessage): ProjectedMessage {
  return {
    id: message.id,
    parts: [...message.parts],
    portableText: message.portableText,
  };
}
