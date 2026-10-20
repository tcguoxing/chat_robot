// ask ai
import router from '../router';
import request from './request';
import type { ApiResponse } from './request';

/** 后端 /chat 返回的数据结构 */
export interface ChatResponseData {
  content: string;
  tokenUsage?: Record<string, unknown> | null;
}

/** 对话请求参数 */
export interface ChatParams {
  info: string;
  sessionId: string;
  files?: File[];
}

const getBaseUrl = (): string => import.meta.env.VITE_API_BASE_URL || '/dev';

export const askKimi = async function (params: { info: string }) {
  return await request.get('/search', params);
};

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
): Promise<ApiResponse<ChatResponseData>> {
  const formData = new FormData();
  formData.append('info', params.info ?? '');
  formData.append('sessionId', params.sessionId ?? '');

  for (const file of params.files ?? []) {
    formData.append('files', file, file.name);
  }

  const token = localStorage.getItem('chatToken');
  const response = await fetch(`${getBaseUrl()}/chat`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  // 未授权：清理本地 token 并回到登录页（与 axios 拦截器行为保持一致）
  if (response.status === 401) {
    localStorage.removeItem('chatToken');
    router.replace('/');
    throw new Error('登录已过期，请重新登录');
  }

  let payload: ApiResponse<ChatResponseData> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<ChatResponseData>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.code !== 200) {
    throw new Error(payload?.message || `请求失败（HTTP ${response.status}）`);
  }

  return payload;
};
