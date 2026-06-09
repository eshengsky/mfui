---
outline: [2, 2]
---

# `@mfui/server`

`@mfui/server` 是服务端 SDK，用于生成 MFUI 提示词、解析模型输出、
校验组件 spec，并返回 MFUI 语义 SSE 响应。

大多数 adapter 包会在内部使用这些基础能力。应用服务端只有在自定义模型接入时，
才需要直接使用这些原语。

## `createMFUIPrompt()`

为当前请求可用的组件和布局生成模型提示词。提示词会告诉模型如何输出普通文本，以及什么时候插入 `<mfui>` 块。

### Import

```ts
import { createMFUIPrompt } from '@mfui/server';
```

### Signature

```ts
function createMFUIPrompt(mfui: MFUIManifest): string
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 当前模型请求可用的组件和布局。`null` 和 `undefined` 会被视为未启用 MFUI。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `string` | 包含组件描述、布局描述、JSON Schema、示例和 MFUI block 指令的提示词。当 MFUI 未启用或没有组件和布局时返回空字符串。 |

### 示例

```ts
import { createMFUIPrompt } from '@mfui/server';

const system = [
  'You are a helpful assistant.',
  createMFUIPrompt(mfui),
].filter(Boolean).join('\n\n');
```

### Throws

当传入 manifest 形状非法时抛出 `MFUIServerError`。

## `buildComponentCatalogText()`

只生成 MFUI 提示词里的组件目录部分。

### Import

```ts
import { buildComponentCatalogText } from '@mfui/server';
```

### Signature

```ts
function buildComponentCatalogText(mfui: MFUIManifest): string
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 要展示给模型的组件。`null` 和 `undefined` 会被视为未启用 MFUI。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `string` | 人类可读的组件目录文本。没有组件时返回空字符串。 |

## `buildLayoutCatalogText()`

只生成 MFUI 提示词里的布局目录部分。

### Import

```ts
import { buildLayoutCatalogText } from '@mfui/server';
```

### Signature

```ts
function buildLayoutCatalogText(mfui: MFUIManifest): string
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 要展示给模型的内置布局。`null` 和 `undefined` 会被视为未启用 MFUI。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `string` | 人类可读的布局目录文本。没有布局时返回空字符串。 |

## `MFUIManifest`

从客户端发送到服务端的可序列化 manifest。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifest">ComponentManifest</a>[]</code> | 是 | 无 | 当前模型请求可用的组件。 |
| `layouts` | <code>Array&lt;{ name: string; model?: { description: string; whenToUse?: string; examples?: Array&lt;{ user: string; spec: unknown }&gt; }; metadata?: JsonObject }&gt;</code> | 否 | 无 | 当前模型请求可用的内置布局。 |

## `ComponentManifest`

单个组件的可序列化 manifest。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `name` | `string` | 是 | 无 | 稳定组件名，用于模型输出、流事件和渲染器查找。 |
| `schema` | <code><a href="#jsonschema">JsonSchema</a></code> | 是 | 无 | 组件 spec 的 JSON Schema。 |
| `projection` | `{ text: string }` | 是 | 无 | 把合法组件 spec 投影成可移植文本的模板。 |
| `model` | `{ description: string; whenToUse?: string; examples?: Array<{ user: string; spec: unknown }> }` | 否 | 无 | `createMFUIPrompt()` 使用的模型侧组件说明。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 可序列化应用元数据。 |

## `JsonSchema`

服务端用于校验组件 spec 的 JSON Schema 对象。

### 结构

```ts
type JsonSchema = JsonObject
```

## `JsonObject`

JSON 兼容对象结构。

### 结构

```ts
type JsonObject = Record<string, unknown>
```

## `createMFUIStreamWriter()`

创建 MFUI 语义 SSE writer。自定义 provider adapter，或者在服务端测试 MFUI
stream 时可以直接使用。

### Import

```ts
import { createMFUIStreamWriter } from '@mfui/server';
```

### Signature

```ts
function createMFUIStreamWriter(
  mfui: MFUIManifest,
  options?: MFUIStreamWriterOptions,
): MFUIStreamWriter
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 用于校验组件快照并渲染投影的 manifest。 |
| `options` | <code><a href="#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | 否 | `{}` | Writer 选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#mfuistreamwriter">MFUIStreamWriter</a></code> | 负责输出 MFUI 语义 SSE 事件并暴露 `Response` 的状态对象。 |

### 示例

```ts
import {
  createMFUIBlockParser,
  createMFUIStreamWriter,
} from '@mfui/server';

const writer = createMFUIStreamWriter(mfui);
const parser = createMFUIBlockParser(mfui, writer);

parser.write('Here is the plan:\n\n');
parser.write('<mfui>{"component":"app.task_list","spec":{"title":"Next","items":[]}}</mfui>');
parser.close();

return writer.response();
```

### Throws

当传入 manifest 形状非法时抛出 `MFUIServerError`。

