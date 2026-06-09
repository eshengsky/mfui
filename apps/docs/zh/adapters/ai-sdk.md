# Vercel AI SDK

当你的服务端已经使用 Vercel AI SDK 时，使用这个适配器。

```ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/ai-sdk';

async function handleChatRequest(request) {
  const body = await request.json();
  // 前端发送过来的组件 manifest。
  const mfui = body.mfui;
  const messages = body.messages ?? [];

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: [
      'You are a helpful assistant.',
      createMFUIPrompt(mfui),
    ].join('\n\n'),
    messages,
  });

  // 向前端返回经过 MFUI 处理的 SSE 流。
  return createMFUIResponse(result, mfui);
}
```

这个适配器会读取 AI SDK 文本输出，解析完整的 `<mfui>` 块，并返回 MFUI 语义 SSE。
