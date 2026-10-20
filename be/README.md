# chat_Robot 后端

NestJS + **LangGraph** 实现的单用户 AI 聊天服务。

- **没有认证**：登录、注册、JWT、邀请码、密码加密等全部移除，所有请求默认是内置用户 `admin`
- **只需要一个凭证**：模型 API Key 配置在 `.env` 的 `MODEL_API_KEY`
- **agent 循环由 LangGraph 图编排**：`state` / `node` / `edge` / `checkpointing`，LangChain 只负责模型客户端、消息与工具定义

## 技术栈

| 用途 | 依赖 |
|---|---|
| Web 框架 | NestJS 11 |
| 图编排 | `@langchain/langgraph` |
| 持久化 checkpoint | `@langchain/langgraph-checkpoint-mongodb`（MongoDB） |
| 模型客户端 | `@langchain/openai`（OpenAI 兼容协议） |
| 工具 | `@langchain/tavily`（可选） |
| 上传 | multer（Nest `FilesInterceptor`） |

## 目录结构

```
src/
├── ai/
│   ├── graph/
│   │   ├── state.ts        # AgentState：messages / user(admin) / 计数器 / maxSteps
│   │   ├── nodes.ts        # prepare / agent / tools / limit 节点
│   │   ├── edges.ts        # routeAfterAgent 条件路由 + 路径映射
│   │   ├── graph.ts        # StateGraph 组装与 compile({ checkpointer })
│   │   ├── checkpointer.ts # MongoDBSaver（复用 mongoose 连接）
│   │   ├── prompts.ts      # system prompt（说明 admin 身份与工具使用规则）
│   │   └── graph.spec.ts   # 图单元测试：循环 / 记忆 / 步数上限 / 路由
│   ├── operator/
│   │   ├── AiOperator.ts   # 调用图、附件 → 消息内容、结果整理
│   │   ├── attachments.ts  # 图片 → image_url，文本 → inline，其他 → 400
│   │   └── attachments.spec.ts
│   ├── tools/index.ts      # 工具注册表（没配 TAVILY_API_KEY 就不注册搜索）
│   ├── model.ts            # ChatOpenAI 的唯一构造点
│   ├── ai.controller.ts    # GET /search、POST /chat
│   ├── ai.service.ts       # 门面
│   └── ai.module.ts
├── common/filters/         # 全局响应包装 / 异常过滤
├── app.module.ts           # ConfigModule + MongooseModule.forRootAsync + AiModule
├── app.controller.ts       # GET / 返回模式与图信息
└── main.ts                 # bootstrap + Swagger
```

## LangGraph 图

```
        START
          │
          ▼
       prepare             复位：user=admin、stepCount/toolCallCount=0、maxSteps
          │
          ▼
        agent ◀──────────────┐
          │                  │
          ├── tool_calls ───▶ tools       执行工具，ToolMessage 回灌给模型
          │                  │
          ├── 步数达上限 ───▶ limit ──▶ END
          │
          └── 无 tool_calls ─▶ END
```

### 状态（state）

`be/src/ai/graph/state.ts`

| 字段 | reducer | 作用 |
|---|---|---|
| `messages` | `messagesStateReducer` | 对话历史；与 checkpointer 配合实现短期记忆 |
| `user` | 覆盖 | 固定 `admin`（单用户模式） |
| `stepCount` | 覆盖 | 本轮推理步数，由 agent 节点累加 |
| `toolCallCount` | 覆盖 | 本轮工具调用次数 |
| `maxSteps` | 覆盖 | 防死循环上限（`AGENT_MAX_STEPS`，默认 8） |

### 节点（node）

- `prepare`：每次运行复位运行时状态（checkpoint 会保留上一轮 history，计数器必须清零）
- `agent`：把 system prompt 临时拼到历史前面，调用模型；返回 AIMessage 并 `stepCount + 1`
- `tools`：`ToolNode` 执行上一条 AIMessage 的 tool_calls，把 ToolMessage 写回 state
- `limit`：达到步数上限时的兜底出口，避免无限工具循环烧 token

### 边（edge）

- `START → prepare → agent`
- `agent` 之后是条件边 `routeAfterAgent`：`tools` / `limit` / `END`
- `tools → agent`（循环）
- `limit → END`

### 持久化（checkpoint）

`MongoDBSaver` 按 `thread_id` 保存消息历史，collection：

- `agent_checkpoints`
- `agent_checkpoints_writes`

`thread_id` 就是前端传入的 `sessionId`；`GET /search` 使用一次性随机 thread_id，不落业务会话。

## 接口

### `POST /chat`

`multipart/form-data`：`info`、`sessionId`、`files[]`（图片或纯文本，单文件 10MB，最多 50 个）。

返回图执行结果：`content`、`steps`、`toolCalls`、`threadId`、`user`、`tokenUsage`。

### `GET /search?info=...`

单轮问答，无会话记忆。

### `GET /`

`{ mode: 'single-user', user: { role: 'admin' }, graph: {...} }`。

## 配置

```bash
cp .env.example .env
```

| 变量 | 必填 | 说明 |
|---|---|---|
| `MODEL_API_KEY` | ✅ | 模型 API Key（唯一的用户凭证） |
| `MODEL_BASE_URL` | ❌ | OpenAI 兼容接口，默认 `https://api.deepseek.com` |
| `MODEL_NAME` | ❌ | 模型名 |
| `MODEL_TEMPERATURE` | ❌ | 默认 `0.6` |
| `MODEL_DISABLE_THINKING` | ❌ | 设为 `true` 时发送 `thinking: disabled`（Kimi/Qwen 等） |
| `AGENT_MAX_STEPS` | ❌ | 单轮最大推理步数，默认 `8` |
| `TAVILY_API_KEY` | ❌ | 不配则不注册搜索工具 |
| `MONGODB_URI` | ✅ | checkpoint 必须 |
| `DB_NAME` | ❌ | checkpoint 库名 |
| `authSource` / `user` / `pass` | ❌ | MongoDB 认证（本地无认证留空） |
| `PORT` | ❌ | 默认 `3000` |

## 开发

```bash
pnpm install
pnpm start:dev     # 热重载
pnpm test          # 单元测试（不需要 Mongo/网络）
pnpm build         # nest build
pnpm test:e2e      # 需要可用 MongoDB
```

Swagger：`http://localhost:3000/api`。
