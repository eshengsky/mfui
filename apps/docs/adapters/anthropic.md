# Anthropic

Use this adapter with Anthropic Messages.

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/anthropic';

async function handleChatRequest(request) {
  const body = await request.json();
  // Component manifest sent by the frontend.
  const mfui = body.mfui;
  const messages = body.messages ?? [];

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      system: [
        'You are a helpful assistant.',
        createMFUIPrompt(mfui),
      ].join('\n\n'),
      messages,
      stream: true,
    }),
  });

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(upstream, mfui);
}
```
