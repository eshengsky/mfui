---
outline: [2, 2]
---

# `@mfui/client`

`@mfui/client` 是浏览器侧 SDK，用于定义 MFUI 组件、把可序列化的
manifest 发给服务端、读取 MFUI 语义流，以及处理投影后的消息。

大多数应用会在已有的聊天 UI 或请求流程里使用这个包。

## `defineMFUIComponent()`

创建一个组件定义。这个定义既可以在前端本地使用，也可以序列化成 MFUI
component manifest。

### Import

```ts
import { defineMFUIComponent } from '@mfui/client';
```

### Signature

```ts
function defineMFUIComponent<TSpec>(
  input: DefineMFUIComponentInput<TSpec>,
): MFUIComponentDefinition<TSpec>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `input` | <code><a href="#definemfuicomponentinput-tspec">DefineMFUIComponentInput</a>&lt;TSpec&gt;</code> | 是 | 无 | 组件定义入参。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#mfuicomponentdefinition-tspec">MFUIComponentDefinition</a>&lt;TSpec&gt;</code> | 本地组件定义，包含 `manifest`、`project()`、`validate()` 和 `toManifest()`。 |

### 示例

```ts
import { z } from 'zod';
import { defineMFUIComponent } from '@mfui/client';

const taskListDefinition = defineMFUIComponent({
  name: 'app.task_list',
  schema: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        label: z.string(),
        done: z.boolean().default(false),
      }),
    ),
  }),
  model: {
    description: 'Show a short checklist of tasks.',
    whenToUse: 'Use this when the answer contains actionable tasks.',
  },
  projection: {
    text: `### {{ title }}

{% for item in items %}
- {{ item.label }}{% if item.done %} (done){% endif %}
{% endfor %}`,
  },
});
```

### 注意事项

当 `schema` 是 Zod schema 时，MFUI 会把它转换成 JSON Schema 并写入序列化
manifest。如果传入的是原始 JSON Schema，本地 `validate()` 会返回失败结果，
提示 JSON Schema 运行时校验应交给 `@mfui/server`。

如果投影模板使用了 MFUI 不支持的 tag 或 filter，`project()` 可能抛错。

## `DefineMFUIComponentInput<TSpec>`

`defineMFUIComponent()` 的入参对象。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `name` | `string` | 是 | 无 | 稳定组件名，用于模型输出、流事件和渲染器查找。 |
| `schema` | <code><a href="#componentschema-tspec">ComponentSchema</a>&lt;TSpec&gt;</code> | 是 | 无 | 描述组件 spec 的 Zod schema 或 JSON Schema。 |
| `jsonSchema` | <code><a href="#jsonschema">JsonSchema</a></code> | 否 | 无 | 写入 manifest 的显式 JSON Schema。传入后会覆盖从 Zod 生成的 schema。 |
| `projection` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | 是 | 无 | 把组件 spec 转成可移植文本的模板。目前支持 `text`。 |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | 否 | 无 | 写入服务端提示词的描述、使用时机和示例。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 附加到组件 manifest 的可序列化应用元数据。 |

## `MFUIComponentDefinition<TSpec>`

`defineMFUIComponent()` 返回的组件定义。

| 属性或方法 | 类型 | 描述 |
| --- | --- | --- |
| `name` | `string` | 组件定义入参里的组件名。 |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | 可序列化组件 manifest。 |
| `project(spec)` | <code>(spec: TSpec) =&gt; <a href="#projection">Projection</a></code> | 使用 spec 渲染投影模板。 |
| `validate(spec)` | <code>(spec: unknown) =&gt; <a href="#validationresult">ValidationResult</a></code> | 当 `schema` 是 Zod schema 时执行本地校验。 |
| `toManifest()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a></code> | 返回可序列化 manifest。 |

## `ComponentSchema<TSpec>`

`defineMFUIComponent()` 接受的 schema 输入。

### 结构

```ts
type ComponentSchema<TSpec> = ZodTypeAny | JsonSchema
```

### 注意事项

