---
outline: [2, 2]
---

# `@mfui/server`

`@mfui/server` is the server-side SDK for building MFUI prompts, parsing model
output, validating component specs, and returning MFUI semantic SSE responses.

Most adapter packages use these primitives internally. Application servers use
them directly when they want to build a custom model integration.

## `createMFUIPrompt()`

Creates model instructions for the components and layouts available to the
current request. The prompt tells the model how to emit normal text and when to
insert `<mfui>` blocks.

### Import

```ts
import { createMFUIPrompt } from '@mfui/server';
```

### Signature

```ts
function createMFUIPrompt(mfui: MFUIManifest): string
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components and layouts available for this model request. `null` and `undefined` are treated as disabled MFUI. |

### Returns

| Type | Description |
| --- | --- |
| `string` | Prompt text containing component descriptions, layout descriptions, JSON Schemas, examples, and MFUI block instructions. Returns an empty string when MFUI is disabled or has no components or layouts. |

### Example

```ts
import { createMFUIPrompt } from '@mfui/server';

const system = [
  'You are a helpful assistant.',
  createMFUIPrompt(mfui),
].filter(Boolean).join('\n\n');
```

### Throws

Throws `MFUIServerError` when a provided manifest has an invalid shape.

## `buildComponentCatalogText()`

Builds only the component catalog portion of the MFUI prompt.

### Import

```ts
import { buildComponentCatalogText } from '@mfui/server';
```

### Signature

```ts
function buildComponentCatalogText(mfui: MFUIManifest): string
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Components to list for the model. `null` and `undefined` are treated as disabled MFUI. |

### Returns

| Type | Description |
| --- | --- |
| `string` | Human-readable component catalog text. Returns an empty string when there are no components. |

## `buildLayoutCatalogText()`

Builds only the layout catalog portion of the MFUI prompt.

### Import

```ts
import { buildLayoutCatalogText } from '@mfui/server';
```

### Signature

```ts
function buildLayoutCatalogText(mfui: MFUIManifest): string
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Builtin layouts to list for the model. `null` and `undefined` are treated as disabled MFUI. |

### Returns

| Type | Description |
| --- | --- |
| `string` | Human-readable layout catalog text. Returns an empty string when there are no layouts. |

## `MFUIManifest`

Serializable manifest sent from the client to the server.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `components` | <code><a href="#componentmanifest">ComponentManifest</a>[]</code> | Yes | n/a | Components available to the current model request. |
| `layouts` | <code>Array&lt;{ name: string; model?: { description: string; whenToUse?: string; examples?: Array&lt;{ user: string; spec: unknown }&gt; }; metadata?: JsonObject }&gt;</code> | No | n/a | Builtin layouts available to the current model request. |

## `ComponentManifest`

Serializable manifest for one component.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | n/a | Stable component name used in model output, stream events, and renderers. |
| `schema` | <code><a href="#jsonschema">JsonSchema</a></code> | Yes | n/a | JSON Schema for the component spec. |
| `projection` | `{ text: string }` | Yes | n/a | Template used to project a valid component spec into portable text. |
| `model` | `{ description: string; whenToUse?: string; examples?: Array<{ user: string; spec: unknown }> }` | No | n/a | Model-facing component guidance used by `createMFUIPrompt()`. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Serializable application metadata. |

## `JsonSchema`

JSON Schema object used to validate component specs on the server.

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

## `createMFUIStreamWriter()`

Creates an MFUI semantic SSE writer. Use this when you are building a custom
provider adapter or writing server-side tests around MFUI streams.

### Import

```ts
import { createMFUIStreamWriter } from '@mfui/server';
```

### Signature

```ts
function createMFUIStreamWriter(
  mfui: MFUIManifest,
  options?: MFUIStreamWriterOptions,
): MFUIStreamWriter
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Manifest used to validate component snapshots and render projections. |
| `options` | <code><a href="#mfuistreamwriteroptions">MFUIStreamWriterOptions</a></code> | No | `{}` | Writer options. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#mfuistreamwriter">MFUIStreamWriter</a></code> | Stateful writer that emits MFUI semantic SSE events and exposes a `Response`. |

### Example

```ts
import {
  createMFUIBlockParser,
  createMFUIStreamWriter,
} from '@mfui/server';

const writer = createMFUIStreamWriter(mfui);
const parser = createMFUIBlockParser(mfui, writer);

parser.write('Here is the plan:\n\n');
parser.write('<mfui>{"component":"app.task_list","spec":{"title":"Next","items":[]}}</mfui>');
parser.close();

return writer.response();
```

### Throws

Throws `MFUIServerError` when a provided manifest has an invalid shape.

