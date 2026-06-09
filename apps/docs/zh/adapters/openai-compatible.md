# OpenAI 兼容

当你使用兼容 Chat Completions 的 API 时，使用这个适配器。

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
            createMFUIPrompt(mfui),
          ].join('\n\n'),
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  // 向前端返回经过 MFUI 处理的 SSE 流。
  return createMFUIResponse(upstream, mfui);
}
```

这个适配器会读取 Chat Completions 文本输出，解析完整的 `<mfui>` 块，并返回 MFUI 语义 SSE。