如果希望通过 `definition.validate()` 在客户端做本地校验，传入 Zod schema。
如果已经有可序列化的 schema，传入 JSON Schema。

## `ComponentModelHints`

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `description` | `string` | 是 | 无 | 给模型看的组件描述。 |
| `whenToUse` | `string` | 否 | 无 | 给模型看的使用时机说明。 |
| `examples` | `Array<{ user: string; spec: unknown }>` | 否 | 无 | 用于提示词的用户请求和合法 spec 示例。 |

## `ComponentManifest`

单个组件的可序列化 manifest。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `name` | `string` | 是 | 无 | 稳定组件名。 |
| `schema` | <code><a href="#jsonschema">JsonSchema</a></code> | 是 | 无 | 组件 spec 的 JSON Schema。 |
| `projection` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | 是 | 无 | 把 spec 投影成文本的模板。 |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | 否 | 无 | 服务端提示词使用的模型提示。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `ProjectionTemplates`

用于渲染投影的模板对象。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `text` | `string` | 是 | 无 | 把组件 spec 渲染成文本的 MFUI 语义模板。 |

## `Projection`

渲染后的投影对象。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `text` | `string` | 是 | 无 | 组件 spec 的确定性文本表示。 |

## `JsonSchema`

JSON Schema 对象结构。

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

## `isMFUIComponentDefinition()`

判断未知值是否具有 MFUI component definition 的基本形状。

### Import

```ts
import { isMFUIComponentDefinition } from '@mfui/client';
```

### Signature

```ts
function isMFUIComponentDefinition(
  value: unknown,
): value is MFUIComponentDefinition
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `value` | `unknown` | 是 | 无 | 待检查的值。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `boolean` | 当值是对象并包含 `manifest`、`project`、`toManifest` 属性时返回 `true`。 |

## `createMFUIManifest()`

创建通常由前端发送给后端的 manifest payload。

### Import

```ts
import { createMFUIManifest } from '@mfui/client';
```

### Signature

```ts
function createMFUIManifest(
  input: CreateMFUIManifestInput,
): MFUIManifest
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `input` | <code><a href="#createmfuimanifestinput">CreateMFUIManifestInput</a></code> | 是 | 无 | manifest 构造入参。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#mfuimanifest">MFUIManifest</a></code> | 包含 `components` 数组和可选 `layouts` 数组的可序列化 manifest。 |

### 示例

```ts
import { createMFUIManifest } from '@mfui/client';
import {
  alertDefinition,
  timelineDefinition,
  formDefinition,
  barChartDefinition,
  lineChartDefinition,
  pieChartDefinition,
} from '@mfui/client/definitions';
import { columnsLayout } from '@mfui/client/layouts';

const mfui = createMFUIManifest({
  components: [
    alertDefinition,
    timelineDefinition,
    formDefinition,
    barChartDefinition,
    lineChartDefinition,
    pieChartDefinition,
  ],
  layouts: [columnsLayout],
});

await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, mfui }),
});
```

### 注意事项

这个函数只负责规范化组件和布局输入，不校验完整 manifest。服务端仍应在信任模型生成的组件 spec 前执行校验。

## `CreateMFUIManifestInput`

`createMFUIManifest()` 的入参对象。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `components` | <code>readonly <a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | 是 | 无 | 组件定义、原始 component manifest，或包含 `toManifest()` 的对象。 |
| `layouts` | <code>readonly <a href="#layoutmanifestinput">LayoutManifestInput</a>[]</code> | 否 | 无 | 内置布局定义、原始 layout manifest，或包含 `toManifest()` 的对象。 |

## `MFUIManifest`

列出当前模型请求可用组件的可序列化 request manifest。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifest">ComponentManifest</a>[]</code> | 是 | 无 | 当前请求可用的组件。 |
| `layouts` | <code><a href="#layoutmanifest">LayoutManifest</a>[]</code> | 否 | 无 | 当前请求可用的内置布局。 |

## `ComponentManifestInput`

可被相关 helper 接受的组件输入，可以是原始 manifest，也可以是能返回 manifest 的对象。

### 结构

