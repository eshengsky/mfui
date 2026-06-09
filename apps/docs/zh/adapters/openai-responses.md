# OpenAI Responses

当你使用 OpenAI Responses 时，使用这个适配器。

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-responses';

async function handleChatRequest(request) {
  const body = await request.json();
  // 前端发送过来的组件 manifest。
  const mfui = body.mfui;
  const messages = body.messages ?? [];

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      instructions: [
        'You are a helpful assistant.',
        createMFUIPrompt(mfui),
      ].join('\n\n'),
      input: messages,
      stream: true,
    }),
  });

  // 向前端返回经过 MFUI 处理的 SSE 流。
  return createMFUIResponse(upstream, mfui);
}
```
