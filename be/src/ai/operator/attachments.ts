import { BadRequestException } from '@nestjs/common';

/**
 * 上传文件的最小结构，便于在不启动 HTTP 服务的情况下做单元测试。
 */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface ImagePart {
  type: 'image_url';
  image_url: { url: string };
}

export interface AttachmentContent {
  /** 文本类附件拼接后的内容（图片附件不包含在内） */
  textContent: string;
  /** 图片附件，按 OpenAI 兼容的多模态格式传给模型 */
  imageParts: ImagePart[];
}

/** 单个文本附件最多读取的字符数，避免把上下文撑爆 */
export const MAX_TEXT_CHARS_PER_FILE = 20000;
/** 一次请求中所有文本附件合计的字符上限 */
export const MAX_TOTAL_TEXT_CHARS = 50000;

const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
];

const TEXT_EXTENSIONS = [
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.json',
  '.log',
  '.yml',
  '.yaml',
];

const getExtension = (filename: string): string => {
  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.slice(index).toLowerCase();
};

const isImageFile = (file: UploadedFileLike): boolean =>
  (file.mimetype || '').toLowerCase().startsWith('image/');

const isTextFile = (file: UploadedFileLike): boolean => {
  const mimetype = (file.mimetype || '').toLowerCase();
  if (mimetype.startsWith('text/') || mimetype === 'application/json') {
    return true;
  }
  return TEXT_EXTENSIONS.includes(getExtension(file.originalname));
};

const truncate = (text: string, limit: number): string =>
  text.length > limit ? `${text.slice(0, limit)}\n...(内容过长已截断)` : text;

/**
 * 把上传的附件转换成模型可消费的内容。
 *
 * - 图片：转成 image_url（data URI）
 * - 纯文本（txt/md/csv/json 等）：直接读取内容并拼进 prompt
 * - 其他二进制类型（pdf/docx/xlsx/pptx 等）：当前阶段无法解析，明确返回 400
 */
export function buildAttachmentContent(
  files: UploadedFileLike[] = [],
): AttachmentContent {
  const textChunks: string[] = [];
  const imageParts: ImagePart[] = [];
  let totalTextChars = 0;

  for (const file of files) {
    if (isImageFile(file)) {
      const base64 = file.buffer.toString('base64');
      imageParts.push({
        type: 'image_url',
        image_url: { url: `data:${file.mimetype};base64,${base64}` },
      });
      continue;
    }

    if (!isTextFile(file)) {
      const ext = getExtension(file.originalname) || file.mimetype || '未知类型';
      throw new BadRequestException(
        `暂不支持解析文件「${file.originalname}」（${ext}），` +
          '目前仅支持图片与纯文本文件（txt/md/csv/json 等）',
      );
    }

    const remaining = MAX_TOTAL_TEXT_CHARS - totalTextChars;
    if (remaining <= 0) {
      textChunks.push(
        `【附件 ${file.originalname}】内容超过长度上限，已忽略`,
      );
      continue;
    }

    const raw = truncate(
      file.buffer.toString('utf8'),
      Math.min(MAX_TEXT_CHARS_PER_FILE, remaining),
    );
    totalTextChars += raw.length;
    textChunks.push(`【附件 ${file.originalname}】\n${raw}`);
  }

  return { textContent: textChunks.join('\n\n'), imageParts };
}

/**
 * 统一提取模型回复的文本内容。
 * 某些 OpenAI 兼容实现会把 content 返回成数组（多模态格式）。
 */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) =>
        typeof part === 'string' ? part : (part?.text ?? ''),
      )
      .join('');
  }
  if (content && typeof content === 'object' && 'text' in content) {
    const text = (content as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return content == null ? '' : String(content);
}
