# MFUI Example

Minimal Vue 3 + Vite client and Hono server example for testing MFUI end to end.

## Run

Create `apps/examples/.env`:

```txt
DASHSCOPE_API_KEY=your_api_key
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
