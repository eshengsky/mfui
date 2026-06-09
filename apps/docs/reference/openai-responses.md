---
outline: [2, 2]
---

# `@mfui/openai-responses`

`@mfui/openai-responses` adapts OpenAI Responses SSE streams into MFUI
semantic SSE streams.

Use this package when the upstream stream emits Responses API events such as
`response.output_text.delta` and `response.completed`.

## `createMFUIResponse()`

Creates an MFUI semantic SSE `Response` from an upstream OpenAI Responses stream.

### Import

```ts
import { createMFUIResponse } from '@mfui/openai-responses';
```

### Signature

```ts
function createMFUIResponse(
  source: OpenAIResponsesStreamSource,
  mfui: MFUIManifest,
  options?: OpenAIResponsesMFUIResponseOptions,
): Response
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openairesponsesstreamsource">OpenAIResponsesStreamSource</a></code> | Yes | n/a | Provider `Response`, response body stream, or `null`. |
| `mfui` | <code><a href="/reference/server#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components available to this request. |
| `options` | <code><a href="#openairesponsesmfuiresponseoptions">OpenAIResponsesMFUIResponseOptions</a></code> | No | `{}` | Response, parser, writer, and lifecycle options. |

### Returns

| Type | Description |
| --- | --- |
| `Response` | `text/event-stream` response that emits MFUI semantic SSE events. |

### Example

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-responses';

const upstream = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    instructions: [
      'You are a helpful assistant.',
      createMFUIPrompt(mfui),
    ].join('\n\n'),
    input: messages,
    stream: true,
  }),
});

return createMFUIResponse(upstream, mfui);
```

### Notes

When provider processing fails, the returned MFUI stream emits an `error` event
and then closes. `onError` is called when provided.

## `OpenAIResponsesStreamSource`

Source accepted by `createMFUIResponse()`, `readStream()`, and
`pipeMFUIStream()`.

### Shape

```ts
type OpenAIResponsesStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `OpenAIResponsesMFUIResponseOptions`

Options for `createMFUIResponse()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to close the MFUI parser and writer when the provider stream finishes. |
| `parser` | <code><a href="/reference/server#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | No | `{}` | Options passed to `createMFUIBlockParser()`. |
| `writer` | <code><a href="/reference/server#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | No | `{}` | Options passed to `createMFUIStreamWriter()`. |
| `responseInit` | `ResponseInit` | No | `{}` | Init object passed to the returned `Response`. |
| `onMessage` | <code><a href="/reference/server#mfuimessagehandler">MFUIMessageHandler</a></code> | No | n/a | Called with the final projected message after the MFUI response finishes. |
| `onError` | <code><a href="/reference/server#mfuierrorhandler">MFUIErrorHandler</a></code> | No | n/a | Called when provider stream processing or MFUI block parsing fails. |

## `readStream()`

Reads OpenAI Responses SSE events and yields normalized JSON events.

### Import

```ts
import { readStream } from '@mfui/openai-responses';
```

### Signature

```ts
function readStream(
  source: OpenAIResponsesStreamSource,
): AsyncIterable<OpenAIResponsesStreamEvent>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openairesponsesstreamsource">OpenAIResponsesStreamSource</a></code> | Yes | n/a | Provider SSE source. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#openairesponsesstreamevent">OpenAIResponsesStreamEvent</a>&gt;</code> | Parsed provider events. The `type` field is taken from the SSE event name when present, otherwise from `data.type`. |

## `OpenAIResponsesStreamEvent`

Provider event shape consumed by `writeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `string` | No | n/a | Provider event type. MFUI reads `response.output_text.delta` and `response.completed`. |
| `delta` | `string` | No | n/a | Text delta used when `type` is `response.output_text.delta`. |
| `response` | `Record<string, unknown>` | No | n/a | Completed response object. `response.usage.input_tokens` and `response.usage.output_tokens` map to MFUI usage. |
| `[key]` | `unknown` | No | n/a | Additional provider fields are ignored by MFUI. |

## `writeMFUIStream()`

Writes parsed Responses events into an MFUI block parser.

### Import

```ts
import { writeMFUIStream } from '@mfui/openai-responses';
```

### Signature

```ts
function writeMFUIStream(
  stream: AsyncIterable<OpenAIResponsesStreamEvent>,
  parser: MFUIBlockParser,
  options?: OpenAIResponsesMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#openairesponsesstreamevent">OpenAIResponsesStreamEvent</a>&gt;</code> | Yes | n/a | Parsed provider events. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#openairesponsesmfuistreamoptions">OpenAIResponsesMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is fully consumed and the parser is flushed or closed. |

## `OpenAIResponsesMFUIStreamOptions`

Options for `writeMFUIStream()` and `pipeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to call `parser.close()` when the provider stream ends. When `false`, `parser.flush()` is called instead. |

## `pipeMFUIStream()`

Reads a provider SSE source and writes it into an MFUI block parser.

### Import

```ts
import { pipeMFUIStream } from '@mfui/openai-responses';
```

### Signature

```ts
function pipeMFUIStream(
  source: OpenAIResponsesStreamSource,
  parser: MFUIBlockParser,
  options?: OpenAIResponsesMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#openairesponsesstreamsource">OpenAIResponsesStreamSource</a></code> | Yes | n/a | Provider SSE source. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#openairesponsesmfuistreamoptions">OpenAIResponsesMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is consumed. |
