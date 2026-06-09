# 示例

可运行示例位于 `apps/examples`。它使用 Vue 3 + Vite 客户端，以及一个通过 OpenAI 兼容 Chat Completions API 调用阿里云百炼的 Hono 服务端。

源码：
[github.com/eshengsky/mfui/tree/main/apps/examples](https://github.com/eshengsky/mfui/tree/main/apps/examples)

## 本地运行

创建 `apps/examples/.env`：

```txt
DASHSCOPE_API_KEY=
```

启动服务端：

```sh
pnpm --filter @mfui/examples dev:server
```

启动客户端：

```sh
pnpm --filter @mfui/examples dev:client
```

打开 `http://localhost:5180`。

示例把组件定义和 Vue 渲染器都放在客户端的 `client/src/components` 下，然后把生成的 MFUI manifest 发给 Hono 服务端。服务端把 `createMFUIPrompt(mfui)` 合并到模型请求里，并通过 `createMFUIResponse(upstream, mfui)` 返回处理后的 MFUI SSE 流。示例也会在 `onMessage` 中打印最终的 `message.portableText`，方便验证服务端投影。
