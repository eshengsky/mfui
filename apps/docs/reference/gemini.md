---
outline: [2, 2]
---

# `@mfui/gemini`

`@mfui/gemini` adapts Gemini SSE streams into MFUI semantic SSE streams.

Use this package when the upstream stream emits Gemini chunks with either `text`
or `candidates[].content.parts[].text`.

## `createMFUIResponse()`

Creates an MFUI semantic SSE `Response` from an upstream Gemini stream.

### Import

```ts
import { createMFUIResponse } from '@mfui/gemini';
```

### Signature

```ts
function createMFUIResponse(
  source: GeminiStreamSource,
  mfui: MFUIManifest,
  options?: GeminiMFUIResponseOptions,
): Response
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | Yes | n/a | Provider `Response`, response body stream, or `null`. |
| `mfui` | <code><a href="/reference/server#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components available to this request. |
| `options` | <code><a href="#geminimfuiresponseoptions">GeminiMFUIResponseOptions</a></code> | No | `{}` | Response, parser, writer, and lifecycle options. |

### Returns

| Type | Description |
| --- | --- |
| `Response` | `text/event-stream` response that emits MFUI semantic SSE events. |

### Example

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/gemini';

const upstream = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: [
              'You are a helpful assistant.',
              createMFUIPrompt(mfui),
            ].join('\n\n'),
          },
        ],
      },
      contents,
    }),
  },
);

return createMFUIResponse(upstream, mfui);
```

### Notes

When provider processing fails, the returned MFUI stream emits an `error` event
and then closes. `onError` is called when provided.

## `GeminiStreamSource`

Source accepted by `createMFUIResponse()`, `readStream()`, and
`pipeMFUIStream()`.

### Shape

```ts
type GeminiStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `GeminiMFUIResponseOptions`

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

Reads Gemini SSE events and yields JSON chunks.

### Import

```ts
import { readStream } from '@mfui/gemini';
```

### Signature

```ts
function readStream(
  source: GeminiStreamSource,
): AsyncIterable<GeminiStreamChunk>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | Yes | n/a | Provider SSE source. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#geministreamchunk">GeminiStreamChunk</a>&gt;</code> | Parsed provider chunks. |

## `GeminiStreamChunk`

Provider chunk shape consumed by `writeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `string` | No | n/a | Direct text chunk. Used before candidate text parts when present. |
| `candidates` | `Array<Record<string, unknown>>` | No | n/a | Candidate objects. Text is read from `candidate.content.parts[].text`. |
| `usageMetadata` | <code><a href="#geminiusagemetadata">GeminiUsageMetadata</a></code> | No | n/a | Token usage metadata. |
| `[key]` | `unknown` | No | n/a | Additional provider fields are ignored by MFUI. |

## `GeminiUsageMetadata`

Usage metadata read from Gemini chunks.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `promptTokenCount` | `number` | No | n/a | Maps to MFUI `inputTokens`. |
| `candidatesTokenCount` | `number` | No | n/a | Maps to MFUI `outputTokens`. |
| `[key]` | `unknown` | No | n/a | Additional usage fields are ignored by MFUI. |

## `writeMFUIStream()`

Writes parsed Gemini chunks into an MFUI block parser.

### Import

```ts
import { writeMFUIStream } from '@mfui/gemini';
```

### Signature

```ts
function writeMFUIStream(
  stream: AsyncIterable<GeminiStreamChunk>,
  parser: MFUIBlockParser,
  options?: GeminiMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#geministreamchunk">GeminiStreamChunk</a>&gt;</code> | Yes | n/a | Parsed provider chunks. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#geminimfuistreamoptions">GeminiMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is fully consumed and the parser is flushed or closed. |

## `GeminiMFUIStreamOptions`

Options for `writeMFUIStream()` and `pipeMFUIStream()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | No | `true` | Whether to call `parser.close()` when the provider stream ends. When `false`, `parser.flush()` is called instead. |

## `pipeMFUIStream()`

Reads a provider SSE source and writes it into an MFUI block parser.

### Import

```ts
import { pipeMFUIStream } from '@mfui/gemini';
```

### Signature

```ts
function pipeMFUIStream(
  source: GeminiStreamSource,
  parser: MFUIBlockParser,
  options?: GeminiMFUIStreamOptions,
): Promise<void>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | Yes | n/a | Provider SSE source. |
| `parser` | <code><a href="/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | Yes | n/a | MFUI block parser receiving provider text deltas. |
| `options` | <code><a href="#geminimfuistreamoptions">GeminiMFUIStreamOptions</a></code> | No | `{}` | Stream writing options. |

### Returns

| Type | Description |
| --- | --- |
| `Promise<void>` | Resolves after the provider stream is consumed. |
