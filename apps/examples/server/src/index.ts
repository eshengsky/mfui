import 'dotenv/config';

import { serve } from '@hono/node-server';
import { createMFUIResponse } from '@mfui/openai-compatible';
import {
  createMFUIPrompt,
  type MFUIManifest,
} from '@mfui/server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type ModelMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  messages?: ModelMessage[];
  mfui: MFUIManifest;
};

const app = new Hono();
const port = 5181;
const dashscopeEndpoint =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const dashscopeModel = 'qwen-plus';

app.use('/api/*', cors());

app.post('/api/chat', async (context) => {
  const body = await context.req.json<ChatRequestBody>();
  // Component manifest sent by the frontend.
  const mfui = body.mfui;
  const messages = body.messages ?? [];
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return context.text('Missing DASHSCOPE_API_KEY in apps/examples/.env.', 500);
  }

  const upstream = await fetch(dashscopeEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: dashscopeModel,
      messages: [
        {
          role: 'system',
          content: [
            'You are a helpful assistant.',
            createMFUIPrompt(mfui),
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(
      text || `DashScope request failed with ${upstream.status}.`,
      { status: upstream.status },
    );
  }

  // Return the MFUI-processed SSE stream to the frontend.
  return createMFUIResponse(upstream, mfui, {
    onMessage(message) {
      console.log('\nMFUI portable text:\n%s\n', message.portableText);
    },
  });
});

serve({
  fetch: app.fetch,
  port,
});

console.log(`MFUI example server listening on http://localhost:${port}`);
