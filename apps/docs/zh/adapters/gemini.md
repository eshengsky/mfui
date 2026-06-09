# Gemini

当你使用 Gemini 时，使用这个适配器。

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/gemini';

async function handleChatRequest(request) {
  const body = await request.json();
  // 前端发送过来的组件 manifest。
  const mfui = body.mfui;
  const messages = body.messages ?? [];

  const upstream = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                'You are a helpful assistant.',
                createMFUIPrompt(mfui),
              ].join('\n\n'),
            },
          ],
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
      }),
    },
  );

  // 向前端返回经过 MFUI 处理的 SSE 流。
  return createMFUIResponse(upstream, mfui);
}
```
