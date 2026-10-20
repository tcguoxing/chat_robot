# chat_Robot 前端

Vue 3 + TypeScript + Element Plus + Vite，单用户模式，**没有登录/注册页**，打开就是聊天页。

## 功能

- `/chat` 单页聊天：多轮对话、发送中状态、失败兜底
- 附件：图片与纯文本（txt/md/csv/json 等），选择/预览/删除、大小与数量校验
- 显示每次回答的图执行信息：推理步数 / 工具调用次数
- 会话 id 用 `crypto.randomUUID()` 生成，作为后端 LangGraph checkpoint 的 `thread_id`

## 目录

```
src/
├── api/ai.ts           # fetch + FormData 调用后端 POST /chat
├── components/Chat.vue # 唯一页面
├── router/index.ts     # 只有 /chat（/ 与未知路径都重定向到 /chat）
├── App.vue
└── main.ts
```

## 配置

`.env`：

```bash
VITE_API_BASE_URL=/dev
```

`vite.config.ts` 已把 `/dev` 代理到 `http://localhost:3000`；部署时把 `VITE_API_BASE_URL` 改成后端实际地址。

## 开发

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # vue-tsc + vite build
npm run preview
```

> 后端需要先启动（默认 3000），并在 `be/.env` 里配置 `MODEL_API_KEY` 与 `MONGODB_URI`。
