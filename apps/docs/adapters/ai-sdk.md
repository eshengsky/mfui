# Vercel AI SDK

Use this adapter when your server already uses Vercel AI SDK.

```ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createMFUIPrompt } from '@mfui/server';
import { createMFUIResponse } from '@mfui/ai-sdk';

async function handleChatRequest(request) {
  const body = await request.json();
  // Component manifest sent by the frontend.
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

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(result, mfui);
}
```

This adapter reads AI SDK text output, parses completed `<mfui>` blocks, and
returns MFUI semantic SSE.
