---
outline: [2, 3]
---

# Semantic Streaming

Semantic streaming represents one model response as an event sequence that can
be consumed incrementally. Normal text is sent as deltas, components and layouts
are sent as complete snapshots, and the final event includes the message's
`portableText`.

MFUI uses Server-Sent Events as the transport format. The event name is carried
by the `event` field, and the event payload is JSON in the `data` field.

## Event Model

A minimal complete response looks like this:

```txt
event: message.start
data: {"id":"msg_1"}

event: text.delta
data: {"partId":"txt_1","text":"Here is the plan."}

event: message.end
data: {"id":"msg_1","portableText":"Here is the plan."}
```

Clients read these as semantic event objects with a `type`, such as
`type: 'text.delta'`.

## Event Types

| Event | Meaning |
| --- | --- |
| `message.start` | Starts a message and provides the message id. |
| `text.delta` | Appends text to a text part. Deltas with the same `partId` are merged into the same text part. |
| `component.snapshot` | Sends a validated and projected complete component snapshot. |
| `layout.snapshot` | Sends a validated and projected complete layout snapshot. |
| `message.end` | Ends the message and provides final `portableText`. |
| `error` | Reports a semantic stream processing error. |

## Streaming Strategy

Text can be sent as deltas because normal prose does not need to wait for a
complete structured object.

Components are sent as snapshots. The model must first emit a complete component
spec so the server can validate the schema, render the projection, and emit a
`component.snapshot`.

Layouts are also sent as snapshots. For `mfui.columns`, the server validates the
layout structure, validates and projects any component cells, and then emits a
`layout.snapshot`.

## Server Generation

Provider adapters read the upstream model stream and return an MFUI SSE
response:

```ts
import { createMFUIResponse } from '@mfui/openai-compatible';

const response = createMFUIResponse(upstream, mfui);
```

The model can emit normal text and `<mfui>` blocks. Adapters convert normal text
into `text.delta` events and emit `component.snapshot` or `layout.snapshot` when
a complete `<mfui>` block has been parsed.

## Client Reading

Use `readMFUIMessage()` when you only need the final message:

```ts
import { readMFUIMessage } from '@mfui/client';

const assistantMessage = await readMFUIMessage(response);
```

Use `streamMFUIMessage()` for streaming UI that consumes progressive message
snapshots:

```ts
import { streamMFUIMessage } from '@mfui/client';

for await (const message of streamMFUIMessage(response)) {
  render(message);
}
```

## Advanced Usage

Most applications only need provider adapters and the client reading APIs. For
custom transports or advanced stream handling, MFUI also exposes lower-level
primitives:

| API | Purpose |
| --- | --- |
| `createMFUIStreamWriter` | Manually write MFUI semantic SSE. |
| `createMFUIBlockParser` | Parse normal text and `<mfui>` blocks from a text stream. |
| `readSemanticStream` | Read MFUI SSE into semantic events. |
| `createMessageAccumulator` | Accumulate semantic events into projected message snapshots. |
