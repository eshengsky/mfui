# MFUI

Message-first generative UI with portable text projections.

MFUI lets AI applications return structured UI component specs while every
component remains portable as deterministic text.

## Packages

This repository is a pnpm workspace.

| Package or entry point | Status | Meaning |
| --- | --- | --- |
| `@mfui/client` | Implemented | Frontend SDK for defining component manifests, creating request manifests, parsing SSE semantic streams, accumulating messages, and projection fallback helpers. |
| `@mfui/client/definitions` | Implemented | Builtin semantic component definitions bundled with `@mfui/client`. These are definitions only: schema, model hints, and projection templates. Builtins include `mfui.alert`, `mfui.timeline`, `mfui.form`, `mfui.bar_chart`, `mfui.line_chart`, and `mfui.pie_chart`. |
| `@mfui/client/layouts` | Implemented | Builtin layout definitions bundled with `@mfui/client`. The first layout is `mfui.columns`, which arranges two or three text or component cells while preserving deterministic text fallback. |
| `@mfui/server` | Implemented | Node helpers for consuming manifests, creating prompts, parsing `<mfui>` blocks, validating component specs, projecting messages, and writing MFUI SSE semantic streams. |
| `@mfui/ai-sdk` | Implemented | Vercel AI SDK adapter that turns AI SDK text chunks into an MFUI semantic stream. |
| `@mfui/openai-responses` | Implemented | OpenAI Responses streaming adapter for MFUI text block parsing. |
| `@mfui/openai-compatible` | Implemented | OpenAI-compatible Chat Completions streaming adapter for providers such as OpenRouter, DeepSeek, Groq, Together, and local OpenAI-compatible servers. |
| `@mfui/anthropic` | Implemented | Anthropic Messages streaming adapter for MFUI text block parsing. |
| `@mfui/gemini` | Implemented | Gemini streaming adapter for MFUI text block parsing. |
| `@mfui/protocol` | Internal | Shared JS/TS protocol primitives used by `@mfui/client` and `@mfui/server`. Application code should normally use client or server instead. |
| `@mfui/docs` | Implemented | VitePress documentation app under `apps/docs`, with guides, concepts, and adapters. |

## Client Usage

```ts
import { createMFUIManifest, readMFUIMessage } from '@mfui/client';
import {
  alertDefinition,
  timelineDefinition,
  formDefinition,
  barChartDefinition,
  lineChartDefinition,
  pieChartDefinition,
} from '@mfui/client/definitions';
import { columnsLayout } from '@mfui/client/layouts';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages,
    mfui: createMFUIManifest({
      components: [
        alertDefinition,
        timelineDefinition,
        formDefinition,
        barChartDefinition,
        lineChartDefinition,
        pieChartDefinition,
      ],
      layouts: [columnsLayout],
    }),
  }),
});

const assistantMessage = await readMFUIMessage(response);
const text = assistantMessage?.portableText;
```

The frontend owns component manifests and renderers. The backend can consume the
serialized manifests, ask the model to generate only component specs, validate
the specs, and run the projection templates to persist portable text.

Builtin definitions are not UI renderers. If the app has no renderer for
`mfui.alert`, `mfui.timeline`, `mfui.form`, `mfui.bar_chart`,
`mfui.line_chart`, or `mfui.pie_chart`, it can still display or copy the
deterministic text projection. Chart projections are fixed data projections:
they expand chart data into readable text and do not generate inferred trend
summaries.

Builtin layouts are optional and SDK-owned. Custom components should remain
semantic components; MFUI currently supports the builtin `mfui.columns` layout
for arranging text and component cells.

Projection templates define a single `text` field. The app decides whether that
text uses Markdown syntax and how to use it for copying messages, search
indexing, audit logs, or model context.

## Server Usage

Adapter packages expose response helpers that fit into your existing route
handler and model flow.

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
    headers: { 'Content-Type': 'application/json' },
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
  return createMFUIResponse(upstream, mfui, {
    onMessage(message) {
      // Persist message.portableText here.
    },
  });
}
```

Use adapter packages when you want MFUI to translate a specific model stream:

- `@mfui/ai-sdk` for Vercel AI SDK `streamText()`
- `@mfui/openai-responses` for OpenAI Responses streaming
- `@mfui/openai-compatible` for OpenAI-compatible Chat Completions streaming
- `@mfui/anthropic` for Anthropic Messages streaming
- `@mfui/gemini` for Gemini streaming

For adapter examples, see:

- OpenAI compatible: `apps/docs/adapters/openai-compatible.md`
- Vercel AI SDK: `apps/docs/adapters/ai-sdk.md`
