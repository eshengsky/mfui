---
outline: [2, 3]
---

# Layouts

Layouts arrange multiple cells inside one message. A cell can be text or a
component. A layout describes arrangement only; it does not express domain
semantics or include a visual renderer.

Applications cannot define custom layouts. When a message needs layout,
enable an SDK-provided builtin layout; custom domain content should still be
expressed through custom components.

## `mfui.columns`

`mfui.columns` displays two or three related pieces of content side by side.

### Enable

`mfui.columns` is not enabled automatically. Import `columnsLayout` from
`@mfui/client/layouts` and include it in the request manifest's `layouts` array.

```ts
import { createMFUIManifest } from '@mfui/client';
import { timelineDefinition } from '@mfui/client/definitions';
import { columnsLayout } from '@mfui/client/layouts';

const mfui = createMFUIManifest({
  components: [timelineDefinition],
  layouts: [columnsLayout],
});
```

### Shape

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `layout` | `'mfui.columns'` | Yes | Layout name. |
| `columns` | `Array<TextCell \| ComponentCell>` | Yes | Column contents. Must contain 2 or 3 cells. |

| Constraint | Description |
| --- | --- |
| Column count | Must be 2 or 3 columns. |
| Column content | Each column contains exactly one cell. |
| Cell type | Each cell must be either `TextCell` or `ComponentCell`. |
| Nested layouts | Layouts cannot be nested inside columns. |

### `TextCell`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | Yes | Text content. Must not be empty. Markdown-compatible text is allowed. |

### `ComponentCell`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `component` | `string` | Yes | Component name. Must reference a component included in the same manifest. |
| `spec` | `unknown` | Yes | Component spec. Must match the referenced component schema. |

Each cell must contain exactly one content type: either `text`, or `component`
and `spec`. It cannot contain both `text` and `component`.

### Model Output

The model outputs a layout payload inside an `<mfui>` block:

```json
{
  "layout": "mfui.columns",
  "columns": [
    {
      "text": "### Recommendation\nShip behind a feature flag."
    },
    {
      "component": "mfui.timeline",
      "spec": {
        "title": "Launch plan",
        "items": [
          {
            "time": "Today",
            "title": "Prepare rollout checklist"
          }
        ]
      }
    }
  ]
}
```

Layout text projection rules are described in [Projections](./projections.md).