```ts
type ComponentManifestInput = ComponentManifest | ComponentManifestProvider
```

## `ComponentManifestProvider`

可以返回 component manifest 的对象。

| 属性或方法 | 类型 | 描述 |
| --- | --- | --- |
| `toManifest()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a></code> | 返回可序列化 component manifest。 |

## `LayoutManifest`

单个内置布局的可序列化 manifest。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `name` | `string` | 是 | 无 | 稳定布局名。 |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | 否 | 无 | 服务端提示词使用的模型侧布局说明。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `LayoutManifestInput`

可被相关 helper 接受的布局输入，可以是原始 manifest，也可以是能返回 manifest 的对象。

### 结构

```ts
type LayoutManifestInput = LayoutManifest | LayoutManifestProvider
```

## `LayoutManifestProvider`

可以返回 layout manifest 的对象。

| 属性或方法 | 类型 | 描述 |
| --- | --- | --- |
| `toManifest()` | <code>() =&gt; <a href="#layoutmanifest">LayoutManifest</a></code> | 返回可序列化 layout manifest。 |

## `readMFUIMessage()`

读取 MFUI 语义流，并解析出最终投影消息。

### Import

```ts
import { readMFUIMessage } from '@mfui/client';
```

### Signature

```ts
function readMFUIMessage(
  source: MFUIStreamSource,
): Promise<ProjectedMessage | undefined>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#mfuistreamsource">MFUIStreamSource</a></code> | 是 | 无 | `Response`、`ReadableStream<Uint8Array>` 或 `null`。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code>Promise&lt;<a href="#projectedmessage-tspec">ProjectedMessage</a> &#124; undefined&gt;</code> | 最后一个完成的投影消息；如果流为空或不存在，则为 `undefined`。 |

### 示例

```ts
import { readMFUIMessage } from '@mfui/client';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { Accept: 'text/event-stream' },
});

const message = await readMFUIMessage(response);
console.log(message?.portableText);
```

### 抛错

当 `Response` 非 OK、流里包含 MFUI `error` 事件，或语义流数据无法解析时抛错。

## `streamMFUIMessage()`

以渐进投影消息快照的方式读取 MFUI 语义流。

### Import

```ts
import { streamMFUIMessage } from '@mfui/client';
```

### Signature

```ts
function streamMFUIMessage(
  source: MFUIStreamSource,
): AsyncIterable<ProjectedMessage>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#mfuistreamsource">MFUIStreamSource</a></code> | 是 | 无 | `Response`、`ReadableStream<Uint8Array>` 或 `null`。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#projectedmessage-tspec">ProjectedMessage</a>&gt;</code> | 随语义流事件到达持续产出投影消息快照。 |

### 示例

```ts
import { streamMFUIMessage } from '@mfui/client';

for await (const message of streamMFUIMessage(response)) {
  renderAssistantMessage(message);
}
```

### 抛错

抛错场景与 `readMFUIMessage()` 相同。

## `MFUIStreamSource`

`readMFUIMessage()` 和 `streamMFUIMessage()` 接受的流来源。

### 结构

```ts
type MFUIStreamSource = Response | ReadableStream<Uint8Array> | null
```

### 注意事项

如果传入 `Response`，客户端会在读取 body 前检查 `response.ok`。

## `ProjectedMessage<TSpec>`

包含 `portableText` 的投影消息。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | 无 | 消息 id。 |
| `parts` | <code>Array&lt;<a href="#projectedmessagepart-tspec">ProjectedMessagePart</a>&lt;TSpec&gt;&gt;</code> | 是 | 无 | 投影后的文本、组件和布局 parts。 |
| `portableText` | `string` | 是 | 无 | 用于复制、存储、搜索和后续模型上下文的确定性文本。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 从原始消息复制的应用元数据。 |

## `ProjectedMessagePart<TSpec>`

投影后的文本、组件和布局 part 联合类型。

### 结构

```ts
type ProjectedMessagePart<TSpec = unknown> =
  | TextPart
  | ProjectedComponentPart<TSpec>
  | ProjectedLayoutPart<TSpec>
