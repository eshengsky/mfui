---
outline: [2, 2]
---

# `@mfui/client`

`@mfui/client` is the browser-side SDK for defining MFUI components, sending a
serializable manifest to the server, reading MFUI semantic streams, and working
with projected messages.

Most applications use this package in the chat UI or request layer they already
own.

## `defineMFUIComponent()`

Creates a component definition that can be used locally and serialized into an
MFUI component manifest.

### Import

```ts
import { defineMFUIComponent } from '@mfui/client';
```

### Signature

```ts
function defineMFUIComponent<TSpec>(
  input: DefineMFUIComponentInput<TSpec>,
): MFUIComponentDefinition<TSpec>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `input` | <code><a href="#definemfuicomponentinput-tspec">DefineMFUIComponentInput</a>&lt;TSpec&gt;</code> | Yes | n/a | Component definition input. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#mfuicomponentdefinition-tspec">MFUIComponentDefinition</a>&lt;TSpec&gt;</code> | A local component definition with `manifest`, `project()`, `validate()`, and `toManifest()`. |

### Example

```ts
import { z } from 'zod';
import { defineMFUIComponent } from '@mfui/client';

const taskListDefinition = defineMFUIComponent({
  name: 'app.task_list',
  schema: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        label: z.string(),
        done: z.boolean().default(false),
      }),
    ),
  }),
  model: {
    description: 'Show a short checklist of tasks.',
    whenToUse: 'Use this when the answer contains actionable tasks.',
  },
  projection: {
    text: `### {{ title }}

{% for item in items %}
- {{ item.label }}{% if item.done %} (done){% endif %}
{% endfor %}`,
  },
});
```

### Notes

When `schema` is a Zod schema, MFUI converts it to JSON Schema for the
serialized manifest. If you pass a raw JSON Schema, local `validate()` returns a
failure explaining that JSON Schema validation is handled by `@mfui/server`.

`project()` can throw if the projection template uses unsupported MFUI template
tags or filters.

## `DefineMFUIComponentInput<TSpec>`

Input object for `defineMFUIComponent()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | n/a | Stable component name used in model output, stream events, and renderer lookup. |
| `schema` | <code><a href="#componentschema-tspec">ComponentSchema</a>&lt;TSpec&gt;</code> | Yes | n/a | A Zod schema or JSON Schema describing valid component specs. |
| `jsonSchema` | <code><a href="#jsonschema">JsonSchema</a></code> | No | n/a | Explicit JSON Schema to put in the manifest. When provided, it overrides the schema generated from Zod. |
| `projection` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | Yes | n/a | Templates that turn the component spec into portable text. Currently supports `text`. |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | No | n/a | Description, usage guidance, and examples included in server prompts. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Serializable application metadata attached to the component manifest. |

## `MFUIComponentDefinition<TSpec>`

Component definition returned by `defineMFUIComponent()`.

