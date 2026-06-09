---
outline: [2, 2]
---

# `@mfui/anthropic`

`@mfui/anthropic` adapts Anthropic Messages SSE streams into MFUI semantic SSE
streams.

Use this package when the upstream stream emits Anthropic events such as
`content_block_delta`, `message_start`, and `message_delta`.

## `createMFUIResponse()`

Creates an MFUI semantic SSE `Response` from an upstream Anthropic stream.

### Import

```ts
import { createMFUIResponse } from '@mfui/anthropic';
```

### Signature

```ts
function createMFUIResponse(
  source: AnthropicStreamSource,
  mfui: MFUIManifest,
  options?: AnthropicMFUIResponseOptions,
): Response
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | Yes | n/a | Provider `Response`, response body stream, or `null`. |
| `mfui` | <code><a href="/reference/server#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components available to this request. |
| `options` | <code><a href="#anthropicmfuiresponseoptions">AnthropicMFUIResponseOptions</a></code> | No | `{}` | Response, parser, writer, and lifecycle options. |

### Returns

| Type | Description |
| --- | --- |
| `Response` | `text/event-stream` response that emits MFUI semantic SSE events. |

### Example

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/anthropic';

const upstream = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5',
    system: [
      'You are a helpful assistant.',
      createMFUIPrompt(mfui),
    ].join('\n\n'),
    messages,
    stream: true,
  }),
});

return createMFUIResponse(upstream, mfui);
```

### Notes

When provider processing fails, the returned MFUI stream emits an `error` event
and then closes. `onError` is called when provided.

## `AnthropicStreamSource`

Source accepted by `createMFUIResponse()`, `readStream()`, and
`pipeMFUIStream()`.

### Shape

```ts
type AnthropicStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `AnthropicMFUIResponseOptions`

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

Reads Anthropic SSE events and yields normalized JSON events.

### Import

```ts
import { readStream } from '@mfui/anthropic';
```

### Signature

```ts
function readStream(
  source: AnthropicStreamSource,
): AsyncIterable<AnthropicStreamEvent>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | Yes | n/a | Provider SSE source. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#anthropicstreamevent">AnthropicStreamEvent</a>&gt;</code> | Parsed provider events. The `type` field is taken from the SSE event name when present, otherwise from `data.type`. |

## `AnthropicStreamEvent`

Provider event shape consumed by `writeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `string` | No | n/a | Provider event type. MFUI reads `message_start`, `content_block_delta`, and `message_delta`. |
| `message` | `Record<string, unknown>` | No | n/a | Message object. `message.usage.input_tokens` maps to `inputTokens`. |
| `delta` | `Record<string, unknown>` | No | n/a | Content block delta. Text is read when `delta.type` is `text_delta` and `delta.text` is a string. |
| `usage` | `Record<string, unknown>` | No | n/a | Message delta usage. `usage.output_tokens` maps to `outputTokens`. |
| `[key]` | `unknown` | No | n/a | Additional provider fields are ignored by MFUI. |

## `writeMFUIStream()`

Writes parsed Anthropic events into an MFUI block parser.

### Import

```ts
import { writeMFUIStream } from '@mfui/anthropic';
```

### Signature

```ts
function writeMFUIStream(
  stream: AsyncIterable<AnthropicStreamEvent>,
  parser: MFUIBlockParser,
  options?: AnthropicMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#anthropicstreamevent">AnthropicStreamEvent</a>&gt;</code> | Yes | n/a | Parsed provider events. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#anthropicmfuistreamoptions">AnthropicMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is fully consumed and the parser is flushed or closed. |

## `AnthropicMFUIStreamOptions`

Options for `writeMFUIStream()` and `pipeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to call `parser.close()` when the provider stream ends. When `false`, `parser.flush()` is called instead. |

## `pipeMFUIStream()`

Reads a provider SSE source and writes it into an MFUI block parser.

### Import

```ts
import { pipeMFUIStream } from '@mfui/anthropic';
```

### Signature

```ts
function pipeMFUIStream(
  source: AnthropicStreamSource,
  parser: MFUIBlockParser,
  options?: AnthropicMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | Yes | n/a | Provider SSE source. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#anthropicmfuistreamoptions">AnthropicMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is consumed. |
