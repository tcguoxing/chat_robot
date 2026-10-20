# chat_Robot

单用户 AI 聊天机器人：**没有登录 / 注册 / 邀请码 / JWT**，打开页面即可对话，系统内置唯一用户 `admin`。模型 API Key 只配置在后端 `.env` 里。

后端用 **LangGraph** 编排 agent 循环（`state` / `node` / `edge` / `checkpointing`），LangChain 只保留「模型客户端 + 消息 + 工具定义」这一层。

## 项目结构

```
chat_Robot/
├── be/                 # 后端：NestJS 11 + LangGraph + MongoDB
│   └── src/
│       ├── ai/
│       │   ├── graph/          # LangGraph 图：state / nodes / edges / checkpointer
│       │   ├── operator/       # AI 编排门面（调用图、处理附件）
│       │   ├── model.ts        # ChatOpenAI 构造（唯一入口）
│       │   └── tools/          # 工具注册表
│       ├── common/             # 全局响应拦截器 / 异常过滤器
│       ├── app.module.ts
│       └── main.ts
├── fe/                 # 前端：Vue 3 + Element Plus + Vite
│   └── src/
│       ├── api/ai.ts           # fetch + FormData 调用 /chat
│       ├── components/Chat.vue # 唯一的页面：聊天
│       └── router/             # 只有 /chat
└── docs/
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、TypeScript、Element Plus、Vite |
| 后端 | NestJS 11、TypeScript |
| Agent 编排 | **LangGraph**（StateGraph / 条件边 / MongoDBSaver checkpoint） |
| 模型层 | `@langchain/openai`（OpenAI 兼容协议，可指向 DeepSeek / Kimi / Qwen 等） |
| 工具 | `@langchain/tavily`（可选） |
| 存储 | MongoDB（只用于 LangGraph 的消息 checkpoint） |

## 快速开始

### 1. 启动 MongoDB

checkpoint 需要 MongoDB（本地或远程均可）：

```bash
mongod --dbpath /your/mongo/data --port 27017
```

### 2. 配置后端

```bash
cd be
cp .env.example .env
# 必填：MODEL_API_KEY；按需修改 MODEL_BASE_URL / MODEL_NAME / MONGODB_URI
```

### 3. 启动

```bash
# 后端
cd be && pnpm install && pnpm start:dev

# 前端（另开终端）
cd fe && npm install && npm run dev
```

前端默认访问 `http://localhost:5173`，Vite 把 `/dev` 代理到后端 `http://localhost:3000`。

## API

### `POST /chat`

多轮对话（multipart/form-data），同一个 `sessionId` 复用同一个 LangGraph `thread_id`，历史由 MongoDB checkpoint 保存。

| 字段 | 类型 | 说明 |
|---|---|---|
| `info` | string | 用户输入 |
| `sessionId` | string | 会话 id（前端用 `crypto.randomUUID()` 生成） |
| `files` | file[] | 可选，图片或纯文本（txt/md/csv/json 等），单文件 ≤ 10MB，最多 50 个 |

响应（全局统一包装）：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": "回答内容",
    "steps": 2,
    "toolCalls": 1,
    "threadId": "会话 id",
    "user": { "id": "admin", "username": "admin", "role": "admin" },
    "tokenUsage": null
  }
}
```

### `GET /search?info=...`

单轮问答，不写会话记忆（内部使用一次性的 thread_id）。

### `GET /`

服务信息：单用户模式、内置 admin、图节点列表。

## LangGraph 图

```
        START
          │
          ▼
       prepare            复位运行时状态（admin / 计数器 / 步数上限）
          │
          ▼
        agent ◀──────────────┐
          │                  │
          ├── 有 tool_calls ─▶ tools     执行工具，ToolMessage 回灌
          │                  │
          ├── 达到步数上限 ──▶ limit ──▶ END
          │
          └── 无工具调用 ────▶ END
```

| 概念 | 在项目中的位置 |
|---|---|
| **State** | `be/src/ai/graph/state.ts`：`messages`、`user`(admin)、`stepCount`、`toolCallCount`、`maxSteps` |
| **Node** | `be/src/ai/graph/nodes.ts`：`prepare`、`agent`、`tools`、`limit` |
| **Edge** | `be/src/ai/graph/edges.ts`：`routeAfterAgent` 条件边 + 固定边 |
| **Checkpointing** | `be/src/ai/graph/checkpointer.ts`：`MongoDBSaver`，collection 为 `agent_checkpoints` / `agent_checkpoints_writes` |

## 环境变量（be/.env）

| 变量 | 必填 | 说明 |
|---|---|---|
| `MODEL_API_KEY` | ✅ | 模型 API Key（唯一需要用户提供的凭证） |
| `MODEL_BASE_URL` | ❌ | OpenAI 兼容接口地址，默认 `https://api.deepseek.com` |
| `MODEL_NAME` | ❌ | 模型名 |
| `MODEL_TEMPERATURE` | ❌ | 温度，默认 `0.6` |
| `MODEL_DISABLE_THINKING` | ❌ | 设为 `true` 时发送 `thinking: disabled`（Kimi/Qwen 等） |
| `AGENT_MAX_STEPS` | ❌ | 单轮最大推理步数，默认 `8` |
| `TAVILY_API_KEY` | ❌ | 不配置则不注册搜索工具 |
| `MONGODB_URI` | ✅ | MongoDB 连接串（checkpoint 用） |
| `DB_NAME` | ❌ | checkpoint 库名 |
| `PORT` | ❌ | 后端端口，默认 `3000` |

## 测试

```bash
cd be && pnpm test        # 单元测试：图循环、checkpoint 记忆、步数上限、附件解析
cd fe && npm run build    # vue-tsc + vite build
```

> `pnpm test:e2e` 需要可用的 MongoDB（LangGraph checkpoint 依赖）。