| Property or Method | Type | Description |
| --- | --- | --- |
| `name` | `string` | Component name copied from the definition input. |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | Serializable component manifest. |
| `project(spec)` | <code>(spec: TSpec) =&gt; <a href="#projection">Projection</a></code> | Renders the projection templates for a spec. |
| `validate(spec)` | <code>(spec: unknown) =&gt; <a href="#validationresult">ValidationResult</a></code> | Validates specs locally when `schema` is a Zod schema. |
| `toManifest()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a></code> | Returns the serializable manifest. |

## `ComponentSchema<TSpec>`

Schema input accepted by `defineMFUIComponent()`.

### Shape

```ts
type ComponentSchema<TSpec> = ZodTypeAny | JsonSchema
```

### Notes

Pass a Zod schema when you want local client-side validation through
`definition.validate()`. Pass a JSON Schema when the schema is already available
in serializable form.

## `ComponentModelHints`

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `description` | `string` | Yes | n/a | Model-facing description of what the component represents. |
| `whenToUse` | `string` | No | n/a | Model-facing guidance for when the component is appropriate. |
| `examples` | `Array<{ user: string; spec: unknown }>` | No | n/a | Example user requests and valid specs for prompting. |

## `ComponentManifest`

Serializable manifest for one component.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | n/a | Stable component name. |
| `schema` | <code><a href="#jsonschema">JsonSchema</a></code> | Yes | n/a | JSON Schema for the component spec. |
| `projection` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | Yes | n/a | Templates used to project the spec into text. |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | No | n/a | Model-facing hints used by server prompts. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `ProjectionTemplates`

Template object used to render projections.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `string` | Yes | n/a | MFUI semantic template that renders component specs to text. |

## `Projection`

Rendered projection object.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `string` | Yes | n/a | Deterministic text representation of a component spec. |

## `JsonSchema`

JSON Schema object shape.

### Shape

```ts
type JsonSchema = JsonObject
```

## `JsonObject`

JSON-compatible object shape.

### Shape

```ts
type JsonObject = Record<string, unknown>
```

## `ValidationResult`

Validation success or failure union.

### Shape

```ts
type ValidationResult = ValidationSuccess | ValidationFailure
```

## `ValidationSuccess`

Successful validation result.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `ok` | `true` | Yes | n/a | Success discriminator. |

## `ValidationFailure`

Failed validation result.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `ok` | `false` | Yes | n/a | Failure discriminator. |
| `errors` | `string[]` | Yes | n/a | Validation error messages. |

## `isMFUIComponentDefinition()`

Checks whether an unknown value has the shape of an MFUI component definition.

### Import

```ts
import { isMFUIComponentDefinition } from '@mfui/client';
```

### Signature

```ts
function isMFUIComponentDefinition(
  value: unknown,
): value is MFUIComponentDefinition
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `unknown` | Yes | n/a | Value to inspect. |

### Returns

| Type | Description |
| --- | --- |
| `boolean` | `true` when the value is an object with `manifest`, `project`, and `toManifest` properties. |

## `createMFUIManifest()`

Creates the manifest payload usually sent from the frontend to the backend.

### Import

```ts
import { createMFUIManifest } from '@mfui/client';
```

### Signature

```ts
function createMFUIManifest(
  input: CreateMFUIManifestInput,
): MFUIManifest
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `input` | <code><a href="#createmfuimanifestinput">CreateMFUIManifestInput</a></code> | Yes | n/a | Manifest construction input. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#mfuimanifest">MFUIManifest</a></code> | Serializable manifest with a `components` array and optional `layouts` array. |

### Example

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
import { columnsLayout } from '@mfui/client/layouts';

const mfui = createMFUIManifest({
  components: [
    alertDefinition,
    timelineDefinition,
    formDefinition,
    barChartDefinition,
    lineChartDefinition,
    pieChartDefinition,
  ],
  layouts: [columnsLayout],
});

await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, mfui }),
});
```

### Notes

This helper normalizes component and layout inputs but does not validate the
full manifest. Use server-side validation before trusting model-generated
component specs.

## `CreateMFUIManifestInput`

Input object for `createMFUIManifest()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `components` | <code>readonly <a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | Yes | n/a | Component definitions, raw component manifests, or objects with `toManifest()`. |
| `layouts` | <code>readonly <a href="#layoutmanifestinput">LayoutManifestInput</a>[]</code> | No | n/a | Builtin layout definitions, raw layout manifests, or objects with `toManifest()`. |

## `MFUIManifest`

Serializable request manifest that lists the components available to a model
request.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifest">ComponentManifest</a>[]</code> | Yes | n/a | Components available to the current request. |
| `layouts` | <code><a href="#layoutmanifest">LayoutManifest</a>[]</code> | No | n/a | Builtin layouts available to the current request. |

## `ComponentManifestInput`

Component input accepted by helpers that can work with either raw manifests or
objects that expose a manifest.

### Shape

```ts
type ComponentManifestInput = ComponentManifest | ComponentManifestProvider
```

## `ComponentManifestProvider`

Object that can return a component manifest.

| Property or Method | Type | Description |
| --- | --- | --- |
| `toManifest()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a></code> | Returns the serializable component manifest. |

