# Introduction

## About Generative UI

In a typical chat UI, the model mostly emits Markdown. It can write lists,
tables, and code blocks, but it is a poor fit for content that wants richer
interaction: timelines, plans, metric cards, forms, charts, product cards,
step progress, expandable diagnostics, and similar UI.

Generative UI lets the model produce structured interface data when a component
is a better answer than prose. The user sees a clearer, more interactive
response. The application still owns visual rendering, interaction logic, and
the design system; the model only produces component data.

## The Problem With Generative UI

Components are good for display, but they are not always good message history.

If a chat record only contains a visual component, copying the assistant message
loses content. Sending that history back to the model is also difficult because
the component's meaning is no longer available as normal text. If the app stores
raw JSON, HTML, or internal UI state as context, the model sees content that is
verbose, unstable, and hard to search, audit, or share.

Many generative UI systems solve "how do I render this component" without also
solving "how does this component become reliable text again." That matters for
common workflows:

- Copying an AI response.
- Reusing message history as model context.
- Storing, searching, and auditing conversations.
- Showing a message in a client that does not support a component.
- Preserving the meaning of old messages after renderers change.

## MFUI's Approach

MFUI is a message protocol and toolkit that composes into the AI workflow you
already use. It gives you generative UI while also solving how component
messages are copied, reused as history context, searched, and displayed in
clients that do not know a component.

It does not lock you into a frontend framework, backend framework, or model
provider. The frontend defines components, schemas, and text projections. The
server gives those definitions to the model, validates returned component data,
and generates a stable text fallback. Your application still decides how each
component is rendered and how it behaves.

That gives every AI message two forms:

| Form | Purpose |
| --- | --- |
| Component spec | Render rich, interactive UI on the client. |
| Text projection | Support copy, history context, search, audit, and unknown-component fallback. |

<MFUIProjectionPreview />

## How It Compares

Most generative UI systems focus first on how the model creates UI or how the
frontend renders UI. MFUI focuses on a different boundary: when UI becomes part
of an AI message, how does that message get copied, stored, searched, audited,
and reused as model context?

| Capability | MFUI | [json-render](https://json-render.dev/docs/specs) | [A2UI](https://a2ui.org/introduction/what-is-a2ui/) | [assistant-ui](https://www.assistant-ui.com/docs/tools/generative-ui) | [OpenUI](https://www.openui.com/docs) |
| --- | --- | --- | --- | --- | --- |
| Generate renderable components | ✅ | ✅ | ✅ | ✅ | ✅ |
| Use app-owned components | ✅ | ✅ renderer | ✅ native | ✅ React | ⚠️ runtime |
| Server-side component validation | ✅ built in | ⚠️ specs/schemas | ✅ protocol layer | ⚠️ allowlist first | ⚠️ framework-handled |
| Copy as stable text | ✅ built in | ❌ | ❌ | ❌ | ❌ |
| Reuse as model context | ✅ portable text | ❌ JSON spec-oriented | ❌ UI state-oriented | ⚠️ app-designed | ❌ UI response-oriented |
| Unknown-component text fallback | ✅ built in | ⚠️ renderer-defined | ⚠️ renderer-defined | ⚠️ fallback component | ⚠️ renderer-defined |
| Message-level semantics | ✅ text + components | ❌ UI spec first | ⚠️ agent/surface | ⚠️ chat parts | ⚠️ UI response |
| Dynamic UI and interaction | ⚠️ app components own it | ✅ | ✅ | ✅ | ✅ |
| Cross-platform native UI | ❌ | ⚠️ renderer-dependent | ✅ | ❌ | ❌ |
| Adoption cost | ✅ small layer | ⚠️ adopt spec system | ❌ larger protocol surface | ⚠️ React chat stack | ❌ closer to a full framework |

These approaches are not mutually exclusive. If you need an agent to drive
complex UI state over time, A2UI, OpenUI, or assistant-ui may be the fuller
layer. MFUI is meant to fill the message semantics layer: structured components
and stable text exist together.