```

## `ProjectedComponentPart<TSpec>`

带必填文本投影的组件 part。

### 结构

```ts
type ProjectedComponentPart<TSpec = unknown> =
  Omit<ComponentPart<TSpec>, 'projection'> & {
    projection: Projection
  }
```

## `ProjectedLayoutPart<TSpec>`

带已投影 cell 和必填文本投影的布局 part。

### 结构

```ts
type ProjectedLayoutPart<TSpec = unknown> = {
  id: string
  type: 'layout'
  layout: 'mfui.columns'
  columns: Array<TextPart | ProjectedComponentPart<TSpec>>
  projection: Projection
  metadata?: JsonObject
}
```

## `TextPart`

普通文本消息 part。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | 无 | 稳定 part id。 |
| `type` | `'text'` | 是 | 无 | part 判别字段。 |
| `content` | `string` | 是 | 无 | 文本内容。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `ComponentPart<TSpec>`

引用组件和 spec 的消息 part。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | 无 | 稳定 part id。 |
| `type` | `'component'` | 是 | 无 | part 判别字段。 |
| `component` | `string` | 是 | 无 | 组件名。 |
| `spec` | `TSpec` | 是 | 无 | 组件 spec 数据。 |
| `projection` | <code><a href="#projection">Projection</a></code> | 否 | 无 | 已存在的投影。缺失时，helper 可以根据 manifest 渲染。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `messageToPortableText()`

把投影消息 parts 转成确定性的文本。

### Import

```ts
import { messageToPortableText } from '@mfui/client';
```

### Signature

```ts
function messageToPortableText(
  partsOrMessage: ProjectedMessagePart[] | ProjectedMessage,
): string
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `partsOrMessage` | <code><a href="#projectedmessagepart-tspec">ProjectedMessagePart</a>[] &#124; <a href="#projectedmessage-tspec">ProjectedMessage</a></code> | 是 | 无 | 投影 parts 或完整投影消息。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `string` | 文本 part、组件 `projection.text` 和布局 `projection.text` 用空行拼接后的文本。空片段会被忽略。 |

## `projectMessage()`

投影原始消息里的每个组件 part，包括布局 part 里的组件 cell，并返回投影消息。

### Import

```ts
import { projectMessage } from '@mfui/client';
```

### Signature

```ts
function projectMessage<TSpec = unknown>(
  message: MessageIR<TSpec>,
  options: ProjectMessageOptions,
): ProjectedMessage<TSpec>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `message` | <code><a href="#messageir-tspec">MessageIR</a>&lt;TSpec&gt;</code> | 是 | 无 | 包含文本、组件和布局 part 的消息。 |
| `options` | <code><a href="#projectmessageoptions">ProjectMessageOptions</a></code> | 是 | 无 | 投影选项。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#projectedmessage-tspec">ProjectedMessage</a>&lt;TSpec&gt;</code> | 包含组件投影和 `portableText` 的消息。 |

### 抛错

当某个组件 part 引用了 `options.components` 中不存在的组件时抛错。

## `ProjectMessageOptions`

`projectMessage()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | 是 | 无 | 用于投影组件 part 的 manifests。 |

## `MessageIR<TSpec>`

包含文本、组件和布局 part 的原始消息。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `id` | `string` | 是 | 无 | 消息 id。 |
| `parts` | <code>Array&lt;<a href="#messagepart-tspec">MessagePart</a>&lt;TSpec&gt;&gt;</code> | 是 | 无 | 文本、组件和布局消息 parts。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `MessagePart<TSpec>`

文本、组件和布局 part 的联合类型。

### 结构

```ts
type MessagePart<TSpec = unknown> =
  | TextPart
  | ComponentPart<TSpec>
  | LayoutPart<TSpec>
```

## `LayoutPart<TSpec>`

原始内置布局消息 part。

### 结构

```ts
type LayoutPart<TSpec = unknown> = {
  id: string
  type: 'layout'
  layout: 'mfui.columns'
  columns: Array<TextPart | ComponentPart<TSpec>>
  projection?: Projection
  metadata?: JsonObject
}
```