## `LayoutManifest`

Serializable manifest for one builtin layout.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | n/a | Stable layout name. |
| `model` | <code><a href="#componentmodelhints">ComponentModelHints</a></code> | No | n/a | Model-facing layout guidance used by server prompts. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `LayoutManifestInput`

Layout input accepted by helpers that can work with either raw manifests or
objects that expose a manifest.

### Shape

```ts
type LayoutManifestInput = LayoutManifest | LayoutManifestProvider
```

## `LayoutManifestProvider`

Object that can return a layout manifest.

| Property or Method | Type | Description |
| --- | --- | --- |
| `toManifest()` | <code>() =&gt; <a href="#layoutmanifest">LayoutManifest</a></code> | Returns the serializable layout manifest. |

## `readMFUIMessage()`

Reads an MFUI semantic stream and resolves to the final projected message.

### Import

```ts
import { readMFUIMessage } from '@mfui/client';
```

### Signature

```ts
function readMFUIMessage(
  source: MFUIStreamSource,
): Promise<ProjectedMessage | undefined>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#mfuistreamsource">MFUIStreamSource</a></code> | Yes | n/a | A `Response`, a `ReadableStream<Uint8Array>`, or `null`. |

### Returns

| Type | Description |
| --- | --- |
| <code>Promise&lt;<a href="#projectedmessage-tspec">ProjectedMessage</a> &#124; undefined&gt;</code> | The last completed projected message, or `undefined` when the stream is empty or missing. |

### Example

```ts
import { readMFUIMessage } from '@mfui/client';

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { Accept: 'text/event-stream' },
});

const message = await readMFUIMessage(response);
console.log(message?.portableText);
```

### Throws

Throws when a `Response` is not OK, when the stream contains an MFUI `error`
event, or when the semantic stream data cannot be parsed.

## `streamMFUIMessage()`

Reads an MFUI semantic stream as progressive projected message snapshots.

### Import

```ts
import { streamMFUIMessage } from '@mfui/client';
```

### Signature

```ts
function streamMFUIMessage(
  source: MFUIStreamSource,
): AsyncIterable<ProjectedMessage>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | <code><a href="#mfuistreamsource">MFUIStreamSource</a></code> | Yes | n/a | A `Response`, a `ReadableStream<Uint8Array>`, or `null`. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#projectedmessage-tspec">ProjectedMessage</a>&gt;</code> | Yields projected message snapshots as semantic stream events arrive. |

### Example

```ts
import { streamMFUIMessage } from '@mfui/client';

for await (const message of streamMFUIMessage(response)) {
  renderAssistantMessage(message);
}
```

### Throws

Throws for the same error cases as `readMFUIMessage()`.

## `MFUIStreamSource`

Stream source accepted by `readMFUIMessage()` and `streamMFUIMessage()`.

### Shape

```ts
type MFUIStreamSource = Response | ReadableStream<Uint8Array> | null
```

### Notes

When a `Response` is provided, the client checks `response.ok` before reading
the body.

## `ProjectedMessage<TSpec>`

Projected message with `portableText`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | n/a | Message id. |
| `parts` | <code>Array&lt;<a href="#projectedmessagepart-tspec">ProjectedMessagePart</a>&lt;TSpec&gt;&gt;</code> | Yes | n/a | Projected text, component, and layout parts. |
| `portableText` | `string` | Yes | n/a | Deterministic text for copy, storage, search, and future model context. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata copied from the raw message. |

## `ProjectedMessagePart<TSpec>`

Union of projected text, component, and layout parts.

### Shape

```ts
type ProjectedMessagePart<TSpec = unknown> =
  | TextPart
  | ProjectedComponentPart<TSpec>
  | ProjectedLayoutPart<TSpec>
```

