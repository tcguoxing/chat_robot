# chat_Robot · Agent 能力升级路线图

> **用法**：M0 → M7 逐条推进，每条都有「自检」。**自检过不了就不要往下走。**
> **主线是 agent 能力**，三个功能（tool calling / RAG / SSE）只是它的产物。

---

## 0. 起点：现状与已知问题

**技术栈**：NestJS 11 + LangChain JS v1 + LangGraph；模型走 `ChatOpenAI` 指向 Moonshot（`kimi-k2.5`）；前端 Vue3 + Element Plus；MongoDB 自建单机（**非 Atlas，因此没有 `$vectorSearch`**）。

**必须先解决的结构问题**：

1. **两个 agent 能力割裂** —— `createKimiAgent` 有工具没记忆；`createChatAgent` 有记忆没工具。后者是**手写单节点 `StateGraph`，没有循环——严格说它不是 agent，只是一个带记忆的 chain**。
2. **AI 层绕过 Nest DI** —— `AiModule` 只 provide `AiService`，而 `AiService` 内 `new AiOperator()` 手动实例化，类型退化成 `any`。
3. **前端调不通** —— `fe/src/api/ai.ts` 的 `chatKimi` 用 `request.get`，后端是 `@Post('chat')`。
4. **模型配置重复两份** —— `agents/kimi.ts:32-44` 与 `65-77` 几乎完全相同。
5. **`ThrottlerModule` 装了但未生效** —— `app.module.ts` 里配了 `forRoot`，但没注册 `APP_GUARD`。

---

## M0 · 先验证，别急着写

**目标**：把两个不确定因素钉死。**不过这两条，后面全是白写。**

### 0.1 Moonshot 是否支持 embeddings

决定 RAG 走云端还是本地模型。**一旦入库就换不动了**——不同模型的向量空间完全不兼容，换模型 = 重建整个库。

测试：`POST https://api.moonshot.cn/v1/embeddings`，`model: moonshot-v3-embedding`（OpenAI 兼容，复用现有 key）。

- **通了** → `OpenAIEmbeddings` 改 baseURL，**零新依赖零新 key**
- **不通** → 落本地 `Xenova/bge-small-zh-v1.5`（见 M6）

### 0.2 `kimi-k2.5` 在 `thinking:disabled` 下能否正常返回 tool_calls

整个 M2 押在这上面。现有代码虽然传了 tools，但**没有证据表明真的调用成功过**。

**自检**：两条 curl 都有预期输出。

---

## M1 · 理解 agent 循环 + 统一 agent

### 先搞懂循环

这决定后面所有判断力：

```
用户输入 → 模型思考 → 决定调用工具 → 执行工具 → 结果回灌
         → 模型再思考 →（再调工具 或 输出答案）
         ↑___________________________|
```

**关键**：循环圈数由模型自己决定，**不确定**。由此推出全部风险——

- 模型可能**不调用**工具（该查不查）
- 模型可能**反复调用**同一个工具（失控，烧 token）
- 模型可能**调错工具**（`description` 写得不好）
- 圈数越多，**上下文被工具结果越塞越满**（上下文爆炸）

> 对照：你现在的 `createChatAgent` 只跑一圈，**没有循环**，所以它不是 agent。

### 动手

- 把 `agents/kimi.ts` 拆成三个单一职责文件：
  - `model.ts` —— 唯一的 `ChatOpenAI` 构造点（消除两份重复配置）
  - `checkpointer.ts` —— 抽出 `MongoDBSaver` + MongoClient 复用逻辑
  - `agent.ts` —— 一个 `createAgent({ model, tools, checkpointer, systemPrompt })` 工厂，**替掉两个旧 agent**
- **关键事实**：`createAgent` 本身就同时支持 `tools` 和 `checkpointer`（见附录 B 实测），所以**那段手写 `StateGraph` 可以整个删掉**，工具 + 记忆一次到位
- 写 `systemPrompt`，明确「什么时候该调工具、什么时候不该」——不写会该查不查或滥用

