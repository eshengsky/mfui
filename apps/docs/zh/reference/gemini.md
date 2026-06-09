---
outline: [2, 2]
---

# `@mfui/gemini`

`@mfui/gemini` 把 Gemini SSE 流转换成 MFUI 语义 SSE 流。

当上游 stream 输出 `text`，或输出 `candidates[].content.parts[].text` 时，
使用这个包。

## `createMFUIResponse()`

根据上游 Gemini 流创建 MFUI 语义 SSE `Response`。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | 是 | 无 | Provider `Response`、response body stream，或 `null`。 |
| `mfui` | <code><a href="/zh/reference/server#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 当前请求可用的组件。 |
| `options` | <code><a href="#geminimfuiresponseoptions">GeminiMFUIResponseOptions</a></code> | 否 | `{}` | Response、parser、writer 和生命周期选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Response` | 输出 MFUI 语义 SSE 事件的 `text/event-stream` response。 |

### 示例

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

### 注意事项

Provider 处理失败时，返回的 MFUI stream 会输出 `error` 事件并关闭。传入
`onError` 时会调用它。

## `GeminiStreamSource`

`createMFUIResponse()`、`readStream()` 和 `pipeMFUIStream()` 接受的 source。

### 结构

```ts
type GeminiStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `GeminiMFUIResponseOptions`

`createMFUIResponse()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | 否 | `true` | Provider stream 结束时是否关闭 MFUI parser 和 writer。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | 否 | `{}` | 传给 `createMFUIBlockParser()` 的选项。 |
| `writer` | <code><a href="/zh/reference/server#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | 否 | `{}` | 传给 `createMFUIStreamWriter()` 的选项。 |
| `responseInit` | `ResponseInit` | 否 | `{}` | 传给返回 `Response` 的 init 对象。 |
| `onMessage` | <code><a href="/zh/reference/server#mfuimessagehandler">MFUIMessageHandler</a></code> | 否 | 无 | MFUI response 完成后，使用最终投影消息调用。 |
| `onError` | <code><a href="/zh/reference/server#mfuierrorhandler">MFUIErrorHandler</a></code> | 否 | 无 | Provider stream 处理或 MFUI block 解析失败时调用。 |

## `readStream()`

读取 Gemini SSE 事件，并产出 JSON chunk。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | 是 | 无 | Provider SSE source。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#geministreamchunk">GeminiStreamChunk</a>&gt;</code> | 解析后的 provider chunks。 |

## `GeminiStreamChunk`

`writeMFUIStream()` 消费的 provider chunk 结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `text` | `string` | 否 | 无 | 直接文本 chunk。存在时优先使用。 |
| `candidates` | `Array<Record<string, unknown>>` | 否 | 无 | Candidate 对象。文本会从 `candidate.content.parts[].text` 读取。 |
| `usageMetadata` | <code><a href="#geminiusagemetadata">GeminiUsageMetadata</a></code> | 否 | 无 | Token 用量元数据。 |
| `[key]` | `unknown` | 否 | 无 | MFUI 会忽略额外 provider 字段。 |

## `GeminiUsageMetadata`

从 Gemini chunk 中读取的用量元数据。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `promptTokenCount` | `number` | 否 | 无 | 映射为 MFUI `inputTokens`。 |
| `candidatesTokenCount` | `number` | 否 | 无 | 映射为 MFUI `outputTokens`。 |
| `[key]` | `unknown` | 否 | 无 | MFUI 会忽略额外 usage 字段。 |

## `writeMFUIStream()`

把解析后的 Gemini chunks 写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#geministreamchunk">GeminiStreamChunk</a>&gt;</code> | 是 | 无 | 解析后的 provider chunks。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 provider 文本增量的 MFUI block parser。 |
| `options` | <code><a href="#geminimfuistreamoptions">GeminiMFUIStreamOptions</a></code> | 否 | `{}` | 写入选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Promise<void>` | Provider stream 完全消费，且 parser flush 或 close 后 resolve。 |

## `GeminiMFUIStreamOptions`

`writeMFUIStream()` 和 `pipeMFUIStream()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | 否 | `true` | Provider stream 结束时是否调用 `parser.close()`。为 `false` 时会改为调用 `parser.flush()`。 |

## `pipeMFUIStream()`

读取 provider SSE source，并写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#geministreamsource">GeminiStreamSource</a></code> | 是 | 无 | Provider SSE source。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 provider 文本增量的 MFUI block parser。 |
| `options` | <code><a href="#geminimfuistreamoptions">GeminiMFUIStreamOptions</a></code> | 否 | `{}` | 写入选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Promise<void>` | Provider stream 消费完成后 resolve。 |
