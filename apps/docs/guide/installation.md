# Installation

MFUI is split into a frontend package, a server package, and model adapters.
Install `@mfui/client` in the frontend, then install `@mfui/server` and the
adapter you need on the server.

## Frontend

::: code-group

```sh [npm]
npm install @mfui/client
```

```sh [pnpm]
pnpm add @mfui/client
```

```sh [yarn]
yarn add @mfui/client
```

```sh [bun]
bun add @mfui/client
```

:::

## Server

Install `@mfui/server` on the server first, then choose and install an adapter
below.

::: code-group

```sh [npm]
npm install @mfui/server
```

```sh [pnpm]
pnpm add @mfui/server
```

```sh [yarn]
yarn add @mfui/server
```

```sh [bun]
bun add @mfui/server
```

:::

### Choose An Adapter

Install the adapter for the provider or SDK your server uses.

| Package | Use when |
| --- | --- |
| `@mfui/openai-compatible` | You use Chat Completions-compatible APIs. |
| `@mfui/openai-responses` | You use OpenAI Responses. |
| `@mfui/anthropic` | You use Anthropic Messages. |
| `@mfui/gemini` | You use Gemini. |
| `@mfui/ai-sdk` | You use Vercel AI SDK. |

For example, with the OpenAI-compatible adapter:

::: code-group

```sh [npm]
npm install @mfui/openai-compatible
```

```sh [pnpm]
pnpm add @mfui/openai-compatible
```

```sh [yarn]
yarn add @mfui/openai-compatible
```

```sh [bun]
bun add @mfui/openai-compatible
```

:::

After installing the packages, continue to the quick start.