## `ProjectedComponentPart<TSpec>`

Component part with a required text projection.

### Shape

```ts
type ProjectedComponentPart<TSpec = unknown> =
  Omit<ComponentPart<TSpec>, 'projection'> & {
    projection: Projection
  }
```

## `ProjectedLayoutPart<TSpec>`

Layout part with projected cells and a required text projection.

### Shape

```ts
type ProjectedLayoutPart<TSpec = unknown> = {
  id: string
  type: 'layout'
  layout: 'mfui.columns'
  columns: Array<TextPart | ProjectedComponentPart<TSpec>>
  projection: Projection
  metadata?: JsonObject
}
```

## `TextPart`

Plain text message part.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | n/a | Stable part id. |
| `type` | `'text'` | Yes | n/a | Part discriminator. |
| `content` | `string` | Yes | n/a | Text content. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `ComponentPart<TSpec>`

Message part that references a component and spec.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | n/a | Stable part id. |
| `type` | `'component'` | Yes | n/a | Part discriminator. |
| `component` | `string` | Yes | n/a | Component name. |
| `spec` | `TSpec` | Yes | n/a | Component spec data. |
| `projection` | <code><a href="#projection">Projection</a></code> | No | n/a | Existing projection. When missing, helpers can render it from the manifest. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `messageToPortableText()`

Converts projected message parts into deterministic text.

### Import

```ts
import { messageToPortableText } from '@mfui/client';
```

### Signature

```ts
function messageToPortableText(
  partsOrMessage: ProjectedMessagePart[] | ProjectedMessage,
): string
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `partsOrMessage` | <code><a href="#projectedmessagepart-tspec">ProjectedMessagePart</a>[] &#124; <a href="#projectedmessage-tspec">ProjectedMessage</a></code> | Yes | n/a | Projected parts or a full projected message. |

### Returns

| Type | Description |
| --- | --- |
| `string` | Text parts, component `projection.text` values, and layout `projection.text` values joined with blank lines. Empty chunks are omitted. |

## `projectMessage()`

Projects every component part, including component cells inside layout parts, in
a raw message and returns a projected message.

### Import

```ts
import { projectMessage } from '@mfui/client';
```

### Signature

```ts
function projectMessage<TSpec = unknown>(
  message: MessageIR<TSpec>,
  options: ProjectMessageOptions,
): ProjectedMessage<TSpec>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | <code><a href="#messageir-tspec">MessageIR</a>&lt;TSpec&gt;</code> | Yes | n/a | Message containing text, component, and layout parts. |
| `options` | <code><a href="#projectmessageoptions">ProjectMessageOptions</a></code> | Yes | n/a | Projection options. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#projectedmessage-tspec">ProjectedMessage</a>&lt;TSpec&gt;</code> | Message with component projections and `portableText`. |

### Throws

Throws when a component part references a component that is not included in
`options.components`.

## `ProjectMessageOptions`

Options for `projectMessage()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | Yes | n/a | Manifests used to project component parts. |

## `MessageIR<TSpec>`

Raw message with text, component, and layout parts.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | n/a | Message id. |
| `parts` | <code>Array&lt;<a href="#messagepart-tspec">MessagePart</a>&lt;TSpec&gt;&gt;</code> | Yes | n/a | Text, component, and layout message parts. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `MessagePart<TSpec>`

Union of text, component, and layout message parts.

### Shape

```ts
type MessagePart<TSpec = unknown> =
  | TextPart
  | ComponentPart<TSpec>
  | LayoutPart<TSpec>
