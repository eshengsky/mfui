---
outline: [2, 3]
---

# 组件

组件定义描述模型可以生成的结构化内容，以及这些内容如何投影成稳定文本。MFUI 使用组件定义生成模型提示、校验模型输出，并为没有对应渲染器的客户端提供文本兜底。

一个组件定义由以下部分组成：

- `name`
- `schema`
- `model` 提示
- `projection` 模板

组件定义不包含视觉渲染器，也不定义交互逻辑。应用仍然负责 UI、状态和业务流程。

## 自定义组件

当内置组件不能表达你的业务语义时，可以定义自定义组件。自定义组件应该表达领域内容，例如订单状态、账户摘要或报价结果，而不是只包装 Markdown 或视觉排列方式。

使用带命名空间的组件名，能让模型输出、服务端校验、渲染器查找和持久化历史保持明确。应用自己的定义建议使用应用或领域前缀，例如 `app.order_status` 或 `crm.account_summary`，不要使用 `timeline` 这类无前缀名称。

```ts
import { createMFUIManifest, defineMFUIComponent } from '@mfui/client';
import { z } from 'zod';

const orderStatus = defineMFUIComponent({
  name: 'app.order_status',
  schema: z.object({
    orderId: z.string(),
    status: z.string(),
  }),
  model: {
    description: 'Show the current status of an order.',
  },
  projection: {
    text: '**Order {{ orderId }}:** {{ status }}',
  },
});
```

渲染器仍然留在你的应用里。发送请求时，把组件定义传给 `createMFUIManifest()`；它会生成本次请求的可序列化 manifest，让服务端知道允许模型生成哪些组件。

```ts
const mfui = createMFUIManifest({
  components: [orderStatus],
});
```

## 内置组件

MFUI 在 `@mfui/client/definitions` 下提供一组常用语义组件。内置组件也只是定义：它们提供 schema、模型提示和投影模板，不包含渲染器。

内置组件不会默认加入请求。应用需要把本次要启用的定义放进 manifest；可以只选择其中一部分，也可以和自定义组件混用。服务端只会把当前 manifest 中包含的组件暴露给模型。

如果客户端没有为某个内置组件提供渲染器，可以显示 `part.projection.text`。

下面示例启用全部当前内置组件；实际使用时可以只选择需要的定义。

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

const mfui = createMFUIManifest({
  components: [
    alertDefinition,
    timelineDefinition,
    formDefinition,
    barChartDefinition,
    lineChartDefinition,
    pieChartDefinition,
  ],
});
```

### `mfui.alert`

用于展示需要从普通正文中突出的上下文消息，例如信息、成功、警告或错误提示。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | 是 | 提示类型。 |
| `title` | `string` | 否 | 简短标题。 |
| `description` | `string` | 是 | 主要提示内容。 |

投影会包含提示类型、可选标题和描述。

### `mfui.timeline`

用于展示有顺序的事件、计划、里程碑或日程。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 时间线标题。 |
| `items` | `TimelineItem[]` | 是 | 一个或多个有序条目。 |

投影会包含标题，并按顺序列出每个条目。

#### `TimelineItem`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `time` | `string` | 是 | 时间、日期或阶段标签。 |
| `title` | `string` | 是 | 条目标题。 |
| `description` | `string` | 否 | 条目补充说明。 |

### `mfui.form`

用于描述一个简短表单，让用户补充结构化信息。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 表单标题。 |
| `description` | `string` | 否 | 可选表单说明。 |
| `fields` | `FormField[]` | 是 | 一个或多个字段。 |
| `submitText` | `string` | 否 | 提交按钮文案。 |

`FormField` 可以是以下任一字段类型。

#### `InputField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'input'` | 是 | 单行输入字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `inputType` | `'text' \| 'email' \| 'password' \| 'url' \| 'tel' \| 'number'` | 否 | 输入类型。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string` | 否 | 默认值。 |

#### `TextareaField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'textarea'` | 是 | 多行文本输入字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string` | 否 | 默认值。 |

#### `ChoiceField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'choice'` | 是 | 选项字段，可渲染为 select、radio 或 checkbox 等控件。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `options` | `ChoiceOption[]` | 是 | 一个或多个可选项。 |
| `multiple` | `boolean` | 否 | 是否允许多选。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string \| string[]` | 否 | 默认选中值。多选时可以使用字符串数组。 |

#### `ChoiceOption`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | 是 | 展示给用户的选项文案。 |
| `value` | `string` | 是 | 选项值。 |
| `description` | `string` | 否 | 选项补充说明。 |

#### `SwitchField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'switch'` | 是 | 开关字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `defaultValue` | `boolean` | 否 | 默认开关状态。 |

#### `DateField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'date'` | 是 | 日期字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string` | 否 | 默认日期值。 |

#### `TimeField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'time'` | 是 | 时间字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string` | 否 | 默认时间值。 |

#### `DatetimeField`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `type` | `'datetime'` | 是 | 日期时间字段。 |
| `name` | `string` | 是 | 字段名，通常作为提交值里的 key。 |
| `label` | `string` | 是 | 展示给用户的字段标签。 |
| `description` | `string` | 否 | 字段说明。 |
| `required` | `boolean` | 否 | 是否必填。 |
| `placeholder` | `string` | 否 | 占位文本。 |
| `defaultValue` | `string` | 否 | 默认日期时间值。 |

`mfui.form` 不定义提交行为。应用可以自行决定提交后是禁用表单、替换成文本、发送新的用户消息，还是执行其它业务流程。

### `mfui.bar_chart`

用于分类数值对比。可选的 `series` 可以表达分组柱状图。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 图表标题。 |
| `description` | `string` | 否 | 可选上下文。 |
| `xLabel` | `string` | 否 | X 轴标签。 |
| `yLabel` | `string` | 否 | Y 轴标签。 |
| `unit` | `string` | 否 | 单位后缀或单位标签，例如 `users`、`USD` 或 `%`。 |
| `data` | `BarChartDataPoint[]` | 是 | 数据点，最多 100 个。 |

#### `BarChartDataPoint`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | 是 | 分类标签。 |
| `value` | `number` | 是 | 数值。 |
| `series` | `string` | 否 | 分组名称。 |

### `mfui.line_chart`

用于时间趋势或其它有序轴上的数值变化。可选的 `series` 可以表达多条折线。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 图表标题。 |
| `description` | `string` | 否 | 可选上下文。 |
| `xLabel` | `string` | 否 | X 轴标签。 |
| `yLabel` | `string` | 否 | Y 轴标签。 |
| `unit` | `string` | 否 | 单位后缀或单位标签，例如 `users`、`USD` 或 `%`。 |
| `data` | `LineChartDataPoint[]` | 是 | 有序数据点，最多 100 个。 |

#### `LineChartDataPoint`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | 是 | 时间点、阶段或有序轴标签。 |
| `value` | `number` | 是 | 数值。 |
| `series` | `string` | 否 | 折线系列名称。 |

### `mfui.pie_chart`

用于展示非负数值在整体中的组成关系。

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | 是 | 图表标题。 |
| `description` | `string` | 否 | 可选上下文。 |
| `unit` | `string` | 否 | 单位后缀或单位标签，例如 `%`。 |
| `data` | `PieChartDataPoint[]` | 是 | 非负分类数值，最多 100 个。 |

#### `PieChartDataPoint`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | 是 | 分类标签。 |
| `value` | `number` | 是 | 非负数值。 |
