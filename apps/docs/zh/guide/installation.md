# 安装

MFUI 分为前端包、服务端包和模型适配器。前端安装 `@mfui/client`；服务端安装 `@mfui/server` 和所需适配器。

## 前端

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

## 服务端

服务端先安装 `@mfui/server`，再在下方选择并安装适配器。

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

### 选择适配器

按服务端使用的模型提供商或 SDK 安装对应适配器。

| 包 | 适用场景 |
| --- | --- |
| `@mfui/openai-compatible` | 使用兼容 Chat Completions 的 API。 |
| `@mfui/openai-responses` | 使用 OpenAI Responses。 |
| `@mfui/anthropic` | 使用 Anthropic Messages。 |
| `@mfui/gemini` | 使用 Gemini。 |
| `@mfui/ai-sdk` | 使用 Vercel AI SDK。 |

以 OpenAI 兼容适配器为例：

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

安装完成后，继续阅读快速开始。