```

## `LayoutPart<TSpec>`

Raw builtin layout message part.

### Shape

```ts
type LayoutPart<TSpec = unknown> = {
  id: string
  type: 'layout'
  layout: 'mfui.columns'
  columns: Array<TextPart | ComponentPart<TSpec>>
  projection?: Projection
  metadata?: JsonObject
}
```

## `createTextPart()`

Creates a text part for a message.

### Import

```ts
import { createTextPart } from '@mfui/client';
```

### Signature

```ts
function createTextPart(
  content: string,
  options?: { id?: string },
): TextPart
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `content` | `string` | Yes | n/a | Text content for the part. |
| `options` | `{ id?: string }` | No | `{}` | Optional part options. |
| `options.id` | `string` | No | generated `txt_*` id | Stable part id. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#textpart">TextPart</a></code> | Message part with `type: 'text'`. |

## `createComponentPart()`

Creates a component part for a message.

### Import

```ts
import { createComponentPart } from '@mfui/client';
```

### Signature

```ts
function createComponentPart<TSpec>(
  component: string,
  spec: TSpec,
  options?: { id?: string },
): ComponentPart<TSpec>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `component` | `string` | Yes | n/a | Component name. |
| `spec` | `TSpec` | Yes | n/a | Component spec data. |
| `options` | `{ id?: string }` | No | `{}` | Optional part options. |
| `options.id` | `string` | No | generated `cmp_*` id | Stable part id. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#componentpart-tspec">ComponentPart</a>&lt;TSpec&gt;</code> | Message part with `type: 'component'`. |

## `renderProjection()`

Renders every projection template for a spec.

### Import

```ts
import { renderProjection } from '@mfui/client';
```

### Signature

```ts
function renderProjection(
  templates: ProjectionTemplates,
  data: unknown,
  options?: TemplateRenderOptions,
): Projection
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `templates` | <code><a href="#projectiontemplates">ProjectionTemplates</a></code> | Yes | n/a | Projection template object. Currently contains `text`. |
| `data` | `unknown` | Yes | n/a | Data object used as the template context. |
| `options` | <code><a href="#templaterenderoptions">TemplateRenderOptions</a></code> | No | `{}` | Template rendering options. |
| `options.validateSubset` | `boolean` | No | `true` | Whether to reject unsupported MFUI template tags and filters before rendering. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#projection">Projection</a></code> | Rendered projection object. Currently contains `text`. |

### Throws

Throws when template validation fails or template rendering fails.

## `renderSemanticTemplate()`

Renders one MFUI semantic template string.

### Import

```ts
import { renderSemanticTemplate } from '@mfui/client';
```

### Signature

```ts
function renderSemanticTemplate(
  template: string,
  data: unknown,
  options?: TemplateRenderOptions,
): string
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `template` | `string` | Yes | n/a | MFUI semantic template. |
| `data` | `unknown` | Yes | n/a | Data object used as the template context. |
| `options` | <code><a href="#templaterenderoptions">TemplateRenderOptions</a></code> | No | `{}` | Template rendering options. |
| `options.validateSubset` | `boolean` | No | `true` | Whether to reject unsupported MFUI template tags and filters before rendering. |

### Returns

| Type | Description |
| --- | --- |
| `string` | Rendered text. |

## `validateSemanticTemplate()`

Validates that a template uses only the MFUI-supported Liquid subset.

### Import

```ts
import { validateSemanticTemplate } from '@mfui/client';
```

### Signature

```ts
function validateSemanticTemplate(template: string): void
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `template` | `string` | Yes | n/a | Template to validate. |

### Returns

| Type | Description |
| --- | --- |
| `void` | Returns nothing when the template is valid. |

### Supported Template Subset

| Feature | Supported values |
| --- | --- |
| Tags | `for`, `endfor`, `if`, `endif`, `unless`, `endunless`, `else`, `elsif` |
| Filters | `default`, `join`, `truncate`, `escapeMarkdown`, `strip`, `size` |

### Throws

Throws when the template contains unsupported tags or filters.

## `TemplateRenderOptions`

