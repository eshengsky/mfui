# Examples

The runnable example lives in `apps/examples`. It uses a Vue 3 + Vite client
and a Hono server that calls DashScope through the OpenAI-compatible Chat
Completions API.

Source code:
[github.com/eshengsky/mfui/tree/main/apps/examples](https://github.com/eshengsky/mfui/tree/main/apps/examples)

## Run Locally

Create `apps/examples/.env`:

```txt
DASHSCOPE_API_KEY=
```

Start the server:

```sh
pnpm --filter @mfui/examples dev:server
```

Start the client:

```sh
pnpm --filter @mfui/examples dev:client
```

Open `http://localhost:5180`.

The example keeps the component definition and Vue renderer in the client
under `client/src/components`, then sends the generated MFUI manifest to the
Hono server. The server merges `createMFUIPrompt(mfui)` into the model request
and returns the processed MFUI SSE stream with `createMFUIResponse(upstream, mfui)`.
It also logs the final `message.portableText` from `onMessage` so you can verify
the server-side projection.
