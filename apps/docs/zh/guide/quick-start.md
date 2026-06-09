# 快速开始

这一页展示最短的 MFUI 路径：定义一个组件，把它的 manifest 发给后端，让模型流式输出文本和 `<mfui>` 块，然后渲染语义响应。

服务端示例使用 OpenAI 兼容的 Chat Completions 流格式，因为很多模型提供商和本地服务器都支持这种格式。

## 1. 在客户端定义组件

在客户端定义组件。渲染器仍然留在你的应用里；MFUI 只需要 schema、模型提示和投影模板。

```ts
import { defineMFUIComponent } from '@mfui/client';
import { z } from 'zod';

// Schema 描述模型可以生成的组件规格。
export const timelineSchema = z.object({
  title: z.string(),
  items: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
    }),
  ),
});

export type TimelineSpec = z.infer<typeof timelineSchema>;

// 定义是可序列化的，渲染器不属于定义的一部分。
export const timelineDefinition = defineMFUIComponent<TimelineSpec>({
  // 使用带命名空间的名称，避免和内置定义冲突。
  name: 'app.timeline',
  schema: timelineSchema,
  model: {
    description: 'Show ordered events, plans, and milestones.',
  },
  projection: {
    // 这个可移植文本投影使用 MFUI 受限的类 Liquid 模板语法。
    text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}
{% endfor %}`,
  },
});
```

## 2. 从客户端发送 manifest

在聊天请求体里添加 `mfui` 字段。它的值是根据当前客户端支持的组件定义创建出来的请求 manifest。

后端读取这个 `mfui` manifest，从而知道模型可以生成哪些组件规格，以及完成后的规格应该如何投影为可移植文本。

```ts
import { createMFUIManifest } from '@mfui/client';
import { timelineDefinition } from './timeline-definition';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages,
    mfui: createMFUIManifest({
      components: [timelineDefinition],
    }),
  }),
});
```

## 3. 从服务端流式输出

在服务端，把 MFUI 的提示词合并进你现有的模型调用。普通模型文本会变成 `text.delta`；完成的 `<mfui>` 块会变成经过校验的 `component.snapshot` 事件。

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-compatible';

async function handleChatRequest(request) {
  const body = await request.json();
  // 前端发送过来的组件 manifest。
  const mfui = body.mfui;
  const messages = body.messages ?? [];

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            'You are a helpful assistant.',
            // 添加组件目录、JSON schema 和 <mfui> 块规则。
            createMFUIPrompt(mfui),
          ].join('\n\n'),
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  // 向前端返回经过 MFUI 处理的 SSE 流。
  return createMFUIResponse(upstream, mfui, {
    onMessage(message) {
      // 可以在这里持久化 message.portableText。
    },
  });
}
```

`createMFUIResponse()` 会读取提供商的文本增量，解析完整的 `<mfui>` 块，校验组件规格，并返回 MFUI 语义 SSE。`onMessage` 会在消息完成后执行，服务端可以在这里存储 `message.portableText`，用于历史上下文、搜索或审计。

## 4. 在客户端渲染响应

回到客户端，使用 `streamMFUIMessage()` 从 SSE 中读取已投影的消息快照，并按 part 类型渲染。

```tsx
import {
  streamMFUIMessage,
  type ProjectedMessage,
} from '@mfui/client';
import type { TimelineSpec } from './timeline-definition';

for await (const snapshot of streamMFUIMessage(response)) {
  // 你的应用负责保存或重新渲染每个消息快照。
  // 在 React 中这里通常是 setState；在 Vue 中通常是更新 ref/store。
  renderAssistantMessage(snapshot);
}

function Timeline({ spec }: { spec: TimelineSpec }) {
  return (
    <section>
      <h3>{spec.title}</h3>
      <ol>
        {spec.items.map((item) => (
          <li key={`${item.time}:${item.title}`}>
            <strong>{item.time}</strong> {item.title}
          </li>
        ))}
      </ol>
    </section>
  );
}

// AssistantMessage 是你的应用自己的消息渲染组件。
function AssistantMessage({ message }: { message: ProjectedMessage }) {
  return message.parts.map((part) => {
    if (part.type === 'text') {
      // Markdown 是你的应用自己的文本渲染器。
      return <Markdown key={part.id}>{part.content}</Markdown>;
    }

    if (part.type === 'component' && part.component === 'app.timeline') {
      // Timeline 是你的应用为 app.timeline 提供的渲染器。
      return <Timeline key={part.id} spec={part.spec as TimelineSpec} />;
    }

    // 未知组件和布局仍然有确定性的文本兜底。
    return <Markdown key={part.id}>{part.projection.text}</Markdown>;
  });
}
```