## `createTextPart()`

创建文本消息 part。

### Import

```ts
import { createTextPart } from '@mfui/client';
```

### Signature

```ts
function createTextPart(
  content: string,
  options?: { id?: string },
): TextPart
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `content` | `string` | 是 | 无 | part 的文本内容。 |
| `options` | `{ id?: string }` | 否 | `{}` | 可选 part 配置。 |
| `options.id` | `string` | 否 | 生成的 `txt_*` id | 稳定 part id。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#textpart">TextPart</a></code> | `type: 'text'` 的消息 part。 |

## `createComponentPart()`

创建组件消息 part。

### Import

```ts
import { createComponentPart } from '@mfui/client';
```

### Signature

```ts
function createComponentPart<TSpec>(
  component: string,
  spec: TSpec,
  options?: { id?: string },
): ComponentPart<TSpec>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `component` | `string` | 是 | 无 | 组件名。 |
| `spec` | `TSpec` | 是 | 无 | 组件 spec 数据。 |
| `options` | `{ id?: string }` | 否 | `{}` | 可选 part 配置。 |
| `options.id` | `string` | 否 | 生成的 `cmp_*` id | 稳定 part id。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#componentpart-tspec">ComponentPart</a>&lt;TSpec&gt;</code> | `type: 'component'` 的消息 part。 |

## `renderProjection()`

为某个 spec 渲染所有投影模板。

### Import

```ts
import { renderProjection } from '@mfui/client';
```

### Signature

```ts
function renderProjection(
  templates: ProjectionTemplates,
  data: unknown,
  options?: TemplateRenderOptions,
): Projection
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `templates` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | 是 | 无 | 投影模板对象。目前包含 `text`。 |
| `data` | `unknown` | 是 | 无 | 作为模板上下文的数据对象。 |
| `options` | <code><a href="#templaterenderoptions">TemplateRenderOptions</a></code> | 否 | `{}` | 模板渲染选项。 |
| `options.validateSubset` | `boolean` | 否 | `true` | 渲染前是否拒绝 MFUI 不支持的模板 tag 和 filter。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#projection">Projection</a></code> | 渲染后的投影对象。目前包含 `text`。 |

### 抛错

模板校验失败或模板渲染失败时抛错。

## `renderSemanticTemplate()`

渲染单个 MFUI 语义模板字符串。

### Import

```ts
import { renderSemanticTemplate } from '@mfui/client';
```

### Signature

```ts
function renderSemanticTemplate(
  template: string,
  data: unknown,
  options?: TemplateRenderOptions,
): string
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `template` | `string` | 是 | 无 | MFUI 语义模板。 |
| `data` | `unknown` | 是 | 无 | 作为模板上下文的数据对象。 |
| `options` | <code><a href="#templaterenderoptions">TemplateRenderOptions</a></code> | 否 | `{}` | 模板渲染选项。 |
| `options.validateSubset` | `boolean` | 否 | `true` | 渲染前是否拒绝 MFUI 不支持的模板 tag 和 filter。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `string` | 渲染后的文本。 |

## `validateSemanticTemplate()`

校验模板是否只使用 MFUI 支持的 Liquid 子集。

### Import

```ts
import { validateSemanticTemplate } from '@mfui/client';
```

### Signature

```ts
function validateSemanticTemplate(template: string): void
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `template` | `string` | 是 | 无 | 待校验模板。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| `void` | 模板合法时不返回任何内容。 |

### 支持的模板子集

| 功能 | 支持的值 |
| --- | --- |
| Tags | `for`, `endfor`, `if`, `endif`, `unless`, `endunless`, `else`, `elsif` |
| Filters | `default`, `join`, `truncate`, `escapeMarkdown`, `strip`, `size` |

### 抛错

模板包含不支持的 tag 或 filter 时抛错。

## `TemplateRenderOptions`

`renderProjection()` 和 `renderSemanticTemplate()` 的选项。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `validateSubset` | `boolean` | 否 | `true` | 渲染前是否拒绝 MFUI 不支持的模板 tag 和 filter。 |

## `createComponentRegistry()`

创建一个小型 component manifest 注册表。

### Import

```ts
import { createComponentRegistry } from '@mfui/client';
```

### Signature

```ts
function createComponentRegistry(
  components?: ComponentManifestInput[],
): ComponentRegistry
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | 否 | `[]` | 初始注册的组件。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#componentregistry">ComponentRegistry</a></code> | 包含 `register()`、`get()`、`has()`、`manifests()` 方法的注册表。 |

