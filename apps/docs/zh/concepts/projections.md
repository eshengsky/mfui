---
outline: [2, 3]
---

# 投影

投影是组件和布局的稳定文本表示。它让同一条消息既可以渲染 UI，也可以复制、存储、搜索，并继续作为后续模型上下文。

## 组件投影

每个组件定义都必须提供 `projection.text`。这是组件 spec 的规范文本表示。

下面的 spec：

```ts
{
  title: 'Launch plan',
  items: [
    {
      time: 'Week 1',
      title: 'Canary',
    },
  ],
}
```

可以使用这样的投影模板：

```ts
projection: {
  text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}
{% endfor %}`,
}
```

渲染结果是：

```md
### Launch plan

- Week 1: Canary
```

## 模板语法

投影模板使用 MFUI 受限的类 [Liquid](https://shopify.github.io/liquid/) 模板语法。请把投影语法视为 MFUI 子集，而不是完整 Liquid。

MFUI 默认会在渲染前校验这个子集。模板使用不支持的 tag 或 filter 时会抛错。

| 功能 | 支持的值 |
| --- | --- |
| Tags | `for`, `endfor`, `if`, `endif`, `unless`, `endunless`, `else`, `elsif` |
| Filters | `default`, `join`, `truncate`, `escapeMarkdown`, `strip`, `size` |

## 编写原则

投影应该稳定：同一个 spec 应该得到同一段文本。

投影应该可读：它是给复制、搜索、审计和模型上下文使用的文本，不应该只是 JSON dump。

投影不应该推断 spec 中不存在的信息。例如图表投影可以展开数据点，但不应该额外生成趋势总结，除非趋势总结本身就是 spec 字段。

投影可以使用 Markdown 语法，但 MFUI 不要求必须使用 Markdown。

## 布局投影

布局不定义投影模板。内置布局会按确定性顺序组合其中的 cell。

对于 `mfui.columns`：

| cell | 投影规则 |
| --- | --- |
| `TextCell` | 使用 cell 自己的 `text`。 |
| `ComponentCell` | 使用对应组件定义渲染出的 `projection.text`。 |
| 多个 cell | 从左到右用空行拼接。 |

列位置是视觉结构，不会写入投影文本，因此投影不会添加“第 1 列”之类的标签。

## `portableText`

消息级 `portableText` 是最终的确定性文本。它由文本 part、组件投影和布局投影拼接而成。

| part 类型 | 文本来源 |
| --- | --- |
| Text part | `content` |
| Component part | `projection.text` |
| Layout part | `projection.text` |

拼接时使用空行分隔，并忽略空片段。

```ts
import { messageToPortableText } from '@mfui/client';

const text = messageToPortableText(message);
```

MFUI 只生成这段文本。应用决定如何把它用于复制、搜索、审计日志或后续模型上下文。
