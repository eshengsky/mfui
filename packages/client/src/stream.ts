import {
  createMessageAccumulator,
  readSemanticStream,
  type ProjectedMessage,
  type SemanticStreamEvent,
} from '@mfui/protocol';

export type MFUIStreamSource = Response | ReadableStream<Uint8Array> | null;

export async function readMFUIMessage(
  source: MFUIStreamSource,
): Promise<ProjectedMessage | undefined> {
  let lastMessage: ProjectedMessage | undefined;

  for await (const message of streamMFUIMessage(source)) {
    lastMessage = message;
  }

  return lastMessage;
}

export function streamMFUIMessage(
  source: MFUIStreamSource,
): AsyncIterable<ProjectedMessage> {
  return {
    [Symbol.asyncIterator]() {
      return createMFUIStreamIterator(source);
    },
  };
}

function createMFUIStreamIterator(
  source: MFUIStreamSource,
): AsyncIterator<ProjectedMessage> {
  const response = isResponse(source) ? source : undefined;
  const body = resolveStreamBody(source);
  const accumulator = createMessageAccumulator();
  let eventIterator: AsyncIterator<SemanticStreamEvent> | undefined;
  let checkedResponse = false;

  async function readNextEvent(): Promise<ProjectedMessage | undefined> {
    await assertReadableResponse(response);

    eventIterator ??= readSemanticStream(body)[Symbol.asyncIterator]();

    const eventResult = await eventIterator.next();
    if (eventResult.done) {
      return undefined;
    }

    const state = accumulator.apply(eventResult.value as SemanticStreamEvent);
    return state.currentMessage ?? state.messages.at(-1);
  }

  async function assertReadableResponse(
    currentResponse: Response | undefined,
  ): Promise<void> {
    if (checkedResponse || !currentResponse) {
      return;
    }

    checkedResponse = true;

    if (!currentResponse.ok) {
      const text = await currentResponse.text();
      throw new Error(text || `MFUI response failed with ${currentResponse.status}.`);
    }
  }

  return {
    async next() {
      const message = await readNextEvent();
      if (message) {
        return { done: false, value: message };
      }

      return { done: true, value: undefined };
    },
  };
}

function isResponse(source: MFUIStreamSource): source is Response {
  return Boolean(
    source &&
      typeof source === 'object' &&
      'body' in source &&
      'ok' in source &&
      'status' in source,
  );
}

function resolveStreamBody(
  source: MFUIStreamSource,
): ReadableStream<Uint8Array> | null {
  if (isResponse(source)) {
    return source.body;
  }

  return source;
}
