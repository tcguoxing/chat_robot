/** 后端 /chat 返回的数据结构 */
export interface ChatUser {
  id: string;
  username: string;
  role: 'admin';
}

export interface ChatResponseData {
  content: string;
  tokenUsage?: Record<string, unknown> | null;
  /** 本次运行模型推理步数 */
  steps?: number;
  /** 本次运行工具调用次数 */
  toolCalls?: number;
  /** 会话 id（后端 LangGraph checkpoint 的 thread_id） */
  threadId?: string;
  /** 单用户模式下固定的 admin 用户 */
  user?: ChatUser;
}

/** 后端统一响应格式 */
export interface ChatApiResponse {
  code: number;
  message: string;
  data: ChatResponseData;
}

/** 对话请求参数 */
export interface ChatParams {
  info: string;
  sessionId: string;
  files?: File[];
}

const getBaseUrl = (): string => import.meta.env.VITE_API_BASE_URL || '/dev';

/**
 * 调用 AI 对话接口
 *
 * 后端是 POST /chat + multer FilesInterceptor('files')，需要 multipart/form-data。
 * 这里用原生 fetch 而不是 axios：axios 1.x 会给 post 请求补
 * `Content-Type: application/x-www-form-urlencoded`，导致 FormData 上传时
 * 浏览器不会自动补 boundary，后端 multer 会报 "Multipart: Boundary not found"。
 */
export const chatKimi = async function (
  params: ChatParams,
): Promise<ChatApiResponse> {
  const formData = new FormData();
  formData.append('info', params.info ?? '');
  formData.append('sessionId', params.sessionId ?? '');

  for (const file of params.files ?? []) {
    formData.append('files', file, file.name);
  }

  const response = await fetch(`${getBaseUrl()}/chat`, {
    method: 'POST',
    body: formData,
  });

  let payload: ChatApiResponse | null = null;
  try {
    payload = (await response.json()) as ChatApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.code !== 200) {
    throw new Error(payload?.message || `请求失败（HTTP ${response.status}）`);
  }

  return payload;
};