## `MFUIStreamWriterOptions`

Options for `createMFUIStreamWriter()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | No | Generated `msg_*` id | Message id used in emitted `message.start` and `message.end` events. |

## `MFUIStreamWriter`

Writer returned by `createMFUIStreamWriter()`.

| Method | Type | Description |
| --- | --- | --- |
| `start()` | `() => void` | Emits `message.start` if the stream has not started yet. Called automatically by `text()`, `component()`, and `end()`. |
| `text(text, options)` | `(text: string, options?: { partId?: string }) => void` | Emits a text delta and appends it to the current projected message. Empty strings are ignored. |
| `component(input)` | <code>(input: <a href="#mfuicomponentinput">MFUIComponentInput</a>) =&gt; ProjectedComponentPart</code> | Validates a component spec, renders its projection, emits `component.snapshot`, and returns the projected component part. |
| `error(input)` | <code>(input: <a href="#mfuistreamerrorinput">MFUIStreamErrorInput</a>) =&gt; void</code> | Emits an MFUI `error` event and closes the stream. |
| `end(options)` | <code>(options?: <a href="#mfuistreamwriterendoptions">MFUIStreamWriterEndOptions</a>) =&gt; void</code> | Emits `message.end` with final portable text and closes the stream. |
| `response(init)` | `(init?: ResponseInit) => Response` | Returns a `text/event-stream` `Response` backed by the writer stream. |
| `snapshot()` | <code>() =&gt; <a href="#projectedmessage">ProjectedMessage</a> &#124; undefined</code> | Returns the current projected message, or `undefined` before the stream starts. |

## `MFUIComponentInput`

Input for `MFUIStreamWriter.component()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | No | Generated `cmp_*` id | Component part id. |
| `component` | `string` | Yes | n/a | Component name. Must match a manifest component. |
| `spec` | `unknown` | Yes | n/a | Component spec to validate and project. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata attached to the component part and stream event. |

## `MFUIStreamWriterEndOptions`

Options for `MFUIStreamWriter.end()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `usage` | `{ inputTokens?: number; outputTokens?: number }` | No | n/a | Optional model usage included in the final `message.end` event. |

## `MFUIStreamErrorInput`

Input for `MFUIStreamWriter.error()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `code` | `string` | Yes | n/a | Machine-readable error code. |
| `message` | `string` | Yes | n/a | Human-readable error message. |
| `recoverable` | `boolean` | No | n/a | Whether the error may be recoverable by the client. |

## `ProjectedMessage`

Projected assistant message shape used by `MFUIStreamWriter.snapshot()` and
adapter `onMessage` callbacks.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | n/a | Message id. |
| `parts` | `ProjectedMessagePart[]` | Yes | n/a | Projected text, component, and layout parts. |
| `portableText` | `string` | Yes | n/a | Deterministic text representation of the message. |
| `metadata` | <code><a href="#jsonobject">JsonObject</a></code> | No | n/a | Application metadata. |

## `createMFUIBlockParser()`

Creates a parser that converts provider text output containing `<mfui>` blocks
into MFUI stream writer calls.

### Import

```ts
import { createMFUIBlockParser } from '@mfui/server';
```

### Signature

```ts
function createMFUIBlockParser(
  mfui: MFUIManifest,
  writer: MFUIStreamWriter,
  options?: MFUIBlockParserOptions,
): MFUIBlockParser
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Current manifest. Reserved for parity with writer construction. |
| `writer` | <code><a href="#mfuistreamwriter">MFUIStreamWriter</a></code> | Yes | n/a | Writer that receives parsed text, component, and layout calls. |
| `options` | <code><a href="#mfuiblockparseroptions">MFUIBlockParserOptions</a></code> | No | `{}` | Parser options. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#mfuiblockparser">MFUIBlockParser</a></code> | Incremental parser for provider text chunks. |

### Throws

Throws `MFUIServerError` when a malformed or invalid MFUI block is encountered.
The writer also emits an `error` event before the exception is thrown.

## `MFUIBlockParserOptions`

Options for `createMFUIBlockParser()`.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `maxBlockLength` | `number` | No | `65536` | Maximum number of characters allowed inside one open `<mfui>` block. |

## `MFUIBlockParser`

Incremental parser returned by `createMFUIBlockParser()`.

| Method | Type | Description |
| --- | --- | --- |
| `write(text)` | `(text: string) => void` | Processes the next provider text chunk. Normal text is sent to `writer.text()`. Complete MFUI blocks are parsed and sent to `writer.component()`. |
| `flush()` | `() => void` | Flushes buffered normal text without ending the writer. Throws if an MFUI block is still open. |
| `close(options)` | <code>(options?: <a href="#mfuistreamwriterendoptions">MFUIStreamWriterEndOptions</a>) =&gt; void</code> | Flushes buffered text and calls `writer.end(options)`. |

## `MFUI_BLOCK_TAG`

Name of the XML-style tag that wraps MFUI component payloads in model text.

### Import

```ts
import { MFUI_BLOCK_TAG } from '@mfui/server';
```

### Value

```ts
const MFUI_BLOCK_TAG = 'mfui'
```

## `parseMFUIBlockPayload()`

Parses the JSON payload inside an `<mfui>` block.

### Import

```ts
import { parseMFUIBlockPayload } from '@mfui/server';
```

### Signature

```ts
function parseMFUIBlockPayload(payload: string): MFUIComponentInput
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `payload` | `string` | Yes | n/a | Raw JSON string between `<mfui>` and `</mfui>`. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#mfuicomponentinput">MFUIComponentInput</a></code> | Component name and spec parsed from the block payload. |