**自检**：同一 `sessionId` 连问两轮，第二轮记得住第一轮；问「现在几点」能在日志里看到真实 tool_call。

---

## M2 · 工具工程（不只是「写个函数」）

### 四个工具

用 `tool()` + `zod`（项目已有 zod）：

| 工具 | 实现要点 |
|---|---|
| 时间 | 支持时区参数 |
| 天气 | 默认 wttr.in（免 key）；换数据源只动这一个文件 |
| 数学 | **用 `mathjs`，绝不用 `eval`** |
| 搜索 | 现有 `TavilySearch` 迁移过来 |

### 必须掌握的四个点

1. **`description` 是 prompt 的一部分**，不是注释。它直接决定模型何时调用、调用哪个。写不好 = 工具形同虚设。
2. **粒度权衡**：切太细 → 一次任务调十几次，token 爆炸；太粗 → 模型用不灵活。
3. **错误处理**：工具抛异常会中断整个 agent。正确做法是**把错误作为结果返回给模型**，让它自己修正参数重试——这是 agent 与普通函数调用的重要区别。
4. **工具定义本身耗 token**：每个工具的定义都要塞进上下文，工具多了会挤占空间。

### 顺手修

- `fe/src/api/ai.ts` 的 `chatKimi` 从 `get` 改 `post`
- 接通 `Chat.vue` 的附件上传（现在收了附件但 `handleSend` 没传，后端 `FilesInterceptor` 收了个寂寞）

**自检**：四句话各触发一次对应工具，看日志确认。

---

## M3 · 中间件层 ⭐ 重点

LangChain v1 把 **middleware 作为 agent 的核心扩展点**。用法就是给 `createAgent` 多传一个数组：

```ts
createAgent({ model, tools, checkpointer, middleware: [ /* ... */ ] })
```

### 按「为什么存在」分类

> 以下均在 `langchain@1.2.33` 顶层导出（见附录 B）。

**① 循环与成本控制（防失控）**

- `modelCallLimitMiddleware` —— 限制单次运行的模型调用次数
- `toolCallLimitMiddleware` —— 限制工具调用次数
- `contextEditingMiddleware` —— 编辑/清理上下文（丢弃旧的工具输出）

> ⚠️ **agent 会循环，一个 bug 就能烧光额度。这三个是安全气囊。**
> **建议起手就上 `modelCallLimitMiddleware`。**

**② 上下文管理（防爆 context）**

- `summarizationMiddleware` —— 历史超长自动摘要压缩
- `trimMessages` / `filterMessages` —— 裁剪、过滤历史
- `llmToolSelectorMiddleware` —— 工具太多时，用一个小模型动态挑选本次该给哪些工具

> 最后一个特别能体现深度：它说明你意识到「**工具定义本身就是上下文成本**」。

**③ 可靠性**

- `modelRetryMiddleware` / `toolRetryMiddleware` —— 重试
- `modelFallbackMiddleware` —— 主模型失败自动降级

**④ 安全合规**

- `humanInTheLoopMiddleware` —— 敏感工具人工审批
- `piiMiddleware` / `piiRedactionMiddleware` —— 敏感信息检测与脱敏
- `openAIModerationMiddleware` —— 内容审核

**⑤ 能力增强**

- `todoListMiddleware` —— 任务规划与拆解
- `dynamicSystemPromptMiddleware` —— 动态 system prompt
- `toolEmulatorMiddleware` —— 测试时模拟工具

### 建议起手三个

`modelCallLimitMiddleware`（防失控）+ `summarizationMiddleware`（防爆）+ `toolRetryMiddleware`（容错）。

**自检**：能说出「我的 agent 用了哪几个 middleware、各自解决什么问题」。
**这句话本身就是面试加分回答。**

---

## M4 · 记忆分层（最容易混的一块）

`createAgent` 有**四个**容易混淆的参数，对应四个不同层次（实测见附录 B）：

| 参数 | 是什么 | 生命周期 |
|---|---|---|
| `stateSchema` | agent **运行中**的自定义状态 | 单次运行 |
| `contextSchema` | **每次调用**的上下文（userId、权限、租户） | 单次调用 |
| `checkpointer` | **短期记忆**：会话消息历史 | 跨请求，绑定 session |
| `store` | **长期记忆**：跨会话的用户事实/偏好 | 永久，跨会话 |

