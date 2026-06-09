# Quick Start

This page shows the shortest MFUI path: define a component, send its manifest
to the backend, let the model stream text plus `<mfui>` blocks, and
render the semantic response.

The server example uses the OpenAI-compatible Chat Completions stream shape
because it is supported by many model providers and local servers.

## 1. Define A Component On The Client

Define components on the client. The renderer stays in your app; MFUI needs
the schema, model hints, and projection templates.

```ts
import { defineMFUIComponent } from '@mfui/client';
import { z } from 'zod';

// The schema describes the component spec the model is allowed to produce.
export const timelineSchema = z.object({
  title: z.string(),
  items: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
    }),
  ),
});

export type TimelineSpec = z.infer<typeof timelineSchema>;

// The definition is serializable. The renderer is not part of it.
export const timelineDefinition = defineMFUIComponent<TimelineSpec>({
  // Use a namespaced name to avoid collisions with builtin definitions.
  name: 'app.timeline',
  schema: timelineSchema,
  model: {
    description: 'Show ordered events, plans, and milestones.',
  },
  projection: {
    // This portable text projection uses MFUI's restricted Liquid-like template syntax.
    text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}
{% endfor %}`,
  },
});
```

## 2. Send The Manifest From The Client

Add an `mfui` field to the chat request body. Its value is the request manifest
created from the component definitions this client supports.

The backend reads this `mfui` manifest to know which component specs the model
can generate and how completed specs should be projected to portable text.

```ts
import { createMFUIManifest } from '@mfui/client';
import { timelineDefinition } from './timeline-definition';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages,
    mfui: createMFUIManifest({
      components: [timelineDefinition],
    }),
  }),
});
```

## 3. Stream From The Server

On the server, merge MFUI's prompt into your existing model call. Normal model
text becomes `text.delta`; completed `<mfui>` blocks become validated
`component.snapshot` events.

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
            // Adds the component catalog, JSON schemas, and <mfui> block rules.
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

`createMFUIResponse()` reads provider text deltas, parses completed `<mfui>`
blocks, validates component specs, and returns MFUI semantic SSE. `onMessage`
runs after the message is complete, so the server can store
`message.portableText` for history, search, or audit logs.

## 4. Render The Response On The Client

Back on the client, use `streamMFUIMessage()` to read projected message snapshots
from the SSE response, then render each part by type.

```tsx
import {
  streamMFUIMessage,
  type ProjectedMessage,
} from '@mfui/client';
import type { TimelineSpec } from './timeline-definition';

for await (const snapshot of streamMFUIMessage(response)) {
  // Your app owns storing or re-rendering each message snapshot.
  // In React this is usually setState; in Vue this is usually a ref/store update.
  renderAssistantMessage(snapshot);
}

function Timeline({ spec }: { spec: TimelineSpec }) {
  return (
    <section>
      <h3>{spec.title}</h3>
      <ol>
        {spec.items.map((item) => (
          <li key={`${item.time}:${item.title}`}>
            <strong>{item.time}</strong> {item.title}
          </li>
        ))}
      </ol>
    </section>
  );
}

// AssistantMessage is your app's own message renderer.
function AssistantMessage({ message }: { message: ProjectedMessage }) {
  return message.parts.map((part) => {
    if (part.type === 'text') {
      // Markdown is your app's own text renderer.
      return <Markdown key={part.id}>{part.content}</Markdown>;
    }

    if (part.type === 'component' && part.component === 'app.timeline') {
      // Timeline is your app's renderer for app.timeline.
      return <Timeline key={part.id} spec={part.spec as TimelineSpec} />;
    }

    // Unknown components and layouts still have deterministic text fallback.
    return <Markdown key={part.id}>{part.projection.text}</Markdown>;
  });
}
```