### Throws

Throws `MFUIServerError` when the payload is not valid JSON, not an object, or
does not contain `component` and `spec`.

## `validateMFUIManifest()`

Validates the shape of an MFUI manifest.

### Import

```ts
import { validateMFUIManifest } from '@mfui/server';
```

### Signature

```ts
function validateMFUIManifest(mfui: MFUIManifest): ValidationResult
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Manifest to validate. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#validationresult">ValidationResult</a></code> | `{ ok: true }` when valid, otherwise `{ ok: false, errors }`. |

## `assertValidMFUIManifest()`

Validates a manifest and throws when it is invalid.

### Import

```ts
import { assertValidMFUIManifest } from '@mfui/server';
```

### Signature

```ts
function assertValidMFUIManifest(mfui: MFUIManifest): void
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `mfui` | <code><a href="#mfuimanifest">MFUIManifest</a></code> | Yes | n/a | Manifest to validate. |

### Returns

| Type | Description |
| --- | --- |
| `void` | Returns nothing when valid. |

### Throws

Throws `MFUIServerError` with code `invalid_component_manifest` when invalid.

## `validateSpecWithManifest()`

Validates one component spec against one component manifest.

### Import

```ts
import { validateSpecWithManifest } from '@mfui/server';
```

### Signature

```ts
function validateSpecWithManifest(
  manifest: ComponentManifest,
  spec: unknown,
): ValidationResult
```

### Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `manifest` | <code><a href="#componentmanifest">ComponentManifest</a></code> | Yes | n/a | Component manifest containing the JSON Schema. |
| `spec` | `unknown` | Yes | n/a | Component spec to validate. |

### Returns

| Type | Description |
| --- | --- |
| <code><a href="#validationresult">ValidationResult</a></code> | Validation result from AJV. |

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

## `MFUIMessageHandler`

Callback type used by adapter `onMessage` options.

### Shape

```ts
type MFUIMessageHandler = (message: ProjectedMessage) => void | Promise<void>
```

## `MFUIErrorHandler`

Callback type used by adapter `onError` options.

### Shape

```ts
type MFUIErrorHandler = (error: unknown) => void | Promise<void>
```

## `MFUIResponseHooks`

Shared callback object shape used by adapter response options.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `onMessage` | <code><a href="#mfuimessagehandler">MFUIMessageHandler</a></code> | No | n/a | Called with the final projected message after the MFUI response is fully processed. |
| `onError` | <code><a href="#mfuierrorhandler">MFUIErrorHandler</a></code> | No | n/a | Called when provider stream processing or MFUI block parsing fails. |

## `MFUIServerError`

Error shape thrown by server validation, prompt, writer, and block parser helpers.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | `string` | Yes | n/a | Human-readable error message from `Error`. |
| `code` | `string` | Yes | n/a | Machine-readable MFUI error code. |
| `status` | `number` | Yes | `400` for MFUI validation errors | HTTP-oriented status code. |

## `SemanticStreamEvent`

Union of MFUI semantic SSE events emitted by `MFUIStreamWriter`.

### Shape

```ts
type SemanticStreamEvent =
  | { type: 'message.start'; id: string; createdAt?: string }
  | { type: 'text.delta'; partId: string; text: string }
  | { type: 'component.snapshot'; partId: string; component: string; spec: unknown; projection: { text: string }; metadata?: JsonObject }
  | { type: 'layout.snapshot'; partId: string; layout: 'mfui.columns'; columns: unknown[]; projection: { text: string }; metadata?: JsonObject }
  | { type: 'message.end'; id: string; portableText: string; usage?: { inputTokens?: number; outputTokens?: number } }
  | { type: 'error'; code: string; message: string; recoverable?: boolean }
```