## `MFUIStreamWriterOptions`

`createMFUIStreamWriter()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 否 | 生成的 `msg_*` id | 用在 `message.start` 和 `message.end` 事件里的消息 id。 |

## `MFUIStreamWriter`

`createMFUIStreamWriter()` 返回的 writer。

| 方法 | 类型 | 描述 |
| --- | --- | --- |
| `start()` | `() => void` | 如果 stream 尚未开始，则输出 `message.start`。`text()`、`component()` 和 `end()` 会自动调用它。 |
| `text(text, options)` | `(text: string, options?: { partId?: string }) => void` | 输出 text delta，并追加到当前投影消息中。空字符串会被忽略。 |
| `component(input)` | <code>(input: <a href="#mfuicomponentinput">MFUIComponentInput</a>) =&gt; ProjectedComponentPart</code> | 校验组件 spec、渲染投影、输出 `component.snapshot`，并返回投影后的 component part。 |
| `error(input)` | <code>(input: <a href="#mfuistreamerrorinput">MFUIStreamErrorInput</a>) =&gt; void</code> | 输出 MFUI `error` 事件并关闭 stream。 |
| `end(options)` | <code>(options?: <a href="#mfuistreamwriterendoptions">MFUIStreamWriterEndOptions</a>) =&gt; void</code> | 输出带最终 portable text 的 `message.end`，并关闭 stream。 |
| `response(init)` | `(init?: ResponseInit) => Response` | 返回由 writer stream 驱动的 `text/event-stream` `Response`。 |
| `snapshot()` | <code>() =&gt; <a href="#projectedmessage">ProjectedMessage</a> &#124; undefined</code> | 返回当前投影消息；stream 开始前返回 `undefined`。 |

## `MFUIComponentInput`

`MFUIStreamWriter.component()` 的入参。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 否 | 生成的 `cmp_*` id | Component part id。 |
| `component` | `string` | 是 | 无 | 组件名。必须匹配 manifest 中的组件。 |
| `spec` | `unknown` | 是 | 无 | 要校验并投影的组件 spec。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 附加到 component part 和 stream event 的应用元数据。 |

## `MFUIStreamWriterEndOptions`

`MFUIStreamWriter.end()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `usage` | `{ inputTokens?: number; outputTokens?: number }` | 否 | 无 | 可选模型用量，会包含在最终 `message.end` 事件中。 |

## `MFUIStreamErrorInput`

`MFUIStreamWriter.error()` 的入参。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `code` | `string` | 是 | 无 | 机器可读错误码。 |
| `message` | `string` | 是 | 无 | 人类可读错误信息。 |
| `recoverable` | `boolean` | 否 | 无 | 客户端是否可能恢复。 |

## `ProjectedMessage`

`MFUIStreamWriter.snapshot()` 和 adapter `onMessage` 回调使用的投影消息结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | 无 | 消息 id。 |
| `parts` | `ProjectedMessagePart[]` | 是 | 无 | 投影后的文本、组件和布局 parts。 |
| `portableText` | `string` | 是 | 无 | 消息的确定性文本表示。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `createMFUIBlockParser()`

创建 parser，把 provider 文本输出里的 `<mfui>` 块转换成 MFUI stream writer 调用。

### Import

```ts
import { createMFUIBlockParser } from '@mfui/server';
```

### Signature

```ts
function createMFUIBlockParser(
  mfui: MFUIManifest,
  writer: MFUIStreamWriter,
  options?: MFUIBlockParserOptions,
): MFUIBlockParser
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 当前 manifest。保留该参数是为了和 writer 构造保持一致。 |
| `writer` | <code><a href="#mfuistreamwriter">MFUIStreamWriter</a></code> | 是 | 无 | 接收解析后 text 和 component 调用的 writer。 |
| `options` | <code><a href="#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | 否 | `{}` | Parser 选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#mfuiblockparser">MFUIBlockParser</a></code> | 用于 provider 文本 chunk 的增量 parser。 |

### Throws

遇到格式错误或非法的 MFUI block 时抛出 `MFUIServerError`。抛出前 writer
也会输出一个 `error` 事件。

## `MFUIBlockParserOptions`

`createMFUIBlockParser()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `maxBlockLength` | `number` | 否 | `65536` | 单个打开的 `<mfui>` block 里允许的最大字符数。 |

## `MFUIBlockParser`

`createMFUIBlockParser()` 返回的增量 parser。

| 方法 | 类型 | 描述 |
| --- | --- | --- |
| `write(text)` | `(text: string) => void` | 处理下一个 provider 文本 chunk。普通文本会发送给 `writer.text()`，完整 MFUI block 会解析后发送给 `writer.component()`。 |
| `flush()` | `() => void` | 刷出缓冲的普通文本，但不结束 writer。如果 MFUI block 仍处于打开状态则抛错。 |
| `close(options)` | <code>(options?: <a href="#mfuistreamwriterendoptions">MFUIStreamWriterEndOptions</a>) =&gt; void</code> | 刷出缓冲文本，并调用 `writer.end(options)`。 |

