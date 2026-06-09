---
outline: [2, 2]
---

# `@mfui/anthropic`

`@mfui/anthropic` 把 Anthropic Messages SSE 流转换成 MFUI 语义 SSE 流。

当上游 stream 输出 `content_block_delta`、`message_start`、`message_delta`
等 Anthropic 事件时，使用这个包。

## `createMFUIResponse()`

根据上游 Anthropic 流创建 MFUI 语义 SSE `Response`。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | 是 | 无 | Provider `Response`、response body stream，或 `null`。 |
| `mfui` | <code><a href="/zh/reference/server#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 当前请求可用的组件。 |
| `options` | <code><a href="#anthropicmfuiresponseoptions">AnthropicMFUIResponseOptions</a></code> | 否 | `{}` | Response、parser、writer 和生命周期选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Response` | 输出 MFUI 语义 SSE 事件的 `text/event-stream` response。 |

### 示例

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

### 注意事项

Provider 处理失败时，返回的 MFUI stream 会输出 `error` 事件并关闭。传入
`onError` 时会调用它。

## `AnthropicStreamSource`

`createMFUIResponse()`、`readStream()` 和 `pipeMFUIStream()` 接受的 source。

### 结构

```ts
type AnthropicStreamSource =
  | Response
  | ReadableStream<Uint8Array>
  | null
```

## `AnthropicMFUIResponseOptions`

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

读取 Anthropic SSE 事件，并产出标准化 JSON event。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | 是 | 无 | Provider SSE source。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#anthropicstreamevent">AnthropicStreamEvent</a>&gt;</code> | 解析后的 provider events。`type` 优先来自 SSE event name，否则来自 `data.type`。 |

## `AnthropicStreamEvent`

`writeMFUIStream()` 消费的 provider event 结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `string` | 否 | 无 | Provider event 类型。MFUI 会读取 `message_start`、`content_block_delta` 和 `message_delta`。 |
| `message` | `Record<string, unknown>` | 否 | 无 | Message 对象。`message.usage.input_tokens` 映射为 `inputTokens`。 |
| `delta` | `Record<string, unknown>` | 否 | 无 | Content block delta。当 `delta.type` 是 `text_delta` 且 `delta.text` 是字符串时会读取文本。 |
| `usage` | `Record<string, unknown>` | 否 | 无 | Message delta usage。`usage.output_tokens` 映射为 `outputTokens`。 |
| `[key]` | `unknown` | 否 | 无 | MFUI 会忽略额外 provider 字段。 |

## `writeMFUIStream()`

把解析后的 Anthropic events 写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `stream` | <code>AsyncIterable&lt;<a href="#anthropicstreamevent">AnthropicStreamEvent</a>&gt;</code> | 是 | 无 | 解析后的 provider events。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 provider 文本增量的 MFUI block parser。 |
| `options` | <code><a href="#anthropicmfuistreamoptions">AnthropicMFUIStreamOptions</a></code> | 否 | `{}` | 写入选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Promise<void>` | Provider stream 完全消费，且 parser flush 或 close 后 resolve。 |

## `AnthropicMFUIStreamOptions`

`writeMFUIStream()` 和 `pipeMFUIStream()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | 否 | `true` | Provider stream 结束时是否调用 `parser.close()`。为 `false` 时会改为调用 `parser.flush()`。 |

## `pipeMFUIStream()`

读取 provider SSE source，并写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#anthropicstreamsource">AnthropicStreamSource</a></code> | 是 | 无 | Provider SSE source。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 provider 文本增量的 MFUI block parser。 |
| `options` | <code><a href="#anthropicmfuistreamoptions">AnthropicMFUIStreamOptions</a></code> | 否 | `{}` | 写入选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Promise<void>` | Provider stream 消费完成后 resolve。 |
