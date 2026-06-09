# OpenAI Responses

Use this adapter with OpenAI Responses.

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/openai-responses';

async function handleChatRequest(request) {
  const body = await request.json();
  // Component manifest sent by the frontend.
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

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(upstream, mfui);
}
```
