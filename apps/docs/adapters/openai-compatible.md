# OpenAI Compatible

Use this adapter with Chat Completions-compatible APIs.

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-compatible';

async function handleChatRequest(request) {
  const body = await request.json();
  // Component manifest sent by the frontend.
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

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(upstream, mfui);
}
```

This adapter reads Chat Completions text output, parses completed `<mfui>`
blocks, and returns MFUI semantic SSE.