**现状**：只有 `checkpointer`（`MongoDBSaver`），**没有 `store`**。

> **这是「懂 agent」的硬指标** —— 很多人把「记住这次对话」和「记住这个用户是谁」混为一谈。
> 放在面试里：问「怎么让 agent 记住用户上次问过什么」，答 `checkpointer` 是及格，答 `store` 才是优秀。

**自检**：能讲清短期/长期记忆的区别，以及为什么 agent 需要两种。

---

## M5 · SSE 流式 + 工具调用可视化

### 后端

新增 `POST /chat/stream`（保留原 `POST /chat` 降级）：

- `@Res()` 拿原生响应，手写 `data: {json}\n\n` 帧
- 数据源 `agent.streamEvents(inputs, { version: 'v2', configurable: { thread_id } })`，按事件分发：
  - `on_chat_model_stream` → 逐字 token
  - `on_tool_start` / `on_tool_end` → 工具状态
  - 结束 / 异常
- 响应头：`text/event-stream`、`no-cache`、`keep-alive`、`X-Accel-Buffering: no`

> ⚠️ **必须处理的坑**：全局 `ResponseInterceptor`（`main.ts:26`）会把所有返回值包成 `{code,message,data}`，**会污染 SSE 流**。
> 改法：拦截器里判断 `res.headersSent` 直接透传，或加 `@RawResponse()` 装饰器 + `Reflector` 显式跳过（**推荐后者，更清晰**）。

### 前端

**不能走 axios**（浏览器端拿不到流式），要用 `fetch` + `ReadableStream`，**绕开 `fe/src/api/request.ts` 封装**——其响应拦截器强依赖 `{code,message,data}` 契约。

需手动补 `Authorization`（`localStorage.chatToken`）和 `VITE_API_BASE_URL`。用 `AbortController` 支持中断，接到「清空对话」。

### 可视化（重点）

> **面试官看不到 tool call，就永远不会知道你写了 tool call。**

```
🔧 正在查询天气… weather(city="北京")
✓ 已获取，正在组织回答…
```

这块 UI 的信息密度**高于回答内容本身**——它直接证明这不是套壳。

**自检**：`curl -N` 看到**连续的** token 帧而非最后憋出一个完整 JSON；前端肉眼看到逐字出字 + 工具状态。

---

## M6 · RAG

### 依赖

`@langchain/textsplitters`（切分）、`@langchain/community`（文档加载器）——**这两个当前都没装**。

### 存储

新建 `be/src/kb/` 模块，两个 collection：文档元数据 + 切片（`{原文, 向量, docId, chunkIndex}`）。

### 检索：Mongo 存 + 进程内暴力 cosine

自建单机 Mongo 没有 `$vectorSearch`，但**你的规模下暴力算完全够用**：

```
5000 chunk × 512 维 × 4 字节 ≈ 10MB
每次查询 ≈ 250 万次乘加 → Node 里 < 10ms
```

**「暴力算」在这个规模下不丢人。等库到几十万片再谈向量数据库。**

### 接入方式：做成一个工具（agentic RAG）

让模型**自己决定**要不要查知识库。比「每次都检索」更聪明，闲聊时不会被无关内容污染，且天然复用 M2 的工具注册表。

### Embedding 层做成可替换

按 M0 结论二选一：

- **云端** → `OpenAIEmbeddings` 改 baseURL
- **本地** → `@huggingface/transformers` 包 `Xenova/bge-small-zh-v1.5`
  （ONNX / 512 维 / 量化约 100MB / 首次下载后可离线）
  **注意是新包名 `@huggingface/transformers`，不是旧的 `@xenova/transformers`**

### 几个必须做对的点

- **切分是 RAG 效果差的第一大元凶**。切太大 → 一片混多主题；切太碎 → 语义支离破碎。
  用 `RecursiveCharacterTextSplitter` + 适量 `overlap`。**效果不好时先怀疑切分。**