### 注意事项

重复注册同名组件时，后注册的 manifest 会覆盖前一个。

## `ComponentRegistry`

`createComponentRegistry()` 返回的内存注册表。

| 方法 | 类型 | 描述 |
| --- | --- | --- |
| `register(component)` | <code>(component: <a href="#componentmanifestinput">ComponentManifestInput</a>) =&gt; <a href="#componentregistry">ComponentRegistry</a></code> | 注册组件，并返回同一个 registry 以支持链式调用。 |
| `get(name)` | <code>(name: string) =&gt; <a href="#componentmanifest">ComponentManifest</a> &#124; undefined</code> | 根据组件名获取 manifest。 |
| `has(name)` | `(name: string) => boolean` | 判断组件名是否已注册。 |
| `manifests()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a>[]</code> | 返回已注册 manifests。 |

## `getComponentManifest()`

从原始 manifest 对象或 provider 对象中取出 manifest。

### Import

```ts
import { getComponentManifest } from '@mfui/client';
```

### Signature

```ts
function getComponentManifest(
  component: ComponentManifestInput,
): ComponentManifest
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `component` | <code><a href="#componentmanifestinput">ComponentManifestInput</a></code> | 是 | 无 | 原始 component manifest，或包含 `toManifest()` 的对象。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#componentmanifest">ComponentManifest</a></code> | 规范化后的 component manifest。 |

## `projectSpecWithManifest()`

使用单个 manifest 投影一个组件 spec。

### Import

```ts
import { projectSpecWithManifest } from '@mfui/client';
```

### Signature

```ts
function projectSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): Projection
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | 是 | 无 | 包含投影模板的 manifest。 |
| `spec` | `unknown` | 是 | 无 | 要投影的组件 spec。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#projection">Projection</a></code> | 渲染后的投影。 |

## `createMessageAccumulator()`

创建事件累加器。适用于你已经拿到了 MFUI 语义流事件，并希望手动管理消息状态的场景。

### Import

```ts
import { createMessageAccumulator } from '@mfui/client';
```

### Signature

```ts
function createMessageAccumulator(): MessageAccumulator
```

### 入参

这个函数没有入参。

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code><a href="#messageaccumulator">MessageAccumulator</a></code> | 管理当前消息和已完成投影消息的状态对象。 |

### 示例

```ts
import { createMessageAccumulator } from '@mfui/client';

const accumulator = createMessageAccumulator();

