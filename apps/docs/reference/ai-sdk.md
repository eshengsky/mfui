---
outline: [2, 2]
---

# `@mfui/ai-sdk`

`@mfui/ai-sdk` adapts Vercel AI SDK streaming results into MFUI semantic SSE
streams.

Use this package when your server already uses `streamText()` or another AI SDK
API that exposes `textStream`, `fullStream`, or `consumeStream()`.

## `createMFUIResponse()`

Creates an MFUI semantic SSE `Response` from an AI SDK streaming result.

### Import

```ts
import { createMFUIResponse } from '@mfui/ai-sdk';
```

### Signature

```ts
function createMFUIResponse(
  result: AISDKMFUIResponseResult,
  mfui: MFUIManifest,
  options?: AISDKMFUIResponseOptions,
): Response
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `result` | <code><a href="#aisdkmfuiresponseresult">AISDKMFUIResponseResult</a></code> | Yes | n/a | AI SDK streaming result. |
| `mfui` | <code><a href="/reference/server#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components available to this request. |
| `options` | <code><a href="#aisdkmfuiresponseoptions">AISDKMFUIResponseOptions</a></code> | No | `{}` | Response, parser, writer, and lifecycle options. |

### Returns

| Type | Description |
| --- | --- |
| `Response` | `text/event-stream` response that emits MFUI semantic SSE events. |

### Example

```ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/ai-sdk';

const result = streamText({
  model: openai('gpt-4o-mini'),
  system: [
    'You are a helpful assistant.',
    createMFUIPrompt(mfui),
  ].join('\n\n'),
  messages,
});

return createMFUIResponse(result, mfui, {
  onMessage(message) {
    saveAssistantMessage(message);
  },
});
```

### Notes

`createMFUIResponse()` prefers `result.textStream` when present, then
`result.fullStream`, and falls back to `result.consumeStream()`.

## `AISDKMFUIResponseResult`

AI SDK result shape accepted by `createMFUIResponse()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `consumeStream(options)` | <code>(options?: { onError?: (error: unknown) =&gt; void }) =&gt; Promise&lt;void&gt;</code> | Yes | n/a | AI SDK method that consumes the stream. Used when `textStream` and `fullStream` are missing. |
| `textStream` | `AsyncIterable<string>` | No | n/a | Stream of plain text chunks. Preferred when present. |
| `fullStream` | <code>AsyncIterable&lt;<a href="#aisdkmfuichunk">AISDKMFUIChunk</a>&gt;</code> | No | n/a | Stream of AI SDK chunks. Used when `textStream` is missing. |
| `totalUsage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | No | n/a | Token usage read after stream consumption. Preferred over `usage`. |
| `usage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | No | n/a | Token usage fallback. |

## `AISDKMFUIResponseOptions`

Options for `createMFUIResponse()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to close the MFUI parser and writer when the AI SDK stream finishes. |
| `parser` | <code><a href="/reference/server#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | No | `{}` | Options passed to `createMFUIBlockParser()`. |
| `writer` | <code><a href="/reference/server#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | No | `{}` | Options passed to `createMFUIStreamWriter()`. |
| `responseInit` | `ResponseInit` | No | `{}` | Init object passed to the returned `Response`. |
| `onMessage` | <code><a href="/reference/server#mfuimessagehandler">MFUIMessageHandler</a></code> | No | n/a | Called with the final projected message after the MFUI response finishes. |
| `onError` | <code><a href="/reference/server#mfuierrorhandler">MFUIErrorHandler</a></code> | No | n/a | Called when stream processing or MFUI block parsing fails. |

## `AISDKMFUIChunk`

AI SDK full-stream chunk shape consumed by `writeMFUIChunk()`.

### Shape

```ts
type AISDKMFUIChunk =
  | { type: 'text'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'text-delta'; textDelta: string }
  | { type: 'finish'; totalUsage?: AISDKUsage }
  | { type: 'error'; error: unknown }
  | Record<string, unknown>
```

### Notes

MFUI reads only `text` chunks and `text-delta` chunks. Other chunks are ignored.

## `AISDKUsage`

Token usage shape copied to the final MFUI `message.end` event.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `inputTokens` | `number` | No | n/a | Input token count. |
| `outputTokens` | `number` | No | n/a | Output token count. |

## `createMFUIOnChunk()`

Creates an AI SDK `onChunk` callback that writes text chunks into an MFUI block
parser.

### Import

```ts
import { createMFUIOnChunk } from '@mfui/ai-sdk';
```

### Signature

```ts
function createMFUIOnChunk(
  parser: MFUIBlockParser,
): (event: { chunk: AISDKMFUIChunk }) => void
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving AI SDK text chunks. |

### Returns

| Type | Description |
| --- | --- |
| `(event: { chunk: AISDKMFUIChunk }) => void` | Callback that can be passed to AI SDK APIs exposing chunk events. |

## `writeMFUIChunk()`

Writes one AI SDK full-stream chunk into an MFUI block parser.

### Import

```ts
import { writeMFUIChunk } from '@mfui/ai-sdk';
```

### Signature

```ts
function writeMFUIChunk(
  chunk: AISDKMFUIChunk,
  parser: MFUIBlockParser,
): void
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `chunk` | <code><a href="#aisdkmfuichunk">AISDKMFUIChunk</a></code> | Yes | n/a | AI SDK chunk. Only text chunks are written to the parser. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving AI SDK text chunks. |

### Returns

| Type | Description |
| --- | --- |
| `void` | Returns nothing. |

## `consumeMFUIStream()`

Consumes an AI SDK stream through `result.consumeStream()` and then closes or
flushes an MFUI block parser.

### Import

```ts
import { consumeMFUIStream } from '@mfui/ai-sdk';
```

### Signature

```ts
function consumeMFUIStream(
  result: AISDKConsumeStreamResult,
  parser: MFUIBlockParser,
  options?: { close?: boolean },
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `result` | <code><a href="#aisdkconsumestreamresult">AISDKConsumeStreamResult</a></code> | Yes | n/a | AI SDK result with `consumeStream()`. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser to close or flush. |
| `options` | `{ close?: boolean }` | No | `{}` | When `close` is `false`, calls `parser.flush()` instead of `parser.close()`. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the AI SDK stream is consumed and the parser is flushed or closed. |

## `AISDKConsumeStreamResult`

Minimal AI SDK result shape consumed by `consumeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `consumeStream(options)` | <code>(options?: { onError?: (error: unknown) =&gt; void }) =&gt; Promise&lt;void&gt;</code> | Yes | n/a | Method used to consume the AI SDK stream. |
| `totalUsage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | No | n/a | Token usage read after stream consumption. Preferred over `usage`. |
| `usage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | No | n/a | Token usage fallback. |