- **query 和 document 可能不对称** —— 有些模型（bge 系列尤甚）要求给 query 加固定前缀。
  **必须查具体模型卡**，漏了会导致检索质量莫名下降且极难 debug。
- **top-k 卡死**，别把整个库塞进 prompt。
- **专有名词 / 型号 / 错误码**（如 `XR-2000`、`E5021`）纯向量把握不住，需要时上 hybrid（向量 + BM25）。

**自检**：传一个内容独特的 md，问只有它能回答的问题，确认模型**调用了检索工具**且答案引用了文档内容。

---

## M7 · 上下文工程复盘 + 可观测性

**上下文工程**：回答「一次调用里 context 到底该放什么」——system prompt / 历史轮数 / 工具定义 / 检索结果 top-k。
**M3 的中间件基本都是为它服务的。**

**可观测性**：agent 是**非确定性**的，同一个问题两次可能不同，**没有可观测性就没法 debug**。
最小实现：把每次运行的**工具调用序列**记下来（M5 的可视化顺便就干了这件事）。

**自检**：能画出一次典型调用的完整 context 构成，并说明每部分为什么在里面。

---

## 附录 A · Agent 能力清单（概念速查）

| 编号 | 能力 | 一句话 |
|---|---|---|
| A1 | agent 循环本质 | 循环圈数不确定，由此推出全部风险 |
| A2 | 工具工程 | `description` 即 prompt；错误要回灌给模型 |
| A3 | 中间件层 | v1 的核心扩展点，五类用途 |
| A4 | 记忆分层 | state / context / checkpointer / store 四层 |
| A5 | 上下文工程 | context 里放什么、放多少 |
| A6 | 流式与可观测性 | 非确定性系统必须可观测 |
| A7 | 结构化输出 | `responseFormat` + zod，供程序消费 |
| A8 | 评估 | 怎么证明改完变好了（进阶，暂不做） |

---

## 附录 B · 已确认的技术事实（本机实测）

**已安装**：`langchain@1.2.33`、`@langchain/core@1.1.33`、`@langchain/langgraph@1.2.6`、`@langchain/openai@1.3.0`、`@langchain/mongodb@1.1.0`、`@langchain/tavily@1.2.0`、`@langchain/langgraph-checkpoint-mongodb@1.2.0`

**未安装**（RAG 需要）：`@langchain/textsplitters`、`@langchain/community`、`@langchain/classic`

**`createAgent` 参数**（`node_modules/langchain/dist/agents/types.d.ts`）：

```
tools(405)  systemPrompt(475)  stateSchema(520)  contextSchema(554)
checkpointer(559)  store(564)  responseFormat(618)  middleware(625)
name(629)  description(634)  signal(645)
```

**`langchain` 顶层导出的 middleware**：

```
modelCallLimitMiddleware      toolCallLimitMiddleware     summarizationMiddleware
contextEditingMiddleware      llmToolSelectorMiddleware   modelRetryMiddleware
toolRetryMiddleware           modelFallbackMiddleware     humanInTheLoopMiddleware
piiMiddleware                 piiRedactionMiddleware      openAIModerationMiddleware
todoListMiddleware            dynamicSystemPromptMiddleware  toolEmulatorMiddleware
```

另有：`trimMessages` `filterMessages` `createMiddleware` `initChatModel`；消息类 `AIMessage` / `HumanMessage` / `ToolMessage` / `Document`

**JS vs Python 现状**：LangChain v1 之后概念与 API 面基本 **1:1**（命名只是 camelCase vs snake_case）。真正的差距是**集成生态**：Python 官方集成 1000+，JS/TS 100+，主要影响文档加载器等 RAG 周边。**三个目标功能 JS 全部够用。**

---

## 附录 C · 可选（暂不做）

- **限流修复**：`ThrottlerModule` 装了但未生效（缺 `APP_GUARD` 注册）。属现存 bug，与路线图无关，可随时单独修。
- 访客回放模式、邀请码配额、用量看板 —— 已评估，暂不纳入。
