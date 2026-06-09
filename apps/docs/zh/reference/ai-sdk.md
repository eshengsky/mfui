---
outline: [2, 2]
---

# `@mfui/ai-sdk`

`@mfui/ai-sdk` 把 Vercel AI SDK 的流式结果转换成 MFUI 语义 SSE 流。

当服务端已经使用 `streamText()`，或其他暴露 `textStream`、`fullStream`、
`consumeStream()` 的 AI SDK API 时，使用这个包。

## `createMFUIResponse()`

根据 AI SDK 流式结果创建 MFUI 语义 SSE `Response`。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `result` | <code><a href="#aisdkmfuiresponseresult">AISDKMFUIResponseResult</a></code> | 是 | 无 | AI SDK 流式结果。 |
| `mfui` | <code><a href="/zh/reference/server#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 当前请求可用的组件。 |
| `options` | <code><a href="#aisdkmfuiresponseoptions">AISDKMFUIResponseOptions</a></code> | 否 | `{}` | Response、parser、writer 和生命周期选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Response` | 输出 MFUI 语义 SSE 事件的 `text/event-stream` response。 |

### 示例

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

### 注意事项

`createMFUIResponse()` 会优先使用 `result.textStream`，然后是
`result.fullStream`，最后回退到 `result.consumeStream()`。

## `AISDKMFUIResponseResult`

`createMFUIResponse()` 接受的 AI SDK result 结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `consumeStream(options)` | <code>(options?: { onError?: (error: unknown) =&gt; void }) =&gt; Promise&lt;void&gt;</code> | 是 | 无 | 消费 stream 的 AI SDK 方法。缺少 `textStream` 和 `fullStream` 时使用。 |
| `textStream` | `AsyncIterable<string>` | 否 | 无 | 普通文本 chunk stream。存在时优先使用。 |
| `fullStream` | <code>AsyncIterable&lt;<a href="#aisdkmfuichunk">AISDKMFUIChunk</a>&gt;</code> | 否 | 无 | AI SDK chunk stream。缺少 `textStream` 时使用。 |
| `totalUsage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | 否 | 无 | Stream 消费后读取的 token 用量，优先级高于 `usage`。 |
| `usage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | 否 | 无 | Token 用量 fallback。 |

## `AISDKMFUIResponseOptions`

`createMFUIResponse()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `close` | `boolean` | 否 | `true` | AI SDK stream 结束时是否关闭 MFUI parser 和 writer。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | 否 | `{}` | 传给 `createMFUIBlockParser()` 的选项。 |
| `writer` | <code><a href="/zh/reference/server#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | 否 | `{}` | 传给 `createMFUIStreamWriter()` 的选项。 |
| `responseInit` | `ResponseInit` | 否 | `{}` | 传给返回 `Response` 的 init 对象。 |
| `onMessage` | <code><a href="/zh/reference/server#mfuimessagehandler">MFUIMessageHandler</a></code> | 否 | 无 | MFUI response 完成后，使用最终投影消息调用。 |
| `onError` | <code><a href="/zh/reference/server#mfuierrorhandler">MFUIErrorHandler</a></code> | 否 | 无 | Stream 处理或 MFUI block 解析失败时调用。 |

## `AISDKMFUIChunk`

`writeMFUIChunk()` 消费的 AI SDK full-stream chunk 结构。

### 结构

```ts
type AISDKMFUIChunk =
  | { type: 'text'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'text-delta'; textDelta: string }
  | { type: 'finish'; totalUsage?: AISDKUsage }
  | { type: 'error'; error: unknown }
  | Record<string, unknown>
```

### 注意事项

MFUI 只读取 `text` chunk 和 `text-delta` chunk，其他 chunk 会被忽略。

## `AISDKUsage`

复制到最终 MFUI `message.end` 事件里的 token 用量结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `inputTokens` | `number` | 否 | 无 | 输入 token 数。 |
| `outputTokens` | `number` | 否 | 无 | 输出 token 数。 |

## `createMFUIOnChunk()`

创建一个 AI SDK `onChunk` 回调，把文本 chunk 写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 AI SDK 文本 chunk 的 MFUI block parser。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `(event: { chunk: AISDKMFUIChunk }) => void` | 可传给暴露 chunk event 的 AI SDK API 的回调。 |

## `writeMFUIChunk()`

把单个 AI SDK full-stream chunk 写入 MFUI block parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `chunk` | <code><a href="#aisdkmfuichunk">AISDKMFUIChunk</a></code> | 是 | 无 | AI SDK chunk。只有文本 chunk 会写入 parser。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 接收 AI SDK 文本 chunk 的 MFUI block parser。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `void` | 不返回任何内容。 |

## `consumeMFUIStream()`

通过 `result.consumeStream()` 消费 AI SDK stream，然后关闭或 flush MFUI block
parser。

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

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `result` | <code><a href="#aisdkconsumestreamresult">AISDKConsumeStreamResult</a></code> | 是 | 无 | 包含 `consumeStream()` 的 AI SDK result。 |
| `parser` | <code><a href="/zh/reference/server#mfuiblockparser">MFUIBlockParser</a></code> | 是 | 无 | 要关闭或 flush 的 MFUI block parser。 |
| `options` | `{ close?: boolean }` | 否 | `{}` | `close` 为 `false` 时调用 `parser.flush()`，否则调用 `parser.close()`。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `Promise<void>` | AI SDK stream 消费完成，且 parser flush 或 close 后 resolve。 |

## `AISDKConsumeStreamResult`

`consumeMFUIStream()` 消费的最小 AI SDK result 结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `consumeStream(options)` | <code>(options?: { onError?: (error: unknown) =&gt; void }) =&gt; Promise&lt;void&gt;</code> | 是 | 无 | 用于消费 AI SDK stream 的方法。 |
| `totalUsage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | 否 | 无 | Stream 消费后读取的 token 用量，优先级高于 `usage`。 |
| `usage` | <code>PromiseLike&lt;<a href="#aisdkusage">AISDKUsage</a>&gt; &#124; <a href="#aisdkusage">AISDKUsage</a></code> | 否 | 无 | Token 用量 fallback。 |
