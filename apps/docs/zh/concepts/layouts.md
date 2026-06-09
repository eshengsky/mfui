---
outline: [2, 3]
---

# 布局

布局用于在一条消息中排列多个 cell。cell 可以是文本，也可以是组件。布局只描述排列结构，不表达业务语义，也不包含视觉渲染器。

应用不能定义自定义布局。需要布局能力时，启用 MFUI SDK 提供的内置布局；自定义业务内容仍然通过自定义组件表达。

## `mfui.columns`

`mfui.columns` 用于把两个或三个相关内容并排展示。

### 启用

`mfui.columns` 不会自动启用。应用需要从 `@mfui/client/layouts` 导入 `columnsLayout`，并把它放进请求 manifest 的 `layouts` 中。

```ts
import { createMFUIManifest } from '@mfui/client';
import { timelineDefinition } from '@mfui/client/definitions';
import { columnsLayout } from '@mfui/client/layouts';

const mfui = createMFUIManifest({
  components: [timelineDefinition],
  layouts: [columnsLayout],
});
```

### 结构

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `layout` | `'mfui.columns'` | 是 | 布局名称。 |
| `columns` | `Array<TextCell \| ComponentCell>` | 是 | 列内容，必须是 2 或 3 个 cell。 |

| 约束 | 说明 |
| --- | --- |
| 列数 | 只能是 2 或 3 列。 |
| 每列内容 | 每列正好包含一个 cell。 |
| cell 类型 | 每个 cell 必须是 `TextCell` 或 `ComponentCell` 之一。 |
| 嵌套布局 | 不支持在 columns 中嵌套布局。 |

### `TextCell`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `text` | `string` | 是 | 文本内容，不能为空。可以使用 Markdown 兼容文本。 |

### `ComponentCell`

| 字段 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `component` | `string` | 是 | 组件名，必须引用同一个 manifest 中包含的组件。 |
| `spec` | `unknown` | 是 | 组件 spec，必须匹配对应组件的 schema。 |

每个 cell 必须只包含一种内容：要么是 `text`，要么是 `component` 和 `spec`。不能同时包含 `text` 和 `component`。

### 模型输出

模型在 `<mfui>` block 中输出的 layout payload 形如：

```json
{
  "layout": "mfui.columns",
  "columns": [
    {
      "text": "### Recommendation\nShip behind a feature flag."
    },
    {
      "component": "mfui.timeline",
      "spec": {
        "title": "Launch plan",
        "items": [
          {
            "time": "Today",
            "title": "Prepare rollout checklist"
          }
        ]
      }
    }
  ]
}
```

布局的文本投影规则见[投影](./projections.md)。
