---
outline: [2, 3]
---

# 语义流

语义流把一条模型回复表示为可增量消费的事件序列。普通文本以增量发送；组件和布局以完整快照发送；消息结束时会给出最终的 `portableText`。

MFUI 使用 Server-Sent Events 作为传输格式。事件名写在 `event` 字段里，事件载荷是 `data` 字段中的 JSON。

## 事件模型

一个最小完整响应形如：

```txt
event: message.start
data: {"id":"msg_1"}

event: text.delta
data: {"partId":"txt_1","text":"Here is the plan."}

event: message.end
data: {"id":"msg_1","portableText":"Here is the plan."}
```

客户端读取后会得到带 `type` 的语义事件对象，例如 `type: 'text.delta'`。

## 事件类型

| 事件 | 含义 |
| --- | --- |
| `message.start` | 开始一条消息，并给出消息 id。 |
| `text.delta` | 向某个文本 part 追加文本；同一个 `partId` 的增量会合并到同一个文本 part。 |
| `component.snapshot` | 发送已校验、已投影的完整组件快照。 |
| `layout.snapshot` | 发送已校验、已投影的完整布局快照。 |
| `message.end` | 结束消息，并给出最终 `portableText`。 |
| `error` | 报告语义流处理错误。 |

## 流式策略

文本可以按增量发送，因为普通文本不需要等完整结构闭合。

组件以快照发送。模型必须先输出完整组件 spec，服务端才能校验 schema、渲染投影，并发出 `component.snapshot`。

布局也以快照发送。对于 `mfui.columns`，服务端会先校验布局结构，再校验和投影其中的组件 cell，最后发出 `layout.snapshot`。

## 服务端生成

提供商适配器会读取上游模型流，并返回 MFUI SSE 响应：

```ts
import { createMFUIResponse } from '@mfui/openai-compatible';

const response = createMFUIResponse(upstream, mfui);
```

模型可以输出普通文本和 `<mfui>` block。适配器会把普通文本转换成 `text.delta`，并在解析出完整 `<mfui>` block 后发出 `component.snapshot` 或 `layout.snapshot`。

## 客户端读取

如果只需要最终消息，使用 `readMFUIMessage()`：

```ts
import { readMFUIMessage } from '@mfui/client';

const assistantMessage = await readMFUIMessage(response);
```

如果需要流式 UI，使用 `streamMFUIMessage()` 消费渐进消息快照：

```ts
import { streamMFUIMessage } from '@mfui/client';

for await (const message of streamMFUIMessage(response)) {
  render(message);
}
```

## 高级用法

大多数应用只需要适配器和客户端读取 API。自定义传输或高级流处理可以使用更底层的原语：

| API | 用途 |
| --- | --- |
| `createMFUIStreamWriter` | 手动写出 MFUI 语义 SSE。 |
| `createMFUIBlockParser` | 从文本流中解析普通文本和 `<mfui>` block。 |
| `readSemanticStream` | 把 MFUI SSE 读取为语义事件。 |
| `createMessageAccumulator` | 把语义事件累积成投影消息快照。 |