Options for `renderProjection()` and `renderSemanticTemplate()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `validateSubset` | `boolean` | No | `true` | Whether to reject unsupported MFUI template tags and filters before rendering. |

## `createComponentRegistry()`

Creates a small registry for component manifests.

### Import

```ts
import { createComponentRegistry } from '@mfui/client';
```

### Signature

```ts
function createComponentRegistry(
  components?: ComponentManifestInput[],
): ComponentRegistry
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifestinput">ComponentManifestInput</a>[]</code> | No | `[]` | Initial components to register. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#componentregistry">ComponentRegistry</a></code> | Registry with `register()`, `get()`, `has()`, and `manifests()` methods. |

### Notes

Registering the same component name again replaces the previous manifest.

## `ComponentRegistry`

In-memory registry returned by `createComponentRegistry()`.

| Method | Type | Description |
| --- | --- | --- |
| `register(component)` | <code>(component: <a href="#componentmanifestinput">ComponentManifestInput</a>) =&gt; <a href="#componentregistry">ComponentRegistry</a></code> | Registers a component and returns the same registry for chaining. |
| `get(name)` | <code>(name: string) =&gt; <a href="#componentmanifest">ComponentManifest</a> &#124; undefined</code> | Gets a manifest by component name. |
| `has(name)` | `(name: string) => boolean` | Checks whether a component name is registered. |
| `manifests()` | <code>() =&gt; <a href="#componentmanifest">ComponentManifest</a>[]</code> | Returns registered manifests. |

## `getComponentManifest()`

Returns the raw manifest from either a manifest object or provider object.

### Import

```ts
import { getComponentManifest } from '@mfui/client';
```

### Signature

```ts
function getComponentManifest(
  component: ComponentManifestInput,
): ComponentManifest
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `component` | <code><a href="#componentmanifestinput">ComponentManifestInput</a></code> | Yes | n/a | A raw component manifest or an object with `toManifest()`. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#componentmanifest">ComponentManifest</a></code> | Normalized component manifest. |

## `projectSpecWithManifest()`

Projects one component spec using one manifest.

### Import

```ts
import { projectSpecWithManifest } from '@mfui/client';
```

### Signature

```ts
function projectSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): Projection
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | Yes | n/a | Manifest containing projection templates. |
| `spec` | `unknown` | Yes | n/a | Component spec to project. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#projection">Projection</a></code> | Rendered projection. |

## `createMessageAccumulator()`

Creates an event accumulator for code that already has MFUI semantic stream
events and wants to manage message state manually.

### Import

```ts
import { createMessageAccumulator } from '@mfui/client';
```

### Signature

```ts
function createMessageAccumulator(): MessageAccumulator
```

### Parameters

This function does not take parameters.

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#messageaccumulator">MessageAccumulator</a></code> | Stateful accumulator for current and completed projected messages. |

### Example

```ts
import { createMessageAccumulator } from '@mfui/client';

const accumulator = createMessageAccumulator();

for await (const event of events) {
  const state = accumulator.apply(event);
  renderMessages(state.messages, state.currentMessage);
}
```

### Throws

Throws if a stream event arrives before `message.start`, or if an `error` event
is applied.

## `MessageAccumulator`

Stateful accumulator returned by `createMessageAccumulator()`.

| Property or Method | Type | Description |
| --- | --- | --- |
| `messages` | <code>readonly <a href="#projectedmessage-tspec">ProjectedMessage</a>[]</code> | Completed messages. |
| `apply(event)` | <code>(event: <a href="#semanticstreamevent-tspec">SemanticStreamEvent</a>) =&gt; <a href="#messageaccumulatorstate">MessageAccumulatorState</a></code> | Applies one event and returns the latest state. |
| `snapshot()` | <code>() =&gt; <a href="#messageaccumulatorstate">MessageAccumulatorState</a></code> | Returns current accumulator state without applying a new event. |
| `getPortableText(messageId)` | `(messageId: string) => string \| undefined` | Finds portable text for a current or completed message. |
| `findMessage(messageId)` | <code>(messageId: string) =&gt; <a href="#projectedmessage-tspec">ProjectedMessage</a> &#124; undefined</code> | Finds a current or completed message. |

