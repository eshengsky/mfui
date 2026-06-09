---
outline: [2, 2]
---

# `@mfui/openai-compatible`

`@mfui/openai-compatible` adapts Chat Completions-compatible SSE streams into
MFUI semantic SSE streams.

Use this package when your provider returns OpenAI Chat Completions-style
chunks with `choices[].delta.content`.

## `createMFUIResponse()`

Creates an MFUI semantic SSE `Response` from an upstream Chat Completions stream.

### Import

```ts
import { createMFUIResponse } from '@mfui/openai-compatible';
```

### Signature

```ts
function createMFUIResponse(
  source: OpenAICompatibleStreamSource,
  mfui: MFUIManifest,
  options?: OpenAICompatibleMFUIResponseOptions,
): Response
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openaicompatiblestreamsource">OpenAICompatibleStreamSource</a></code> | Yes | n/a | Provider `Response`, response body stream, or `null`. |
| `mfui` | <code><a href="/reference/server#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components available to this request. |
| `options` | <code><a href="#openaicompatiblemfuiresponseoptions">OpenAICompatibleMFUIResponseOptions</a></code> | No | `{}` | Response, parser, writer, and lifecycle options. |

### Returns

| Type | Description |
| --- | --- |
| `Response` | `text/event-stream` response that emits MFUI semantic SSE events. |

### Example

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-compatible';

const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: [
          'You are a helpful assistant.',
          createMFUIPrompt(mfui),
        ].join('\n\n'),
      },
      ...messages,
    ],
    stream: true,
  }),
});

return createMFUIResponse(upstream, mfui, {
  onMessage(message) {
    saveAssistantMessage(message);
  },
});
```

### Notes

When provider processing fails, the returned MFUI stream emits an `error` event
and then closes. `onError` is called when provided.

## `OpenAICompatibleStreamSource`

Source accepted by `createMFUIResponse()`, `readStream()`, and
`pipeMFUIStream()`.

### Shape

```ts
type OpenAICompatibleStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `OpenAICompatibleMFUIResponseOptions`

Options for `createMFUIResponse()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to close the MFUI parser and writer when the provider stream finishes. Set to `false` only when another process will close the parser. |
| `parser` | <code><a href="/reference/server#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | No | `{}` | Options passed to `createMFUIBlockParser()`. |
| `writer` | <code><a href="/reference/server#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | No | `{}` | Options passed to `createMFUIStreamWriter()`. |
| `responseInit` | `ResponseInit` | No | `{}` | Init object passed to the returned `Response`. |
| `onMessage` | <code><a href="/reference/server#mfuimessagehandler">MFUIMessageHandler</a></code> | No | n/a | Called with the final projected message after the MFUI response finishes. |
| `onError` | <code><a href="/reference/server#mfuierrorhandler">MFUIErrorHandler</a></code> | No | n/a | Called when provider stream processing or MFUI block parsing fails. |

## `readStream()`

Reads Chat Completions SSE events and yields JSON chunks.

### Import

```ts
import { readStream } from '@mfui/openai-compatible';
```

### Signature

```ts
function readStream(
  source: OpenAICompatibleStreamSource,
): AsyncIterable<OpenAICompatibleStreamChunk>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openaicompatiblestreamsource">OpenAICompatibleStreamSource</a></code> | Yes | n/a | Provider SSE source. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#openaicompatiblestreamchunk">OpenAICompatibleStreamChunk</a>&gt;</code> | Parsed provider chunks. `[DONE]` sentinel events are skipped. |

## `OpenAICompatibleStreamChunk`

Provider chunk shape consumed by `writeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `choices` | `Array<{ delta?: Record<string, unknown> }>` | No | n/a | Chat Completions choices. `delta.content` string values are appended to the MFUI block parser. |
| `usage` | `Record<string, unknown>` | No | n/a | Token usage. `prompt_tokens` maps to `inputTokens`; `completion_tokens` maps to `outputTokens`. |
| `[key]` | `unknown` | No | n/a | Additional provider fields are ignored by MFUI. |

## `writeMFUIStream()`

Writes parsed provider chunks into an MFUI block parser.

### Import

```ts
import { writeMFUIStream } from '@mfui/openai-compatible';
```

### Signature

```ts
function writeMFUIStream(
  stream: AsyncIterable<OpenAICompatibleStreamChunk>,
  parser: MFUIBlockParser,
  options?: OpenAICompatibleMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#openaicompatiblestreamchunk">OpenAICompatibleStreamChunk</a>&gt;</code> | Yes | n/a | Parsed provider chunks. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#openaicompatiblemfuistreamoptions">OpenAICompatibleMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is fully consumed and the parser is flushed or closed. |

## `OpenAICompatibleMFUIStreamOptions`

Options for `writeMFUIStream()` and `pipeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to call `parser.close()` when the provider stream ends. When `false`, `parser.flush()` is called instead. |

## `pipeMFUIStream()`

Reads a provider SSE source and writes it into an MFUI block parser.

### Import

```ts
import { pipeMFUIStream } from '@mfui/openai-compatible';
```

### Signature

```ts
function pipeMFUIStream(
  source: OpenAICompatibleStreamSource,
  parser: MFUIBlockParser,
  options?: OpenAICompatibleMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openaicompatiblestreamsource">OpenAICompatibleStreamSource</a></code> | Yes | n/a | Provider SSE source. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#openaicompatiblemfuistreamoptions">OpenAICompatibleMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is consumed. |
