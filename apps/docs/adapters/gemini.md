# Gemini

Use this adapter with Gemini.

```ts
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/gemini';

async function handleChatRequest(request) {
  const body = await request.json();
  // Component manifest sent by the frontend.
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

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(upstream, mfui);
}
```