for await (const event of events) {
  const state = accumulator.apply(event);
  renderMessages(state.messages, state.currentMessage);
}
```

### 抛错

如果 `message.start` 之前收到了其他流事件，或应用了 `error` 事件，会抛错。

## `MessageAccumulator`

`createMessageAccumulator()` 返回的状态累加器。

| 属性或方法 | 类型 | 描述 |
| --- | --- | --- |
| `messages` | <code>readonly <a href="#projectedmessage-tspec">ProjectedMessage</a>[]</code> | 已完成消息。 |
| `apply(event)` | <code>(event: <a href="#semanticstreamevent-tspec">SemanticStreamEvent</a>) =&gt; <a href="#messageaccumulatorstate">MessageAccumulatorState</a></code> | 应用一个事件并返回最新状态。 |
| `snapshot()` | <code>() =&gt; <a href="#messageaccumulatorstate">MessageAccumulatorState</a></code> | 不应用新事件，直接返回当前状态。 |
| `getPortableText(messageId)` | `(messageId: string) => string \| undefined` | 查找当前或已完成消息的 portable text。 |
| `findMessage(messageId)` | <code>(messageId: string) =&gt; <a href="#projectedmessage-tspec">ProjectedMessage</a> &#124; undefined</code> | 查找当前或已完成消息。 |

## `MessageAccumulatorState`

消息累加器方法返回的状态快照。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `messages` | <code><a href="#projectedmessage-tspec">ProjectedMessage</a>[]</code> | 是 | 无 | 已完成消息。 |
| `currentMessage` | <code><a href="#projectedmessage-tspec">ProjectedMessage</a></code> | 否 | 无 | 当前正在生成的投影消息。 |

## `readSemanticStream()`

解析 MFUI SSE 语义事件的底层工具。

### Import

```ts
import { readSemanticStream } from '@mfui/client';
```

### Signature

```ts
function readSemanticStream(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<SemanticStreamEvent>
```

### 入参

| 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `body` | `ReadableStream<Uint8Array> \| null` | 是 | 无 | SSE 响应体。 |

### 返回值

| 类型 | 描述 |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#semanticstreamevent-tspec">SemanticStreamEvent</a>&gt;</code> | 解析后的语义流事件。当 `body` 为 `null` 时返回空 iterable。 |

## `SemanticStreamEvent<TSpec>`

所有 MFUI 语义流事件的联合类型。

### 结构

```ts
type SemanticStreamEvent<TSpec = unknown> =
  | MessageStartEvent
  | TextDeltaEvent
  | ComponentSnapshotEvent<TSpec>
  | LayoutSnapshotEvent<TSpec>
  | MessageEndEvent
  | ErrorEvent
```

## `MessageStartEvent`

开始一条消息的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'message.start'` | 是 | 无 | 事件判别字段。 |
| `id` | `string` | 是 | 无 | 消息 id。 |
| `createdAt` | `string` | 否 | 无 | 可选创建时间戳。 |

## `TextDeltaEvent`

向某个文本 part 追加文本的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'text.delta'` | 是 | 无 | 事件判别字段。 |
| `partId` | `string` | 是 | 无 | 文本 part id。 |
| `text` | `string` | 是 | 无 | 要追加的文本片段。 |

## `ComponentSnapshotEvent<TSpec>`

表示完整组件快照的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'component.snapshot'` | 是 | 无 | 事件判别字段。 |
| `partId` | `string` | 是 | 无 | 组件 part id。 |
| `component` | `string` | 是 | 无 | 组件名。 |
| `spec` | `TSpec` | 是 | 无 | 组件 spec 数据。 |
| `projection` | <code><a href="#projection">Projection</a></code> | 是 | 无 | 组件的文本投影。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `LayoutSnapshotEvent<TSpec>`

表示完整内置布局快照的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'layout.snapshot'` | 是 | 无 | 事件判别字段。 |
| `partId` | `string` | 是 | 无 | 布局 part id。 |
| `layout` | `'mfui.columns'` | 是 | 无 | 布局名。 |
| `columns` | <code>Array&lt;<a href="#textpart">TextPart</a> &#124; <a href="#projectedcomponentpart-tspec">ProjectedComponentPart</a>&lt;TSpec&gt;&gt;</code> | 是 | 无 | 已投影的列 cell。 |
| `projection` | <code><a href="#projection">Projection</a></code> | 是 | 无 | 布局的文本投影。 |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | 否 | 无 | 应用元数据。 |

## `MessageEndEvent`

结束一条消息的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'message.end'` | 是 | 无 | 事件判别字段。 |
| `id` | `string` | 是 | 无 | 消息 id。 |
| `portableText` | `string` | 是 | 无 | 该消息最终的确定性文本。 |
| `usage` | `{ inputTokens?: number; outputTokens?: number }` | 否 | 无 | 可选模型用量信息。 |

## `ErrorEvent`

表示流失败的语义流事件。

| 字段 | 类型 | 是否必填 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `type` | `'error'` | 是 | 无 | 事件判别字段。 |
| `code` | `string` | 是 | 无 | 机器可读错误码。 |
| `message` | `string` | 是 | 无 | 人类可读错误信息。 |
| `recoverable` | `boolean` | 否 | 无 | 该错误是否可能可恢复。 |
