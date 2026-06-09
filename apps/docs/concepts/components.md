---
outline: [2, 3]
---

# Components

A component definition describes structured content the model may produce and
how that content projects back into stable text. MFUI uses component
definitions to build model prompts, validate model output, and provide text
fallbacks for clients without matching renderers.

A component definition contains:

- `name`
- `schema`
- `model` hints
- `projection` templates

Component definitions do not include visual renderers or interaction logic. The
application still owns UI, state, and business workflows.

## Custom Components

Define a custom component when the builtin components do not express your
domain semantics. Custom components should represent domain content, such as an
order status, account summary, or quote result, instead of wrapping Markdown or
visual arrangement.

Use a namespaced component name so model output, server validation, renderer
lookup, and persisted history stay unambiguous. App-owned definitions should use
an app or domain prefix, such as `app.order_status` or `crm.account_summary`,
instead of unqualified names like `timeline`.

```ts
import { createMFUIManifest, defineMFUIComponent } from '@mfui/client';
import { z } from 'zod';

const orderStatus = defineMFUIComponent({
  name: 'app.order_status',
  schema: z.object({
    orderId: z.string(),
    status: z.string(),
  }),
  model: {
    description: 'Show the current status of an order.',
  },
  projection: {
    text: '**Order {{ orderId }}:** {{ status }}',
  },
});
```

The renderer stays in your app. When sending a request, pass component
definitions to `createMFUIManifest()`. It creates the serializable request
manifest that tells the server which components the model may generate.

```ts
const mfui = createMFUIManifest({
  components: [orderStatus],
});
```

## Builtin Components

MFUI provides common semantic component definitions under
`@mfui/client/definitions`. Builtin components are still only definitions: they
provide schemas, model hints, and projection templates, not renderers.

Builtin components are not added to requests automatically. Applications choose
which definitions to put in the manifest for the current request; they can
include only a subset or mix builtins with custom components. The server only
exposes components from the current manifest to the model.

If a client does not have a renderer for a builtin component, it can display
`part.projection.text`.

The example below enables all current builtin components. In production, select
only the definitions the current surface supports.

```ts
import { createMFUIManifest } from '@mfui/client';
import {
  alertDefinition,
  timelineDefinition,
  formDefinition,
  barChartDefinition,
  lineChartDefinition,
  pieChartDefinition,
} from '@mfui/client/definitions';

const mfui = createMFUIManifest({
  components: [
    alertDefinition,
    timelineDefinition,
    formDefinition,
    barChartDefinition,
    lineChartDefinition,
    pieChartDefinition,
  ],
});
```

### `mfui.alert`

Shows a contextual message that should stand out from normal prose, such as an
info, success, warning, or error notice.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | Yes | Notice type. |
| `title` | `string` | No | Short heading. |
| `description` | `string` | Yes | Main notice text. |

The projection includes the notice type, optional title, and description.

### `mfui.timeline`

Shows ordered events, plans, milestones, or schedules.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Timeline title. |
| `items` | `TimelineItem[]` | Yes | One or more ordered items. |

The projection includes the title and lists each item in order.

#### `TimelineItem`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | `string` | Yes | Time, date, or phase label. |
| `title` | `string` | Yes | Item title. |
| `description` | `string` | No | Additional item details. |

### `mfui.form`

Describes a short form that asks the user to provide structured information.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Form title. |
| `description` | `string` | No | Optional form context. |
| `fields` | `FormField[]` | Yes | One or more fields. |
| `submitText` | `string` | No | Submit button label. |

`FormField` can be any of the following field types.

#### `InputField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'input'` | Yes | Single-line input field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `inputType` | `'text' \| 'email' \| 'password' \| 'url' \| 'tel' \| 'number'` | No | Input type. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string` | No | Default value. |

#### `TextareaField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'textarea'` | Yes | Multi-line text field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string` | No | Default value. |

#### `ChoiceField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'choice'` | Yes | Choice field that can render as a select, radio group, checkbox group, or similar control. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `options` | `ChoiceOption[]` | Yes | One or more choices. |
| `multiple` | `boolean` | No | Whether multiple values can be selected. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string \| string[]` | No | Default selected value. Use a string array for multiple values. |

#### `ChoiceOption`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | User-facing option label. |
| `value` | `string` | Yes | Option value. |
| `description` | `string` | No | Additional option details. |

#### `SwitchField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'switch'` | Yes | Boolean switch field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `defaultValue` | `boolean` | No | Default switch state. |

#### `DateField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'date'` | Yes | Date field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string` | No | Default date value. |

#### `TimeField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'time'` | Yes | Time field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string` | No | Default time value. |

#### `DatetimeField`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `'datetime'` | Yes | Date-time field. |
| `name` | `string` | Yes | Field name, usually used as the submitted value key. |
| `label` | `string` | Yes | User-facing field label. |
| `description` | `string` | No | Field help text. |
| `required` | `boolean` | No | Whether the field is required. |
| `placeholder` | `string` | No | Placeholder text. |
| `defaultValue` | `string` | No | Default date-time value. |

`mfui.form` does not define submit behavior. Applications decide whether
submitting the form disables it, replaces it with text, sends a new user
message, or runs another business workflow.

### `mfui.bar_chart`

Compares numeric values across categories. The optional `series` field can
represent grouped bars.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Chart title. |
| `description` | `string` | No | Optional context. |
| `xLabel` | `string` | No | X-axis label. |
| `yLabel` | `string` | No | Y-axis label. |
| `unit` | `string` | No | Unit suffix or label, such as `users`, `USD`, or `%`. |
| `data` | `BarChartDataPoint[]` | Yes | Data points, up to 100. |

#### `BarChartDataPoint`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Category label. |
| `value` | `number` | Yes | Numeric value. |
| `series` | `string` | No | Group name. |

### `mfui.line_chart`

Shows numeric change over time or another ordered axis. The optional `series`
field can represent multiple lines.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Chart title. |
| `description` | `string` | No | Optional context. |
| `xLabel` | `string` | No | X-axis label. |
| `yLabel` | `string` | No | Y-axis label. |
| `unit` | `string` | No | Unit suffix or label, such as `users`, `USD`, or `%`. |
| `data` | `LineChartDataPoint[]` | Yes | Ordered data points, up to 100. |

#### `LineChartDataPoint`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Time point, phase, or ordered-axis label. |
| `value` | `number` | Yes | Numeric value. |
| `series` | `string` | No | Line series name. |

### `mfui.pie_chart`

Shows how non-negative numeric values compose a whole.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Chart title. |
| `description` | `string` | No | Optional context. |
| `unit` | `string` | No | Unit suffix or label, such as `%`. |
| `data` | `PieChartDataPoint[]` | Yes | Non-negative category values, up to 100. |

#### `PieChartDataPoint`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Category label. |
| `value` | `number` | Yes | Non-negative numeric value. |