## `MFUI_BLOCK_TAG`

模型文本里包裹 MFUI 组件 payload 的 XML 风格 tag 名。

### Import

```ts
import { MFUI_BLOCK_TAG } from '@mfui/server';
```

### 值

```ts
const MFUI_BLOCK_TAG = 'mfui'
```

## `parseMFUIBlockPayload()`

解析 `<mfui>` block 内部的 JSON payload。

### Import

```ts
import { parseMFUIBlockPayload } from '@mfui/server';
```

### Signature

```ts
function parseMFUIBlockPayload(payload: string): MFUIComponentInput
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `payload` | `string` | 是 | 无 | `<mfui>` 和 `</mfui>` 之间的原始 JSON 字符串。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#mfuicomponentinput">MFUIComponentInput</a></code> | 从 block payload 中解析出的组件名和 spec。 |

### Throws

当 payload 不是合法 JSON、不是对象，或缺少 `component`/`spec` 时抛出
`MFUIServerError`。

## `validateMFUIManifest()`

校验 MFUI manifest 的结构。

### Import

```ts
import { validateMFUIManifest } from '@mfui/server';
```

### Signature

```ts
function validateMFUIManifest(mfui: MFUIManifest): ValidationResult
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 要校验的 manifest。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#validationresult">ValidationResult</a></code> | 合法时为 `{ ok: true }`，否则为 `{ ok: false, errors }`。 |

## `assertValidMFUIManifest()`

校验 manifest，并在非法时抛错。

### Import

```ts
import { assertValidMFUIManifest } from '@mfui/server';
```

### Signature

```ts
function assertValidMFUIManifest(mfui: MFUIManifest): void
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | 是 | 无 | 要校验的 manifest。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `void` | 合法时不返回任何内容。 |

### Throws

非法时抛出 code 为 `invalid_component_manifest` 的 `MFUIServerError`。

## `validateSpecWithManifest()`

使用单个 component manifest 校验单个组件 spec。

### Import

```ts
import { validateSpecWithManifest } from '@mfui/server';
```

### Signature

```ts
function validateSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): ValidationResult
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | 是 | 无 | 包含 JSON Schema 的 component manifest。 |
| `spec` | `unknown` | 是 | 无 | 要校验的组件 spec。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#validationresult">ValidationResult</a></code> | AJV 产生的校验结果。 |

## `ValidationResult`

校验成功或失败的联合类型。

### 结构

```ts
type ValidationResult = ValidationSuccess | ValidationFailure
```

## `ValidationSuccess`

校验成功结果。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `ok` | `true` | 是 | 无 | 成功判别字段。 |

## `ValidationFailure`

校验失败结果。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `ok` | `false` | 是 | 无 | 失败判别字段。 |
| `errors` | `string[]` | 是 | 无 | 校验错误信息。 |

## `MFUIMessageHandler`

Adapter `onMessage` 选项使用的回调类型。

### 结构

```ts
type MFUIMessageHandler = (message: ProjectedMessage) => void | Promise<void>
```

## `MFUIErrorHandler`

Adapter `onError` 选项使用的回调类型。

### 结构

```ts
type MFUIErrorHandler = (error: unknown) => void | Promise<void>
```

## `MFUIResponseHooks`

Adapter response options 复用的回调对象结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `onMessage` | <code><a href="#mfuimessagehandler">MFUIMessageHandler</a></code> | 否 | 无 | MFUI response 完成处理后，使用最终投影消息调用。 |
| `onError` | <code><a href="#mfuierrorhandler">MFUIErrorHandler</a></code> | 否 | 无 | provider stream 处理或 MFUI block 解析失败时调用。 |

## `MFUIServerError`

服务端校验、提示词、writer 和 block parser helper 抛出的错误结构。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `message` | `string` | 是 | 无 | 来自 `Error` 的人类可读错误信息。 |
| `code` | `string` | 是 | 无 | MFUI 机器可读错误码。 |
| `status` | `number` | 是 | MFUI 校验错误默认为 `400` | 面向 HTTP 的状态码。 |

## `SemanticStreamEvent`

`MFUIStreamWriter` 输出的 MFUI 语义 SSE 事件联合类型。

### 结构

```ts
type SemanticStreamEvent =
  | { type: 'message.start'; id: string; createdAt?: string }
  | { type: 'text.delta'; partId: string; text: string }
  | { type: 'component.snapshot'; partId: string; component: string; spec: unknown; projection: { text: string }; metadata?: JsonObject }
  | { type: 'layout.snapshot'; partId: string; layout: 'mfui.columns'; columns: unknown[]; projection: { text: string }; metadata?: JsonObject }
  | { type: 'message.end'; id: string; portableText: string; usage?: { inputTokens?: number; outputTokens?: number } }
  | { type: 'error'; code: string; message: string; recoverable?: boolean }
```
