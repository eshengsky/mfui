---
outline: [2, 3]
---

# Projections

A projection is the stable text representation of a component or layout. It lets
the same message render UI while remaining usable for copy, storage, search, and
future model context.

## Component Projections

Every component definition must provide `projection.text`. This is the canonical
text representation of the component spec.

This spec:

```ts
{
  title: 'Launch plan',
  items: [
    {
      time: 'Week 1',
      title: 'Canary',
    },
  ],
}
```

can use this projection template:

```ts
projection: {
  text: `### {{ title }}

{% for item in items %}
- {{ item.time }}: {{ item.title }}
{% endfor %}`,
}
```

which renders:

```md
### Launch plan

- Week 1: Canary
```

## Template Syntax

Projection templates use MFUI's restricted
[Liquid](https://shopify.github.io/liquid/)-like template syntax. Treat the
projection syntax as an MFUI subset, not as full Liquid.

MFUI validates this subset before rendering by default. Templates throw when
they use unsupported tags or filters.

| Feature | Supported values |
| --- | --- |
| Tags | `for`, `endfor`, `if`, `endif`, `unless`, `endunless`, `else`, `elsif` |
| Filters | `default`, `join`, `truncate`, `escapeMarkdown`, `strip`, `size` |

## Writing Principles

Projections should be stable: the same spec should produce the same text.

Projections should be readable: they are text for copy, search, audit logs, and
model context, not JSON dumps.

Projections should not infer information that is not present in the spec. For
example, chart projections can expand data points, but should not add trend
summaries unless those summaries are explicit spec fields.

Projections may use Markdown syntax, but MFUI does not require Markdown.

## Layout Projections

Layouts do not define projection templates. Builtin layouts combine their cells
in a deterministic order.

For `mfui.columns`:

| Cell | Projection rule |
| --- | --- |
| `TextCell` | Uses the cell's own `text`. |
| `ComponentCell` | Uses the referenced component's rendered `projection.text`. |
| Multiple cells | Joined from left to right with blank lines. |

Column position is visual structure, so it is not written into projection text.
The projection does not add labels such as "Column 1".

## `portableText`

Message-level `portableText` is the final deterministic text for the message.
It is assembled from text parts, component projections, and layout projections.

| Part type | Text source |
| --- | --- |
| Text part | `content` |
| Component part | `projection.text` |
| Layout part | `projection.text` |

Chunks are joined with blank lines, and empty chunks are ignored.

```ts
import { messageToPortableText } from '@mfui/client';

const text = messageToPortableText(message);
```

MFUI only generates this text. The application decides how to use it for copy,
search, audit logs, or future model context.