## `MessageAccumulatorState`

Snapshot returned by message accumulator methods.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `messages` | <code><a href="#projectedmessage-tspec">ProjectedMessage</a>[]</code> | Yes | n/a | Completed messages. |
| `currentMessage` | <code><a href="#projectedmessage-tspec">ProjectedMessage</a></code> | No | n/a | Current in-progress projected message. |

## `readSemanticStream()`

Low-level parser for MFUI SSE semantic events.

### Import

```ts
import { readSemanticStream } from '@mfui/client';
```

### Signature

```ts
function readSemanticStream(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<SemanticStreamEvent>
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `body` | `ReadableStream<Uint8Array> \| null` | Yes | n/a | SSE response body. |

### Returns

| Type | Description |
| --- | --- |
| <code>AsyncIterable&lt;<a href="#semanticstreamevent-tspec">SemanticStreamEvent</a>&gt;</code> | Parsed semantic stream events. Returns an empty iterable when `body` is `null`. |

## `SemanticStreamEvent<TSpec>`

Union of all MFUI semantic stream events.

### Shape

```ts
type SemanticStreamEvent<TSpec = unknown> =
  | MessageStartEvent
  | TextDeltaEvent
  | ComponentSnapshotEvent<TSpec>
  | LayoutSnapshotEvent<TSpec>
  | MessageEndEvent
  | ErrorEvent
```

## `MessageStartEvent`

Semantic stream event that starts a message.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'message.start'` | Yes | n/a | Event discriminator. |
| `id` | `string` | Yes | n/a | Message id. |
| `createdAt` | `string` | No | n/a | Optional creation timestamp. |

## `TextDeltaEvent`

Semantic stream event that appends text to a text part.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'text.delta'` | Yes | n/a | Event discriminator. |
| `partId` | `string` | Yes | n/a | Text part id. |
| `text` | `string` | Yes | n/a | Text chunk to append. |

## `ComponentSnapshotEvent<TSpec>`

Semantic stream event for one complete component snapshot.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'component.snapshot'` | Yes | n/a | Event discriminator. |
| `partId` | `string` | Yes | n/a | Component part id. |
| `component` | `string` | Yes | n/a | Component name. |
| `spec` | `TSpec` | Yes | n/a | Component spec data. |
| `projection` | <code><a href="#projection">Projection</a></code> | Yes | n/a | Text projection for the component. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `LayoutSnapshotEvent<TSpec>`

Semantic stream event for one complete builtin layout snapshot.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'layout.snapshot'` | Yes | n/a | Event discriminator. |
| `partId` | `string` | Yes | n/a | Layout part id. |
| `layout` | `'mfui.columns'` | Yes | n/a | Layout name. |
| `columns` | <code>Array&lt;<a href="#textpart">TextPart</a> &#124; <a href="#projectedcomponentpart-tspec">ProjectedComponentPart</a>&lt;TSpec&gt;&gt;</code> | Yes | n/a | Projected column cells. |
| `projection` | <code><a href="#projection">Projection</a></code> | Yes | n/a | Text projection for the layout. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `MessageEndEvent`

Semantic stream event that finishes a message.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'message.end'` | Yes | n/a | Event discriminator. |
| `id` | `string` | Yes | n/a | Message id. |
| `portableText` | `string` | Yes | n/a | Final deterministic text for the message. |
| `usage` | `{ inputTokens?: number; outputTokens?: number }` | No | n/a | Optional model usage information. |

## `ErrorEvent`

Semantic stream event for a stream failure.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | `'error'` | Yes | n/a | Event discriminator. |
| `code` | `string` | Yes | n/a | Machine-readable error code. |
| `message` | `string` | Yes | n/a | Human-readable error message. |
| `recoverable` | `boolean` | No | n/a | Whether the error may be recoverable. |
